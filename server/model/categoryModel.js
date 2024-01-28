const mongoose = require("mongoose");



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
