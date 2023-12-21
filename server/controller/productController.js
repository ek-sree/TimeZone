const productModel = require('../model/productModels');
const categoryModel = require('../model/categoryModel');

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


const singleproduct = async(req,res)=>{
    const pid = req.params.id
    const product = await productModel.findOne({_id: pid})
    res.render('user/singleproduct',{product:product})
}


module.exports = { products, singleproduct };
