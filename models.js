const mongoose = require("mongoose");
const otpSchema = require("./Authentication/model/OTP");
const userSchema = require("./User/model/User");
const userInMeetSchema = require("./VideoConferencing/model/Video");

module.exports = {
    getOTPModel: () => mongoose.connection.useDb("OTP").model("Authentication", otpSchema),
    getUserModel: () => mongoose.connection.useDb("User").model("User", userSchema),
    getUserInMeet:() => mongoose.connection.useDb("VideoConferencing").model("UserInMeet", userInMeetSchema),
};