require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");

const authRoute = require("./routes/auth");

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

const app = express();

// ✅ Fixed CORS Configuration
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

app.get("/allHoldings", async (req, res) => {
  let allHoldings = await HoldingsModel.find({});
  res.json(allHoldings);
});

app.get("/allPositions", async (req, res) => {
  let allPositions = await PositionsModel.find({});
  res.json(allPositions);
});

app.post("/newOrder", async (req, res) => {
  const { name, qty, price, mode } = req.body;

  const newOrder = new OrdersModel({ name, qty, price, mode });
  await newOrder.save();

  if (mode === "BUY") {
    let existing = await HoldingsModel.findOne({ name });

    if (existing) {
      const totalQty = existing.qty + qty;
      const totalCost = existing.avg * existing.qty + price * qty;
      const newAvg = totalCost / totalQty;

      existing.qty = totalQty;
      existing.avg = newAvg;
      existing.price = price;

      await existing.save();
    } else {
      const newHolding = new HoldingsModel({
        name,
        qty,
        avg: price,
        price,
        net: "+0.00%",
        day: "+0.00%",
      });

      await newHolding.save();
    }
  }

  res.send("Order saved and holding updated!");
});

app.get("/allOrders", async (req, res) => {
  let allOrders = await OrdersModel.find({});
  res.json(allOrders);
});

// ✅ Routes for auth (login/signup)
app.use("/", authRoute);

app.listen(PORT, () => {
  console.log("App started!");
  mongoose.connect(uri);
  console.log("DB started!");
});
