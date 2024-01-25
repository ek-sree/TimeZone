const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect("mongodb://127.0.0.1:27017/TimeZone")
  .then(console.log("Product database is connected"))
  .catch((err) => console.log("cant connect", err));

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
