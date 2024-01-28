const mongoose = require("mongoose");
const bcyrpt = require("bcrypt");
const generateReferralCode = require("../controller/userController");



const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phonenumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    types: [
      {
        saveas: {
          type: String,
        },
        fullname: {
          type: String,
        },
        adname: {
          type: String,
        },
        street: {
          type: String,
        },
        pincode: {
          type: Number,
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        country: {
          type: String,
        },
        mobilenumber: {
          type: Number,
        },
      },
    ],
  },
  status: {
    type: Boolean,
    default: true,
    required: true,
  },

  isAdmin: {
    type: Boolean,
    default: false,
  },

  usedCoupons: [
    {
      type: String,
    },
  ],

  referralCode: {
    type: String,
    unique: true
  },
});

const userModels = new mongoose.model("userdetails", userSchema);

module.exports = userModels;
