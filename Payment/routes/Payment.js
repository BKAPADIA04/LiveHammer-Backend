require("dotenv").config();
const express = require('express');
const paymentRouter = express.Router();
const Payment = require('../controller/Payment.js');
const { body } = require('express-validator');

paymentRouter.get('/',(req,res) =>
    {
        res.send("Onto the Payment Page!");
    }
);

paymentRouter.post('/sendStripeCredentials',Payment.sendStripeCredentials);

paymentRouter.post('/checkoutSession',Payment.checkoutSession);

exports.paymentRoute = paymentRouter;
