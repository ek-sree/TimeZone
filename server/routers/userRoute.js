const express = require('express')
const usercontroller = require('../controller/userController')
const collectionController = require('../controller/collectionController')
const productController = require('../controller/productController')
const bodyParser = require('body-parser')
const auth = require('../../middleware/isAuth')
const cartcontroller = require("../controller/cartController")
const checkoutcontroller = require('../controller/checkoutController')
const userModels = require('../model/userModels')
const bannerController = require('../controller/bannerController')



const usrouter = express.Router()

usrouter.use(bodyParser.json())
usrouter.use(bodyParser.urlencoded({extended:true}))

usrouter.get('/', usercontroller.home)

usrouter.get('/signup',auth.iflogged, auth.checkSessionVariable('signuppressed','/'), usercontroller.signup)

usrouter.post('/signuppost', auth.iflogged,usercontroller.signuppost)

usrouter.get('/otp',auth.checkSessionVariable('otppressed','/'), usercontroller.otp)

usrouter.post('/verifyOtp',auth.iflogged, usercontroller.verifyotp)

usrouter.post('/resendotp',auth.iflogged, usercontroller.resendotp)

usrouter.get('/login',auth.iflogged, auth.checkSessionVariable('loginpressed','/'), usercontroller.login)

usrouter.post('/loginaction',auth.iflogged, usercontroller.loginaction)

usrouter.get('/forgotpass',auth.checkSessionVariable('forgotpressed','/login'), usercontroller.forgot)

usrouter.post('/forgotpasspost',  usercontroller.forgotpasspost)

usrouter.get('/newpassword',auth.checkSessionVariable('newpasspressed','/forgotpass'), usercontroller.newpassword)

usrouter.post('/newpasswordpost',usercontroller.newpasswordpost)

usrouter.get('/profile', usercontroller.profile)

usrouter.get("/userdetails",auth.islogged, usercontroller.userdetails)

usrouter.get("/newAddress",auth.islogged, usercontroller.newAddress)

usrouter.post("/addressUpdating", usercontroller.newAddresspost)

usrouter.get("/editprofile",auth.islogged, usercontroller.editprofile)

usrouter.post('/updateprofile', usercontroller.editprofilepost)

usrouter.get('/changepass',auth.islogged, usercontroller.changepass)

usrouter.post("/changepasspost", usercontroller.changepasspost)

usrouter.get('/editaddress/:addressId',auth.islogged, usercontroller.editAddress)

usrouter.post("/updateaddress/:addressId", usercontroller.editAddresspost)

usrouter.get("/deleteaddress/:addressId",auth.islogged, usercontroller.deleteAddress)

usrouter.post('/select1', usercontroller.sortPrice);

usrouter.get('/orderTracking',auth.islogged, usercontroller.orderTracking)

usrouter.get('/singleorder/:id',auth.islogged, usercontroller.orderHistoryShown)

usrouter.get('/wallet',auth.islogged, usercontroller.wallet)

usrouter.post('/walletTopup',auth.islogged, usercontroller.walletTopup)

usrouter.get('/logout',auth.islogged, usercontroller.logout)




// ...

usrouter.get('/shop', collectionController.Collection);

usrouter.get('/shop/:id', productController.products);

usrouter.get('/singleproduct/:id', productController.singleproduct)



// ...


usrouter.get("/cart",auth.islogged, cartcontroller.cartView)

usrouter.get('/addtocart/:id',auth.islogged, cartcontroller.addToCart)

usrouter.post('/update-cart-quantity/:id',auth.islogged, cartcontroller.updateCart);

usrouter.get('/delete-cart/:id', cartcontroller.deleteCart);

usrouter.post('/cart', (req, res) => {
    console.log(`Received ${req.method} request at ${req.url}`);
    // Your existing code for handling the route
 });
 
// <<<<<<<<<--------facourite-------------->>>>>>>>>>>
usrouter.get("/favourites", cartcontroller.favouritesView)

usrouter.get('/addtofavourites/:id', cartcontroller.addToFav)

usrouter.get('/addtocartfrmfav/:id',auth.islogged, cartcontroller.favToCart)

usrouter.get('/deletefav/:id',cartcontroller.deleteFav)






usrouter.get('/checkout',auth.islogged, checkoutcontroller.checkOutView)

usrouter.post('/checkoutreload',auth.islogged, checkoutcontroller.checkoutreload);



usrouter.post('/placeOrder',auth.islogged, checkoutcontroller.orderingView)

usrouter.get('/orderdetails',auth.islogged, usercontroller.orderDetailsView)

usrouter.get('/cancelorder/:id',auth.islogged, usercontroller.ordercancelling)

usrouter.get('/returnorder/:id',auth.islogged, usercontroller.orderReturning)

usrouter.get('/cancelitem/:productId/:orderId',auth.islogged, usercontroller.itemCancel)

usrouter.get('/returnitem/:productId/:orderId',auth.islogged, usercontroller.itemReturn)

usrouter.get('/download-invoice/:orderId',auth.islogged, usercontroller.downloadInvoice)


usrouter.post('/wallettransaction',auth.islogged, usercontroller.walletTransaction)

usrouter.post('/create/orderId',auth.islogged, usercontroller.upi)


usrouter.get('/Rewards',usercontroller.coupons)

usrouter.post('/applyCoupon', usercontroller.couponApply)

usrouter.post('/revokeCoupon',usercontroller.revokedCoupon)


usrouter.get('/search',usercontroller.searchFunc)


usrouter.get('/bannerUrl', bannerController.bannerUrl)


usrouter.post('/rateAndReview',auth.islogged, usercontroller.ratingUser)

module.exports = usrouter