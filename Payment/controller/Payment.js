const express = require('express');
const { validationResult } = require("express-validator");
require("dotenv").config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.sendStripeCredentials = async(req,res) => {
    const errors = validationResult(req);
    const arr = errors.array();
    let success = true;
    if (!errors.isEmpty()) {
      success = false;
      return res.status(400).json({ success:success,error: arr });
    }

    const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    return res.status(200).json({ success:success, stripePublishableKey: stripePublishableKey, stripeSecretKey: stripeSecretKey });
}

exports.checkoutSession = async(req,res) => {
  try {
  const errors = validationResult(req);
    const arr = errors.array();
    let success = true;
    if (!errors.isEmpty()) {
      success = false;
      return res.status(400).json({ success:success,error: arr });
    }
  
  const { payment,email } = req.body;
  const amountInCents = Math.round(payment * 100);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Product',
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'http://localhost:3000/user/payment/success',
    cancel_url: 'http://localhost:3000/user/payment/cancel',
  });

  return res.status(200).json({ success:success, id: session.id });
}
catch(err){
  return res.status(500).json({ success:false, error: err.message });
}
}