const categoryModel = require('../model/categoryModel')
const productModel = require('../model/productModels')

const Collection = async (req, res) => {
    try {
        console.log('heyyyyyyyyyyyyyyyyyyy');

    const categorys = await categoryModel.find({status:true });
    const products = await productModel.find({  status: true });
    console.log(categorys);
    res.render('user/shop', { categorys: categorys ,products:products});
    } catch (error) {
        console.log("error showing category", error);
    }
};





module.exports = { Collection };
