require("dotenv").config();
const {getUserModel,getOTPModel} = require("../../models.js");

const User = getUserModel();
const Auth = getOTPModel();

const express = require('express');
const mongoose = require('mongoose');
const { validationResult } = require("express-validator");


// first api - search the uniqueness of email and phone (in User)
// second and third api - create and verify OTP (in Authentication)
// fourth api - create User(in User)
exports.searchUser = async(req,res) => {
    const errors = validationResult(req);
    const arr = errors.array();
    let success = true; let found = true;
    if (!errors.isEmpty()) {
      success = false;
      return res.status(400).json({ success:success,error: arr });
    }
    const {email} = req.body;
    if (!email) {
        success = false;
        return res.status(400).json({ success:success,error: 'Email ID is required' });
      }
    
    try {
        const existingUser = await User.findOne({ 
            $and: [
              { 'email': email }, 
            ]
          });
        
          if(existingUser) {
                success = true;
                res.status(200).json({success:success, found:found, message: "User Found ",user:existingUser});
          }
          else {
                success = true; found = false;
                res.status(200).json({success:success, found:found, message: "User Not Found "});
          }
    } catch (dbError){
        success = false;
        console.error(dbError);
        res.status(500).json({ success:success,error: 'Failed to search the user' });
    }
}


exports.createUser = async(req,res) => {
    const errors = validationResult(req);
    const arr = errors.array();
    let success = true;
    if (!errors.isEmpty()) {
      success = false;
      return res.status(400).json({ success:success,error: arr });
    }
    const {email} = req.body;
    if (!email) {
        success = false;
        return res.status(400).json({ success:success,error: 'Email ID is required' });
      }
    const emailSearch = await User.findOne({email:email});
    if(emailSearch) {
        success = false;
        console.log("User with given credentials exists");
        res.status(400).send({success:success,message:"User with given credentials exists"});
    }
    else {
        try {
            const newUser = new User(req.body);
            const doc = await newUser.save();
            console.log("A new user has been created");
            res.status(201).json({ success:success,message:"A new user has been created"});
        } catch(error) {
            console.log(error);
            success = false;
            res.status(403).json({success:success,message:"Error creating the new user"});
        }
    }
}

exports.loginUser = async(req,res) => {
    const errors = validationResult(req);
    const arr = errors.array();
    let success = true; let found = true;
    if (!errors.isEmpty()) {
      success = false;
      return res.status(400).json({ success:success,error: arr });
    }
    const {email} = req.body;
    if (!email) {
        success = false;
        return res.status(400).json({ success:success,error: 'Email ID is required' });
      }
      try {
        const existingUser = await User.findOne({ 
            $and: [
              { 'email': email },
            ]
          });
        
          if(existingUser) {
                success = true;
                res.status(200).json({success:success, found:found, message: "Logged In"});
          }
          else {
                success = true; found = false;
                res.status(200).json({success:success, found:found, message: "Login Unsuccessful"});
          }
    } catch (dbError){
        success = false;
        console.error(dbError);
        res.status(500).json({ success:success,error: 'Failed to search the user' });
    }   
}

exports.decodeUser = async (req,res) => {
    try {
      const user = await User.findOne({ 
        $or: [
          { 'email': req.body.email }, 
          {_id : req.body.id}
        ]
      });
      if(user)
        res.status(200).send(user);
      else 
        res.status(400).json({"message":"No User with these credentials"});
    } catch (err) {
      console.error(err);
      res.status(500).json({'error' : "Internal Server Error"});
    }
  }

