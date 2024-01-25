const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/TimeZone")
  .then(console.log("order database connected"))
  .catch((err) => console.log(err));

const orderSchema = mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  items: [
    {
      productName: {
        type: String,
      },
      productId: {
        type: String,
        required: true,
      },

      singleprice: {
        type: Number,
      },

      quantity: {
        type: Number,
      },
      price: {
        type: Number,
      },
      status: {
        type: String,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },
  shippingAddress: {
    type: Object,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
  },
});

const orderModel = new mongoose.model("orders", orderSchema);

module.exports = orderModel;
