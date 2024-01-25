const { default: mongoose } = require("mongoose");
const mangoose = require("mongoose");

mangoose
  .connect("mongodb://127.0.0.1:27017/TimeZone")
  .then(console.log("Favourites database connected"))
  .catch((error) => console.error("Error connecting cart database", error));

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
