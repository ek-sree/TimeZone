const express = require('express')
const usercontroller = require('../controller/userController')
const bodyParser = require('body-parser')
const auth = require('../../middleware/isAuth')



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

usrouter.get('/logout',auth.islogged, usercontroller.logout)

usrouter.get('/shop', usercontroller.shop)

module.exports = usrouter