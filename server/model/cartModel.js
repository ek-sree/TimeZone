const mangoose = require("mongoose");

mangoose
  .connect("mongodb://127.0.0.1:27017/TimeZone")
  .then(console.log("Cart database connected"))
  .catch((error) => console.error("Error connecting cart database", error));

const cartSchema = new mangoose.Schema({
  userId: {
    type: mangoose.Schema.Types.ObjectId,
    ref: "userdetails",
  },
  item: [
    {
      productId: {
        type: mangoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      stock: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  total: Number,
});

const cartModel = mangoose.model("carts", cartSchema);

module.exports = cartModel;
