const express = require('express');
const userRouter = express.Router();
const User = require('../controller/User.js');
const { body } = require('express-validator');

userRouter.get('/',(req,res) =>
{
    res.send("Onto the User Details Page!");
});

userRouter.post('/signup',User.createUser);

userRouter.post('/login',User.loginUser);

userRouter.post('/search',User.searchUser);

userRouter.post('/decode',User.decodeUser);

exports.userRoute = userRouter;