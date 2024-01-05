const express = require('express')
const multer =require('multer')
const uploads = multer({dest:'uploads'})
const adminController = require('../controller/adminController')
const adauth= require('../../middleware/isAuth')


const adrouter = express.Router()

adrouter.get('/', adminController.login)

adrouter.post('/adminlogin', adminController.adminloginpost)

adrouter.get('/adminpanel',adauth.adminlogout, adminController.adminpanel)

adrouter.get('/userslist',adauth.adminlogout, adminController.userslist)

adrouter.get('/product',adauth.adminlogout, adminController.product)

adrouter.get('/Category',adauth.adminlogout, adminController.categories)

adrouter.get('/newproduct',adauth.adminlogout, adminController.newproduct)

adrouter.get('/update/:email',adminController.userupdate)

adrouter.post('/searchUser',adminController.searchpost)

adrouter.get('/searchView', adminController.searchView)

adrouter.get('/filter/:option', adminController.sort)

adrouter.get('/addcategories',adminController.addcategory)

adrouter.post('/add-category',adminController.addcategorypost)

adrouter.get('/unlistcat/:id' , adminController.unlistcat)

adrouter.get('/editcat/:id',adminController.editcat)

adrouter.post('/update-category/:id', adminController.editcatppost)

adrouter.post('/addproduct',uploads.array('images'),adminController.newproductpost)

adrouter.get('/unlist/:id', adminController.productUnlist)

adrouter.get('/updatepro/:id', adminController.updatepro)

adrouter.get('/editimg/:id',adminController.editimg)

adrouter.post('/updateproduct/:id', adminController.updatepropost)

adrouter.get('/deleteimg', adminController.deleteimg)

adrouter.post('/updateimg/:id', uploads.array('images'),adminController.newimg)

adrouter.get('/deletepro/:id', adminController.deletepro)

adrouter.get('/resizeimg/:id', adminController.resizeimg)

adrouter.get('/orderPage',adminController.orderPage)

adrouter.post('/updateOrderStatus', adminController.orderStatus)

adrouter.get('/adminlogout',adauth.adminlogout, adminController.adlogout)


module.exports= adrouter