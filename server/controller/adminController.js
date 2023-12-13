const session = require('express-session');
const userModels = require('../model/userModels')
const bcrypt = require('bcrypt');


const isAdmin = (req) => req.session.admin === true;

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
    const filtered = req.params.filter
    let user
    if(filtered === "A-Z" && isAdmin(req)){
         user = await userModels.find().sort({name:1})
    }
    else if(filtered === 'Z-A' && isAdmin(req)){
         user = await userModels.find().sort({name:-1})
    }
    else if(filtered === "Blocked" && isAdmin(req)){
         user = await userModels.find({status:false})
    }
    else{
         user = await userModels.find({})
    }
    res.render('admin/userlist',{users:user})
}


const product = (req,res)=>{
    try {
        res.render('admin/product')
    } catch (error) {
        console.log("error occured cant load the page", error);
    }
}

const categories = (req,res)=>{
    try {
        res.render('admin/categories')
    } catch (error) {
        console.log("error occured loading page", error);
    }
}

const newproduct = (req,res)=>{
    try {
        res.render('admin/newproduct')
    } catch (error) {
        console.log("error occured loading page", error);
    }
}

module.exports={login, adminloginpost, adminpanel, userslist, product, categories, newproduct, userupdate, searchView, searchpost, sort}
