const categoryModel = require('../model/categoryModel')
const productModel = require('../model/productModels')

const Collection = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 6;

        const categorys = await categoryModel.find({ status: true });
        const products = await productModel.find({ status: true })
            .skip((page - 1) * perPage)
            .limit(perPage);

        const totalProducts = await productModel.countDocuments({ status: true });

        res.render('user/shop', { categorys, products, currentPage: page, perPage, totalProducts });
    } catch (error) {
        console.log("error showing category", error);
        res.status(500).send('Internal Server Error');
    }
};








module.exports = { Collection };
