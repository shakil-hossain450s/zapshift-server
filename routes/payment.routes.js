require('dotenv').config();
const express = require('express');
const paymentRoutes = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

paymentRoutes.post('/create-payment-intent', async (req, res) => {
  try {
    const { amountInCents } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'bdt',
      payment_method_types: ['card']
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret 
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = paymentRoutes;