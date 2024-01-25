const productModel = require("../model/productModels");
const categoryModel = require("../model/categoryModel");
const { ObjectId } = require("mongodb");

const products = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 6;

    const categoryId = req.params.id;
    const categorys = await categoryModel.find({ status: true });
    const products = await productModel
      .find({ category: categoryId, status: true })
      .skip((page - 1) * perPage)
      .limit(perPage);
    const totalProducts = await productModel.countDocuments({
      category: categoryId,
      status: true,
    });
    res.render("user/shop", {
      products,
      categorys,
      currentPage: page,
      perPage: perPage,
      totalProducts,
    });
  } catch (err) {
    console.log(err);
    res.render("user/serverError");
  }
};

const singleproduct = async (req, res) => {
  try {
    const pid = req.params.id;
    const product = await productModel.findOne({ _id: pid }).populate({
      path: "userRatings.userId",
      options: { strictPopulate: false },
      select: "name",
    });

    const type = product.type;
    const convertedId = new ObjectId(pid);

    const result = await productModel.aggregate([
      {
        $match: { _id: convertedId },
      },
      {
        $unwind: {
          path: "$userRatings.rating",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$userRatings.rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const averageRating = result.length > 0 ? result[0].averageRating : 0;
    const totalRatings = result.length > 0 ? result[0].totalRatings : 0;

    // Use product._id instead of _id
    const similar = await productModel
      .find({ type: type, _id: { $ne: product._id } })
      .limit(4);

    res.render("user/singleproduct", {
      product,
      similar,
      averageRating,
      totalRatings,
    });
  } catch (err) {
    console.log(err);
    res.render("user/serverError");
  }
};

module.exports = { products, singleproduct };
