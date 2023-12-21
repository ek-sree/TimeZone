const categoryModel = require('../model/categoryModel')
const productModel = require('../model/productModels')

const Collection = async (req, res) => {
    console.log('heyyyyyyyyyyyyyyyyyyy');

    const categorys = await categoryModel.find({status:true });
    const products = await productModel.find({  status: true });
    console.log(categorys);
    res.render('user/shop', { categorys: categorys ,products:products});
};





module.exports = { Collection };
