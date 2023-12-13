const express = require('express')
const adminController = require('../controller/adminController')

const adrouter = express.Router()

adrouter.get('/', adminController.login)

adrouter.post('/adminlogin', adminController.adminloginpost)

adrouter.get('/adminpanel', adminController.adminpanel)

adrouter.get('/userslist', adminController.userslist)

adrouter.get('/product', adminController.product)

adrouter.get('/Category', adminController.categories)

adrouter.get('/newproduct', adminController.newproduct)

adrouter.get('/update/:email',adminController.userupdate)

adrouter.post('/searchUser',adminController.searchpost)

adrouter.get('/searchView', adminController.searchView)

adrouter.get('/filter/:filtered', adminController.sort)


module.exports= adrouter