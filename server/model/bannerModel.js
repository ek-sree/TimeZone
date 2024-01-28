const mongoose = require("mongoose");



const bannerSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },

  image: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  label: {
    type: String,
    required: true,
  },
  bannerlink: {
    type: String,
  },

  active: {
    type: Boolean,
    default: true,
  },
  color: {
    type: String,
    required: true,
  },
});

const bannerModel = mongoose.model("banners", bannerSchema);

module.exports = bannerModel;
