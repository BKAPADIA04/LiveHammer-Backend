const connectToMongo=require('./db.js');
const express = require('express');
const cors = require('cors'); // cross browser
const http = require('http');
const path = require('path');
connectToMongo(); 


// This approach ensures that the server can handle both regular HTTP traffic and other protocols (like WebSocket) on the same port.
const server = express();
const port = 8080;

const httpServer = http.createServer(server); // connecting http server to express server
const socketServer = require('./VideoConferencing/controller/Video.js');
socketServer(httpServer); // Pass the server instance to the Socket.IO module

server.get('/', (req, res) => {
  res.send('Welcome to LiveHammer!')
})
server.use(cors()); // cross browser
server.use(express.json()); // reading json

//Router Section
//Authentication
const otpRouter = require('./Authentication/routes/OTP.js');
server.use('/auth',otpRouter.otpRoute);

//User
const userRouter = require('./User/routes/User.js');
server.use('/user',userRouter.userRoute);

//Video Conferenicng
const videoRouter = require('./VideoConferencing/routes/Video.js');
server.use('/video',videoRouter.videoRoute);

//Payment
const paymentRouter = require('./Payment/routes/Payment.js');
server.use('/payment',paymentRouter.paymentRoute);


httpServer.listen(port, () => {
  console.log(`LiveHammer App listening on port ${port}`)
})