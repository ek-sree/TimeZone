const session = require('express-session');
const userModels = require('../model/userModels')
const categoryModel = require('../model/categoryModel')
const productModel = require('../model/productModels')
const bcrypt = require('bcrypt');
const { name } = require('ejs');
const path = require('path')


const login = (req,res)=>{
    try {
        res.render('admin/adminlogin')
    } catch (error) {
        console.log('cant login this page',error);
    }
}

const adminloginpost = async(req,res)=>{
    try {
        const email = req.body.email
        const user = await userModels.findOne({email:email})
        const password = await bcrypt.compare(req.body.password, user.password)
        console.log("admin pass ready");
        if(password && user.isAdmin){
            req.session.admin = true
            res.render('admin/adminpanel')
        }else{
            res.render('admin/adminlogin',{passworderro:"Invaild password"})
        }
    } catch (error) {
        res.render("admin/adminlogin",{emailerror:"Email is invaild"})
    }
}

const adminpanel = (req,res)=>{
    try {
        res.render('admin/adminpanel')
    } catch (error) {
        console.log('error loading page', error);
    }
}

const userslist = async(req,res)=>{
    try {
        const user = await userModels.find({isAdmin:false})
        res.render('admin/userlist',{users:user})
    } catch (error) {
        console.log(error);
    }
}


// <<<<<<<<<<<------------------ Block/UNBLOCK -------------------->>>>>>>>>>>>>>>
const userupdate = async (req, res) => {
    try {
        const email = req.params.email;

        const user = await userModels.findOne({ email: email });

        user.status = !user.status
        await user.save()

        
            if(req.session.isAuth && req.session.userId == user._id){
            req.session.isAuth=false

            }
            res.redirect('/admin/userslist')
        
     } catch (error) {
        res.send('error occured')
        console.log("Error occure", error);
    }
};



// <<<<<<<<<<<------------------ SEARCH USER -------------------->>>>>>>>>>>>>>>

const searchpost= async(req,res)=>{
   try {
    const searchName = req.body.search
    const data = await userModels.find({name:{ $regex: new RegExp(`^${searchName}`, 'i') }})
    req.session.searchUser = data
    res.redirect('/admin/searchView')
   } catch (error) {
    console.log("error occured",error);
   }
}

const searchView =(req,res)=>{
    try {
        const user = req.session.searchUser
    res.render('admin/userlist',{users:user})
    } catch (error) {
        console.log("error occured loading page",error);
    }
}


const sort = async(req,res)=>{
    console.log("getting");
    try {
        const option = req.params.option
    console.log(option);
    if(option === 'A-Z' ){
        console.log("nnnooooo");
         user = await userModels.find({isAdmin:false}).sort({name:1})
         console.log("hhh");
    }
    else if(option === 'Z-A' ){
        console.log("tttt");
         user = await userModels.find({isAdmin:false}).sort({name:-1})
    }
    else if(option === 'Blocked' ){
         user = await userModels.find({status:false})
    }
    else{
         user = await userModels.find({isAdmin:false})
    }
    res.render('admin/userlist',{users:user})
    } catch (error) {
        console.log("error occuring while loading the page", error);
        res.render('admin/userlist',{users:[]})
    }
}


const categories = async(req,res)=>{
    try {
        const category = await categoryModel.find({})
        res.render('admin/categories',{cat:category})
    } catch (error) {
        console.log("error occured loading page", error);
        res.send("error occured", error)
    }
}

const addcategory = async(req,res)=>{
    try {
        res.render('admin/addcategories')
    } catch (error) {
        console.log("error occured");
    }
}

const addcategorypost = async(req,res)=>{
    try {
        const categoryName = req.body.categoryName
        const description = req.body.description
        const  categoryExist = await categoryModel.findOne({name:categoryName})
        if(categoryExist){
            res.render('admin/addcategories',{catexist:"already exist"})
        }
        else{
            await categoryModel.create({name:categoryName, description:description})
            res.redirect('/admin/addcategories')
            console.log("added");
        }
    } catch (error) {
        console.log("error add post categories",error);
        res.send("error occured loading ")
    }
}

const product = async(req,res)=>{
    try {
        const product = await productModel.find({}).populate({
            path:'category',
            select:'name'
        })
        res.render('admin/product',{product:product})
    } catch (error) {
        console.log("error occured cant load the page", error);
    }
}

const newproduct = async(req,res)=>{
    try {
        const category = await categoryModel.find()
        console.log("category",category);
        res.render('admin/newproduct',{category:category})
    } catch (error) {
        console.log("error occured loading page", error);
    }
}

const newproductpost = async(req,res)=>{
    try {
        const {productName, category, images, stock, mrp, price, description, displayType, strapType, strapMaterial, strapColor, powerSource,dialColor,feature} = req.body
        const newproduct = await productModel.create({
            name:productName,
            category:category,
            mrp:mrp,
            price:price,
            stock:stock,
            description:description,
            displayType:displayType,
            straptype:strapType,
            strapmaterial:strapMaterial,
            strapcolor:strapColor,
            powersource:powerSource,
            dialcolor:dialColor,
            feature:feature,
            images:req.files.map(file => file.path)
        })
        await newproduct.save()
        res.redirect('/admin/newproduct')
    } catch (error) {
        res.status(400).send("error adding"+ error.message)
        console.log("error adding",error);
    }
}



module.exports={login, adminloginpost, adminpanel, userslist, product, categories, newproduct, userupdate, searchView, searchpost, sort, addcategory, addcategorypost, newproductpost}
