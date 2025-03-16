require("dotenv").config();
const {getOTPModel} = require("../../models.js");

// const OTP = require("../model/OTP.js");
// const Auth = OTP.Authentication;
const Auth = getOTPModel();
const mongoose = require('mongoose');
const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

// const otpStore = new Map();

// Generate a 6-digit OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Random 6-digit OTP
  }

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service:'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.MY_MAIL, 
    pass: process.env.MY_PASSWORD,
  },
  secure: false,
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.MY_MAIL, 
    to: email, // Recipient's email address
    subject: 'Your OTP Code For LiveHammer',
    text: `Hi! Your OTP code for LiveHammer is: ${otp}`, // Plain text body
  };

  await transporter.sendMail(mailOptions);
};

// const otpConnection = mongoose.connection.useDb("OTP");
// const Auth = otpConnection.model("OtpAuthentication", otpSchema);
exports.requestOTP = async (req,res) => {
    const errors = validationResult(req);
    const arr = errors.array();
    let success = true;
    if (!errors.isEmpty()) {
      success = false;
      return res.status(400).json({ success:success,error: arr });
    }

    const { email } = req.body;
    if (!email ) {
        success = false;
        return res.status(400).json({ success:success,error: 'Email ID is required' });
      }
    const otp = generateOtp();

    const salt = await bcrypt.genSalt(10);
    const bcryptOTP = await bcrypt.hash(otp, salt);
    // const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
    // otpStore.set(email, { otp, expiresAt });

    // console.log(email,otp);
    
    try {
      // Save the OTP and email to the database
      const existingDoc = await Auth.findOne({ 'email' : email });

      if (existingDoc) {
        // Update existing document
        existingDoc.otp = bcryptOTP;
        existingDoc.expiresAt = Date.now() + 5 * 60 * 1000;
        await existingDoc.save();
        console.log('OTP updated successfully for existing email');
      } else {
        // Create new document
        const newDoc = new Auth({
          email: email,
          otp: bcryptOTP,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
        await newDoc.save();
        console.log('New document created and OTP set');
      }
    
      try {
        // Send OTP email
        await sendOtpEmail(email, otp);
    
        // Respond with success message
        res.status(200).json({ success:success,message: 'OTP generated and sent successfully' });
      } catch (emailError) {
        success = false;
        console.error('Error sending OTP email:', emailError);
        res.status(500).json({ success:success,error: 'Failed to send OTP email' });
      }
    } catch (dbError) {
      success = false;
      console.error('Error saving OTP email:', dbError);
      res.status(500).json({ success:success,error: 'Failed to save OTP email' });
    }
   // console.log(`Generated OTP for ${name}: ${otp}`);
    // res.status(200).json({ message: 'OTP generated successfully', otp: otp });
}

exports.verifyOTP = async(req,res) => {

  const errors = validationResult(req);
  const arr = errors.array();
  let success = true;
  if (!errors.isEmpty()) {
    success = false;
    return res.status(400).json({ success:success,error: arr });
  }

    const { email, otp } = req.body;

    if (!email  || !otp) {
      success = false;
      return res.status(400).json({ success:success,error: 'Email and OTP are required' });
    }

    // const storedOtpData = otpStore.get(email);
    let storedOtpData = await Auth.findOne({'email' : email});
    if (!storedOtpData) {
        success = false;
        return res.status(400).json({ success:success,error: 'OTP not found or expired' });
      }
    // const { otp: storedOtp, expiresAt } = storedOtpData;

    // Check if the OTP is expired
    // if (Date.now() > expiresAt) {
    //     otpStore.delete(email); // Remove expired OTP
    //     return res.status(400).json({ error: 'OTP expired' });
    // }

    // Verify the OTP
    const storedOtp = storedOtpData.otp;
    const otpCompare = await bcrypt.compare(otp,storedOtp);
    if (otpCompare) {
        // otpStore.delete(email); // Clear OTP after successful verification
        const result = await Auth.deleteOne({ 'email': email });
        return res.status(200).json({ success:success,message: 'OTP verified successfully' });
    } else {
        success = false;
        return res.status(401).json({ success:success,error: 'Invalid OTP' });
    }
}


exports.adminAuth = async(req,res) => {
  const errors = validationResult(req);
  const arr = errors.array();
  let success = true;
  if (!errors.isEmpty()) {
    success = false;
    return res.status(400).json({ success:success,error: arr });
  }
  const { username, password } = req.body;

  if (!username  || !password) {
    success = false;
    return res.status(400).json({ success:success,error: 'Username and Password are required' });
  }

  const adminUser = process.env.USERNAME;
  const adminPass = process.env.PASSWORD;

  if((adminUser === username) && (adminPass === password)) {
    return res.status(200).json({success:success,'message' : 'Welcome, LiveHammer Admin!'});
  }
  else {
    success = false;
    return res.status(400).json({success:success,'error' : 'Please try to login with correct credentials'});
  }
}