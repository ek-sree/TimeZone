const productModel = require('../model/productModels');
const categoryModel = require('../model/categoryModel');
const { ObjectId } = require('mongodb');

console.log("product list working");

const products = async (req, res) => {
    try {
        console.log("checking here");
        const categoryId = req.params.id;
        console.log("id",categoryId);
       
        const categorys = await categoryModel.find({ status: true });
        console.log("stage1",categorys)

        const products = await productModel.find({ category: categoryId , status: true });
        console.log("stage2",products)
        res.render('user/shop', { products, categorys });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
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
console.log("ss",type);
        const convertedId = new ObjectId(pid);

        const result = await productModel.aggregate([
            {
                $match: { _id: convertedId },
            },
            {
                $unwind: { path: "$userRatings.rating" , preserveNullAndEmptyArrays: true},
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
        const similar = await productModel.find({ type: type, _id: { $ne: product._id } }).limit(4);

        res.render('user/singleproduct', { product, similar, averageRating, totalRatings });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = { products, singleproduct };
