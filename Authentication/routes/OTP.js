const express = require('express');
const otpRouter = express.Router();
const OTP = require('../controller/OTP.js');
const { body } = require('express-validator');

otpRouter.get('/',(req,res) =>
{
    res.send("Onto the Authentication Page!");
});

otpRouter.post('/user/requestOTP',OTP.requestOTP);

otpRouter.post('/user/verifyOTP',OTP.verifyOTP);

otpRouter.post('/admin/',OTP.adminAuth);

exports.otpRoute = otpRouter;