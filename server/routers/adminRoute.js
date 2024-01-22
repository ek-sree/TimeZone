const express = require('express')
const multer =require('multer')
const uploads = multer({dest:'uploads'})
const adminController = require('../controller/adminController')
const adauth= require('../../middleware/isAuth')
const bannerController = require('../controller/bannerController')


const adrouter = express.Router()
adrouter.use(express.urlencoded({extended:true}))


adrouter.get('/',adauth.logoutAdmin, adminController.login)

adrouter.post('/adminlogin', adminController.adminloginpost)

adrouter.get('/adminpanel',adauth.loggedadmin, adminController.adminpanel)

adrouter.get('/userslist',adauth.loggedadmin, adminController.userslist)

adrouter.get('/product',adauth.loggedadmin, adminController.product)

adrouter.get('/Category',adauth.loggedadmin, adminController.categories)

adrouter.get('/newproduct',adauth.loggedadmin, adminController.newproduct)

adrouter.get('/update/:email',adauth.loggedadmin, adminController.userupdate)

adrouter.post('/searchUser',adauth.loggedadmin, adminController.searchpost)

adrouter.get('/searchView',adauth.loggedadmin, adminController.searchView)

adrouter.get('/filter/:option',adauth.loggedadmin, adminController.sort)

adrouter.get('/addcategories',adauth.loggedadmin, adminController.addcategory)

adrouter.post('/add-category',adauth.loggedadmin, adminController.addcategorypost)

adrouter.get('/unlistcat/:id' ,adauth.loggedadmin, adminController.unlistcat)

adrouter.get('/editcat/:id',adauth.loggedadmin, adminController.editcat)

adrouter.post('/update-category/:id',adauth.loggedadmin, adminController.editcatppost)

adrouter.post('/addproduct',adauth.loggedadmin, uploads.array('images'),adminController.newproductpost)

adrouter.get('/unlist/:id',adauth.loggedadmin, adminController.productUnlist)

adrouter.get('/updatepro/:id',adauth.loggedadmin, adminController.updatepro)

adrouter.get('/editimg/:id',adauth.loggedadmin, adminController.editimg)

adrouter.post('/updateproduct/:id',adauth.loggedadmin, adminController.updatepropost)

adrouter.get('/deleteimg',adauth.loggedadmin, adminController.deleteimg)

adrouter.post('/updateimg/:id',adauth.loggedadmin, uploads.array('images'),adminController.newimg)

adrouter.get('/deletepro/:id',adauth.loggedadmin, adminController.deletepro)

adrouter.get('/resizeimg/:id',adauth.loggedadmin, adminController.resizeimg)

adrouter.get('/orderPage',adauth.loggedadmin, adminController.orderPage)

adrouter.post('/updateOrderStatus',adauth.loggedadmin, adminController.orderStatus)

adrouter.get('/couponList',adauth.loggedadmin, adminController.couponView)

adrouter.get('/newcoupon',adauth.loggedadmin, adminController.addCouponView)

adrouter.post('/add_coupon',adauth.loggedadmin, adminController.createCoupon)

adrouter.get('/unlistCoupon/:id',adauth.loggedadmin, adminController.couponUnist)

adrouter.get('/editCouponGet/:id',adauth.loggedadmin, adminController.editCoupon)

adrouter.post('/updateCoupon/:id',adauth.loggedadmin, adminController.editCouponPost)

adrouter.post('/chartData',adauth.loggedadmin, adminController.chartDetails)

adrouter.post('/downloadsales',adauth.loggedadmin, adminController.downloadSalesReport)


adrouter.get('/bannerList',adauth.loggedadmin, bannerController.bannerView)

adrouter.get('/newbanner',adauth.loggedadmin, bannerController.addBanner)

adrouter.post('/addBanner',adauth.loggedadmin, uploads.single('image'),bannerController.addBannerPost)

adrouter.get('/unlistBanner/:id',adauth.loggedadmin, bannerController.unlistBanner)

adrouter.get('/updateBanner/:id',adauth.loggedadmin, bannerController.editBanner)

adrouter.post('/updateBannerPost/:id',adauth.loggedadmin, uploads.single('image'), bannerController.editBannerPost)

adrouter.get('/deleteBanner/:id',adauth.loggedadmin, bannerController.deleteBanner)

adrouter.get('/adminlogout',adauth.logouting, adminController.adlogout)


module.exports= adrouter