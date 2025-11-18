require('dotenv').config();
const express = require('express');
const paymentRoutes = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const ParcelsCollections = require('../models/parcel.model');
const PaymentsCollections = require('../models/payment.model'); // ✅ payment model
const verifyFirebaseToken = require('../middlewares/verifyFireBaseToken');


// get all payment history for admin
paymentRoutes.get('/all-payments', verifyFirebaseToken, async (req, res) => {
  try { 
    const paymentsHistory = await PaymentsCollections.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      paymentsHistory
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message,
    });
  }
})

// get payment history by email for user
paymentRoutes.get('/my-payments', verifyFirebaseToken, async (req, res) => {
  try {
    const userEmail = req.query.email;
    console.log(userEmail);

    let query = {};
    if (userEmail) {
      query = { email: userEmail }
    }

    const paymentsHistory = await PaymentsCollections.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      paymentsHistory
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message,
    });
  }
})

// Create Payment Intent
paymentRoutes.post('/create-payment-intent', async (req, res) => {
  try {
    const { amountInCents } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card']
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Payment Success
paymentRoutes.post('/success', async (req, res) => {
  try {
    const { parcelId, email, amount, transactionId, paymentMethod } = req.body;

    console.log(req.body);

    // Update Parcel Payment Status
    await ParcelsCollections.findByIdAndUpdate(
      parcelId,
      { $set: { paymentStatus: "Paid" } },
      { new: true }
    );

    // Create Payment History Record
    const paymentDocs = {
      parcelId,
      email,
      amount,
      transactionId,
      paymentMethod,
      status: "Paid",
    };

    const payment = await PaymentsCollections.create(paymentDocs);

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully!',
      payment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message,
    });
  }
});

module.exports = paymentRoutes;
