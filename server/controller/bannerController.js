const bannerModel = require("../model/bannerModel");
const categoryModel = require("../model/categoryModel");
const couponModel = require("../model/couponModel");
const productModel = require("../model/productModels");
const { alphanumValid,
    onlyNumbers,
    zerotonine}=require('../../utils/validators/adminValidators')



const bannerView = async(req,res)=>{
    try {
        const banners = await bannerModel.find({})
        res.render('admin/bannerview',{banners})
    } catch (error) {
        console.log("error occure loading banner viewing",error);
    }
}


const addBanner = async(req,res)=>{
    try {
        const categories = await categoryModel.find({})
        const products = await productModel.find({})
        const coupons = await couponModel.find({})
        bannerInfo = req.session.bannerInfo
        res.render('admin/addbanner',{categories,products,coupons,bannerInfo,expressFlash:{
            titleError:req.flash("titleError"),
            subtitleError:req.flash("subtitleError")}})
    } catch (error) {
        console.log("error occured adding banner",error);
    }
}

const addBannerPost = async(req,res)=>{
    try {
        const {bannerLabel,bannerTitle,bannerSubtitle,image,bannerColor} = req.body
         req.session.bannerInfo = req.body

         const titleValid = alphanumValid(bannerTitle)
         const subtitleValid = alphanumValid(bannerSubtitle)

         if (!titleValid) {
            req.flash("titleError","Enter valid title")
            return req.redirect('/admin/newbanner')
         }
         if (!subtitleValid) {
            req.flash("subtitleError","Enter a valid subtitle")
            return res.redirect("/admin/newbanner")
         }
         req.session.bannerInfo=null

         let bannerLink

         if(bannerLabel=="category"){
            bannerLink= req.body.category
         }
         else if (bannerLabel == "product") {
            bannerLink = req.body.product
         }
         else if (bannerLabel=="coupon") {
            bannerLink= req.body.coupon
         }
         else{
            bannerLink = req.body.general
         }

         const newBanner = new bannerModel({
            title:bannerTitle,
            subtitle:bannerSubtitle,
            label:bannerLabel,
            image:{
                public_id:req.file.filename,
                url:`/uploads/${req.file.filename}`
            },
            color:bannerColor,
            bannerlink:bannerLink
         })

         await newBanner.save()
         const banners = await bannerModel.find({})
         res.render('admin/bannerview', { banners });
    } catch (error) {
     console.log("error occured adding ne banner",error);   
    }
}


const unlistBanner = async(req,res)=>{
    try {
        const id = req.params.id
        console.log("aaaaaab",id);
        const banner = await bannerModel.findOne({_id:id})

        if (!banner) {
            res.status(404).send("banner is not found")
        }
        banner.active = !banner.active
console.log("aa",banner.active);
        await banner.save()

        res.redirect('/admin/bannerList')

    } catch (error) {
        console.log("unlist banner is not working",error);
    }
}

module.exports={bannerView,addBanner,addBannerPost,
unlistBanner}