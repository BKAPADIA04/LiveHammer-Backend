const mongoose = require("mongoose");
const { Schema } = mongoose;

const otpSchema = new Schema({
    email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Basic email validation
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 5 * 60 * 1000, // Default to 5 minutes from now
    index: { expires: '1s' }, // TTL index for automatic deletion
  },
});

// exports.Authentication = mongoose.model("Authentication", otpSchema);
module.exports = otpSchema;