const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/TimeZone")
  .then(console.log("category databse is connected"))
  .catch((err) => console.log(err, "error connecting category database"));

const catSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
    default: true,
  },
});

const categoryModel = new mongoose.model("categories", catSchema);

module.exports = categoryModel;
