const mongoose = require("mongoose");



const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    Unique: true,
  },
  otp: {
    type: Number,
    require: true,
  },
  expiry: {
    type: Date,
    require: true,
  },
});

const otpModel = new mongoose.model("otp_details", otpSchema);

module.exports = otpModel;
