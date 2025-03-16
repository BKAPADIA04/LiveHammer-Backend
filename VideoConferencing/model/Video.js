const mongoose = require('mongoose');
const { Schema } = mongoose;

const userInMeetSchema = new Schema({
    socketId: {
        type: String,
        required: true,
        trim: true,
    },  
  name: {
    type: String,
    required: true,
    trim: true, // Removes extra spaces
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Email validation
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Validation for a 10-digit phone number
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  totalPurseRemaining: {
    type: Number,
    required: true,
    default: 50000, // Default to zero if no initial amount is provided
    min: [0, 'Total purse remaining cannot be negative'], // Prevents negative balances
  },
  totalPurseSpent: {
    type: Number,
    required: true,
    default: 0, // Default to zero
    min: [0, 'Total purse spent cannot be negative'], // Prevents negative values
  },
  itemsBought: [
    {
    //   itemId: {
    //     type: mongoose.Schema.Types.ObjectId, // References the auctioned item's ID
    //     ref: 'Item', // Refers to the items in another schema
    //   },
      itemName: {
        type: String,
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Item price cannot be negative'],
      },
      purchasedAt: {
        type: Date,
        default: Date.now, // Automatically sets the purchase date
      },
    },
  ],
  wishlist: {
    type: String, // Array of item names
  },
  address: {
    city: { type: String },
    state: { type: String },
    pincode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v); // Validation for a 6-digit pincode
        },
        message: (props) => `${props.value} is not a valid 6-digit pincode!`,
      },
    },
  },
//   profilePicture: {
//     type: String,
//     default: 'default-profile.png', // Default profile picture
//   },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// module.exports = (conn) => conn.model('User', userSchema);
module.exports = userInMeetSchema;
