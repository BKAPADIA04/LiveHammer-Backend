const { Server } = require('socket.io');
const {getUserInMeet,getUserModel} = require('../../models.js');
const {setBid} = require('../../Bidding/controller/Bid.js');
const UserInMeet = getUserInMeet();
const User = getUserModel();
const express = require('express');
const mongoose = require('mongoose');

module.exports = (server) => {
  // Initialize Socket.IO
  const io = new Server(server,{
    cors:{
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  const emailToSocketId = new Map();
  const socketIdToEmail = new Map();

  const findUserByEmail =  (email) => {
      return User.findOne({ email }).exec();
  };

  const findUserInMeet = (email) => {
    return UserInMeet.findOne({ email }).exec();
  };

  const findUserInMeetLeave = async (email) => {
    try {
      const user = await UserInMeet.findOne({ email }).exec();
      if (user) {
        return { success: true, user }; // User found
      } else {
        return { success: false, user: null }; // User not found
      }
    } catch (error) {
      console.error('Error while fetching user in meeting:', error);
      return { success: false, error }; // Error during query
    }
  };

  // Handle Socket.IO connections
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for custom events
    socket.on('room:join', (data) => {
      console.log('Message received:', data);
      const {email,room} = data;
      emailToSocketId.set(email,socket.id);
      socketIdToEmail.set(socket.id,email);

      // Emit a response
      // socket.emit('room:join', `Server received: ${data}`);
      // or
      io.to(room).emit('user:joined', {'email': email, 'room': room, 'socketId': socket.id});
      socket.join(room);
      io.to(socket.id).emit('room:join', data);
    });
    
    socket.on('user:call',(data) => {
      const {to,offer} = data;
      io.to(to).emit('incoming:call',{from:socket.id, offer : offer});
    });

    socket.on('call:accepted',(data) => {
      const {to,answer} = data;
      io.to(to).emit('call:accepted',{from:socket.id, answer:answer})
    });

    // Agora Chat
    socket.on('agora:join', async(data) => {
      console.log(data);
      const {email,channel} = data;
        try {
          // Query the database to retrieve user by email
          const user = await findUserByEmail(email);

          if (user) {
              console.log(`User with email ${email} found, user details: ${user.name}`);
              socket.join(channel); // User is joining the channel
              try {
                let userInMeeting = await findUserInMeet(email);
                // let userInMeeting = await UserInMeet.findOne({ email });
                if(!userInMeeting) {
                    userInMeeting = new UserInMeet({
                      socketId: socket.id,
                      email:email,
                      name: user.name,
                      phone: user.phone,
                      totalPurseRemaining: user.totalPurseRemaining,
                      totalPurseSpent: user.totalPurseSpent,
                      itemsBought: user.itemsBought,
                      wishlist: user.wishlist,
                      address: {
                          city: user.address.city,
                          state: user.address.state,
                          pincode: user.address.pincode,
                      }
                  });
                  const doc = await userInMeeting.save();
                  // console.log('UserInMeet instance saved:', userInMeeting);
                }
                else {
                  userInMeeting.socketId = socket.id;
                  await userInMeeting.save();
                  // console.log('UserInMeet instance updated with new socket ID:', userInMeeting);
                }
              } catch (error) {
                if (error.code === 11000) {
                  // Ignore duplicate key error
                    console.log('Duplicate entry detected, ignoring...');
                } else {
                    throw error; // Re-throw other errors
                }
              }
              // Send a welcome message to the channel
              io.to(channel).emit('agora:joined', { message: `Welcome to the Auction Room, ${user.name}!`});
          } else {
              console.log(`User with email ${email} not found.`);
              // Optionally, you can send an error response to the user
              socket.emit('agora:error', { message: 'User not found in the system' });
          }
      } catch (error) {
          console.error('Error fetching user for Agora join:', error);
          socket.emit('agora:error', { message: 'Error while fetching user details' });
      }
    });

    socket.on('agora:message', (data) => {
      console.log(data);
      const {channel,from, message} = data;
      io.to(channel).emit('agora:messageReceive',{from:from,message:message});
    });

    // Cache to track already processed users
const processedUsers = new Set();

socket.on('agora:leave', async (data) => {
  console.log(data);
  const { email, channel } = data;

  try {
    // Check if the user is already processed
    if (processedUsers.has(email)) {
      console.log(`User with email ${email} has already been processed. Skipping.`);
      return;
    }

    // Query the database to retrieve user by email
    const user = await findUserByEmail(email);

    if (user) {
      console.log(`User with email ${email} found, user details: ${user.name}`);
      socket.leave(channel); // User is leaving the channel

      try {
        // Check if the user exists in the meeting
        const userInMeetingResult = await findUserInMeetLeave(email);

        if (userInMeetingResult.success) {
          // Delete the user from the meeting
          await UserInMeet.deleteOne({ email });
          io.to(channel).emit('agora:left', { message: `Goodbye, ${user.name}!` });
        } else {
          console.log(`User with email ${email} is not in the meeting. Skipping.`);
        }
      } catch (error) {
        if (error instanceof mongoose.Error.DocumentNotFoundError) {
          console.log(`User with email ${email} was already removed. Adding to processed list.`);
        } else if (error.code === 11000) {
          console.log('Duplicate entry detected, ignoring...');
        } else {
          console.error('Error processing user in meeting:', error);
          socket.emit('agora:error', { message: 'Error while processing user in meeting' });
        }
      }
    } else {
      console.log(`User with email ${email} not found. Adding to processed list.`);
    }

    // Mark user as processed to avoid repeated errors
    processedUsers.add(email);
  } catch (error) {
    if (error instanceof mongoose.Error.DocumentNotFoundError) {
      console.log(`User with email ${email} not found during fetch. Adding to processed list.`);
      processedUsers.add(email);
    } else {
      console.error('Error fetching user for Agora leave:', error);
      socket.emit('agora:error', { message: 'Error while fetching user details' });
    }
  }
});

    socket.on('auction:priceUpdate',(data) => {
      const {from,channel,currentPrice} = data;
      console.log(data);
      io.to(channel).emit('auction:emittingNewPrice',{from:from,currentPrice:currentPrice});
      // call setBit for database
    });


    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
