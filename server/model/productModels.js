const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "categories",
    required: true,
  },
  mrp: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  images: {
    type: Array,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    required: true,
  },

  displaytype: {
    type: String,
    default: 0,
  },
  straptype: {
    type: String,
    default: 0,
  },
  strapmaterial: {
    type: String,
    default: 0,
  },
  strapcolor: {
    type: String,
    default: 0,
  },
  powersource: {
    type: String,
    default: "",
  },
  dialcolor: {
    type: String,
    default: "",
  },
  feature: {
    type: String,
    default: "",
  },
  userRatings: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userdetails",
        required: true,
      },
      rating: { type: Number },
      review: { type: String },
    },
  ],
});

const productModel = new mongoose.model("product", productSchema);

module.exports = productModel;
