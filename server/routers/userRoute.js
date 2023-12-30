const express = require('express')
const usercontroller = require('../controller/userController')
const collectionController = require('../controller/collectionController')
const productController = require('../controller/productController')
const bodyParser = require('body-parser')
const auth = require('../../middleware/isAuth')
const cartcontroller = require("../controller/cartController")
const checkoutcontroller = require('../controller/checkoutController')
const userModels = require('../model/userModels')



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

usrouter.get("/userdetails", usercontroller.userdetails)

usrouter.get("/newAddress", usercontroller.newAddress)

usrouter.post("/addressUpdating", usercontroller.newAddresspost)

usrouter.get("/editprofile", usercontroller.editprofile)

usrouter.post('/updateprofile', usercontroller.editprofilepost)

usrouter.get('/changepass', usercontroller.changepass)

usrouter.post("/changepasspost", usercontroller.changepasspost)

usrouter.get('/editaddress/:addressId', usercontroller.editAddress)

usrouter.post("/updateaddress/:addressId", usercontroller.editAddresspost)

usrouter.get("/deleteaddress/:addressId", usercontroller.deleteAddress)

usrouter.get('/logout',auth.islogged, usercontroller.logout)




// ...

usrouter.get('/shop', collectionController.Collection);

usrouter.get('/shop/:id', productController.products);

usrouter.get('/singleproduct/:id', productController.singleproduct)



// ...


usrouter.get("/addtocart/:id",cartcontroller.cartView)



usrouter.get("/favourites",cartcontroller.favouritesView)

usrouter.get('/addtofavourites/:id', cartcontroller.addToFav)


usrouter.get('/checkout', checkoutcontroller.checkOutView)

module.exports = usrouter