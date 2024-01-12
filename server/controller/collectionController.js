const categoryModel = require('../model/categoryModel')
const productModel = require('../model/productModels')

const Collection = async (req, res) => {
    try {
    const categorys = await categoryModel.find({status:true });
    const products = await productModel.find({  status: true });
    res.render('user/shop', { categorys: categorys ,products:products});
    } catch (error) {
        console.log("error showing category", error);
    }
};





module.exports = { Collection };
