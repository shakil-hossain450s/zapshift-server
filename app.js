require("dotenv").config();
const express = require("express");
const cors = require("cors");
const parcelRoutes = require("./routes/parcels.routes");
const paymentRoutes = require("./routes/payment.routes");
const usersRouter = require("./routes/users.routes");
const connectDB = require('./config/database.config');
const riderRoutes = require("./routes/rider.routes");
const walletRoutes = require("./routes/wallet.routes");

const app = express();

connectDB();

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
// users routes
app.use('/', usersRouter);
// rider routes
app.use('/', riderRoutes);
// wallet routes
app.use('/', walletRoutes);

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
