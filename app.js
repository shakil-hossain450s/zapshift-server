require("dotenv").config();
const express = require("express");
const cors = require("cors");
const parcelRoutes = require("./routes/parcels.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// default route
app.get("/", (req, res) => {
  res.send("ZapShift server is cooking");
});

// parcels routes
app.use('/', parcelRoutes);
// payment routes
app.use('/payments', paymentRoutes);

// 404 route 
app.use((req, res, next) => {
  res.status(404).send('Ooops! 404 - Page not found!');
});

// internal server error route 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('500 - Internal server error!');
});



module.exports = app;
