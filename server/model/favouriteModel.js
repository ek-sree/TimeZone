const { default: mongoose } = require("mongoose");
const mangoose = require("mongoose");



const favouritesSchema = new mongoose.Schema({
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
      price: {
        type: Number,
        required: true,
      },
    },
  ],
});

const favouritesModel = mangoose.model("favourites", favouritesSchema);

module.exports = favouritesModel;
