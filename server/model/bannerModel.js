const mongoose = require("mongoose");

mongoose
  .connect("mongodb://127.0.0.1:27017/TimeZone")
  .then(console.log("banner databse is connected"))
  .catch((err) => console.log(err, "error connecting category database"));

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
