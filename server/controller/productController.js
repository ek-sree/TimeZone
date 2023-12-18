// productController.js
const productModel = require('../model/productModels');

console.log("product list working");


const product = async (req, res) => {
    console.log("checking here");

    const category = req.params.id;
    const products = await productModel.find({ category:category, status: true });
    res.render('user/shop', { products,category });
    
};

module.exports = { product };
