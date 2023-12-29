
const checkOutView = async(req,res)=>{
    try {
        res.render('user/checkout')
    } catch (error) {
        console.log("cant show checkout page");
        res.status(400).send("cant rendering this page")
    }
}

module.exports = {checkOutView}