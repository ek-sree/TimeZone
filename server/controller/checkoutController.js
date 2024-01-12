const cartModel = require("../model/cartModel")
const categoryModel = require('../model/categoryModel')
const productModel = require('../model/productModels')
const userModels = require('../model/userModels')
const {nameValid,emailValid,phoneValid,passwordValid,confirmPasswordValid}=require("../../utils/validators/signupValidators")
const {  bnameValid, adphoneValid, pincodeValid}= require("../../utils/validators/addressValidator")
const orderModel = require("../model/orderModel")
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid');



const checkOutView = async(req,res)=>{
    try {
        const userId = req.session.userId
        const cartId = req.query.cartId
        const categories = await categoryModel.find()
        const user = await userModels.findById(userId)

        const addresslist = await userModels.findOne({_id:userId})

        if (!addresslist) {
            console.log("user ot found");
            return res.status(400).send("cant load this user not found")
        }

        const addresses = addresslist.address.types

        const cart = await cartModel.findById(cartId).populate('item.productId')

        for(const cartItem of cart.item || []){
            const product = await productModel.findById(cartItem.productId)
            if (cartItem.quantity > product.stock) {
                const nonitemid = cartItem.productId
                const theitem = await productModel.findOne({_id:nonitemid})
                const nameitem = theitem.name
                return res.render('user/cart',{cart,categories,message:`The product ${nameitem}'s quantity exceed stock limit`})

            }
        }

        const cartItems = (cart.item || []).map((cartItem) => ({
            productId: cartItem.productId._id,
            productName: cartItem.productId.name,
            price: cartItem.productId.price,
            quantity: cartItem.quantity,
            itemTotal: cartItem.total,
        }));

        res.render('user/checkout',{addresses, cartItems, categories, cart, cartId})
       
    } catch (error) {
        console.log("cant show checkout page");
        res.status(400).send("cant rendering this page")
    }
}


const checkoutreload = async(req,res)=>{
    try {
        const cartId = req.body.cartId
        console.log("is post address working");
        const {saveas,fullname,adname,street,pincode,city,state,country,phone} = req.body
        console.log("gettig in body",req.body);
        const userId = req.session.userId
        console.log("body id",userId);
        const userExisted = await userModels.findOne({_id:userId})
        console.log("bhhhhhhhhhhhhhhhhhhh",userExisted);
        const fullnamevalid=bnameValid(fullname)
        const saveasvalid=bnameValid(saveas)
        const adnameValid=bnameValid(adname)
        const streetValid=bnameValid(street)
        const pinvalid=pincodeValid(pincode)
        const cityValid=bnameValid(city)
        const stateValid=bnameValid(state)
        const countryValid=bnameValid(country)
        const phoneValid=adphoneValid(phone)
        console.log("assiing validation");
            if (!saveasvalid) {
                return res.redirect(`/checkoutpage?cartId=${cartId}`, { saveaserror: "Enter valid address type" });
            }
            if (!fullnamevalid) {
                return res.redirect(`/checkoutpage?cartId=${cartId}`, { fullnameerror: "Enter a valid fullname" });
            }
            if (!adnameValid) {
                return res.redirect(`/checkoutpage?cartId=${cartId}`, { adnameerror: "Enter a valid house or flat name" });
            }
            if (!streetValid) {
                return res.redirect(`/checkoutpage?cartId=${cartId}`, { streeterror: "Enter a valid street name" });
            }
            if (!pinvalid) {
                return res.redirect(`/checkoutpage?cartId=${cartId}`, { pinerror: "Enter a valid pincode" });
            }
            if (!cityValid) {
                return res.redirect(`/checkoutpage?cartId=${cartId}`, { cityerror: "Enter a valid city" });
            }
            if (!stateValid) {
                return res.redirect(`/checkoutpage?cartId=${cartId}`, { stateerror: "Enter a valid state" });
            }
            if (!countryValid) {
                return res.redirect(`/checkoutpage?cartId=${cartId}`, { countryerror: "Enter a valid country" });
            }
            console.log("eeeeeeeeeeeeee");
            // if (!phoneValid) {
            //     return res.redirect(`/checkoutpage?cartId=${cartId}`, { phoneerror: "Enter a valid Phone number" });
            // }
            console.log("validation of address completed");
            if (userExisted) {
                // Corrected query to find existing address for the user
                const existingAddress = await userModels.findOne({
                    '_id': userId,
                    "address.types": {
                        $elemMatch: {
                            saveas:saveas,
                            fullname: fullname,
                            adname: adname,
                            street: street,
                            pincode: pincode,
                            city: city,
                            state: state,
                            country: country,
                            mobilenumber: phone
                        }
                    }
                });
    
                if (existingAddress) {
                    
                    return res.redirect('/addAddress');
                }
    
                userExisted.address.types.push({
                    saveas,
                    fullname,
                    adname,
                    street,
                    pincode,
                    city,
                    state,
                    country,
                    mobilenumber:phone
                   
                });
                await userExisted.save();
            }
    
            const categories = await categoryModel.find();
            const addresslist = await userModels.findOne({ _id: userId });
    
            if (!addresslist) {
                console.log('User not found');
                // Handle the case where the user with the given userId is not found
                return res.status(404).send('User not found');
            }
    
            const addresses = addresslist.address.types;
    
            // Check if cartId is provided and is valid
            if (!cartId) {
                console.log('Cart ID not provided');
                return res.status(400).send('Cart ID not provided');
            }
    
            // Find the cart by ID
            const cart = await cartModel.findById(cartId).populate('item.productId');
    
            // Check if cart exists
            if (!cart) {
                console.log('Cart not found');
                return res.status(404).send('Cart not found');
            }
    
            const cartItems = cart.item.map((cartItem) => ({
                productName: cartItem.productId.name,
                quantity: cartItem.quantity,
                itemTotal: cartItem.total,
            }));
    console.log("jsbdhakljsholasjf",cartItems);
            console.log('Cart Total:', cart.total);
        

             
                    res.render("user/checkout",{addresses,cartItems,categories,cart}); 
        }
     catch (error) {
        console.log("cant add checkout addr");
        res.status(400).send("checkout addres not workoing")
    }
}


// <<<<<<<<<<<<<<<<<<--------------------Order details------------------->>>>>>>>>>>>>>>>>>>>>>>
const orderingView = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Retrieve selected address and payment method from the request body
        const { selectedAddressId, selectedPaymentOption, selectedProductNames, selectedProductIds, selectedProductPrices, selectedQuantities, selectedCartTotals } = req.body;

        // Find user and selected address
        const user = await userModels.findOne({
            _id: userId,
            "address.types._id": selectedAddressId,
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const selectedAddress = user.address.types.find((type) => type._id.equals(selectedAddressId));

        if (!selectedAddress) {
            return res.status(404).send("Selected address not found");
        }

        // Create items array
        const items = selectedProductNames.map((productName, index) => ({
            productId: selectedProductIds[index],
            productName: req.body.selectedProductNames[index],
            singleprice: parseInt(selectedProductPrices[index]),
            quantity: parseInt(selectedQuantities[index]), 
            price: parseInt(selectedCartTotals[index]),
        }));
        if (items.some(item => isNaN(item.quantity))) {
            const invalidItem = items.find(item => isNaN(item.quantity));
            console.log("Invalid quantity value found for item:", invalidItem);
            return res.status(400).send("Invalid quantity value found");
        }
        

        // Calculate total price
        const totalPrice = items.reduce((total, item) => total + item.price, 0);

        // Create and save order
        const order = new orderModel({
            orderId: uuidv4(),
            userId:userId,
            userName: selectedAddress.fullname,
            items,
            totalPrice,
            shippingAddress: selectedAddress,
            paymentMethod: selectedPaymentOption,
            createdAt: new Date(),
            status: "pending",
            updatedAt: new Date(),
        });
console.log("ssssss",order);
        console.log("Order saving process");
        await order.save();
        console.log("Order saved successfully");

        // Update user's cart and product stocks
        for (const item of items) {
            const updatedQuantity = -item.quantity; 
            await cartModel.updateOne({ userId }, { $pull: { item: { productId: item.productId } } });
            await cartModel.updateOne({ userId }, { $set: { total: 0 } });
            await productModel.updateOne({ _id: item.productId }, { $inc: { stock: updatedQuantity } });
        }

        console.log("Order processing completed");

        // Render order confirmation page
        res.render("user/orderConformation", { order });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(400).send("Error processing order");
    }
};






module.exports = {checkOutView, checkoutreload, orderingView}