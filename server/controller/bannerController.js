const bannerModel = require("../model/bannerModel");
const categoryModel = require("../model/categoryModel");
const couponModel = require("../model/couponModel");
const productModel = require("../model/productModels");
const {
  alphanumValid,
  onlyNumbers,
  zerotonine,
} = require("../../utils/validators/adminValidators");
const fs = require('fs');
const { default: mongoose } = require("mongoose");

const bannerView = async (req, res) => {
  try {
    const banners = await bannerModel.find({});
    res.render("admin/bannerview", { banners });
  } catch (error) {
    console.log("error occure loading banner viewing", error);
  }
};

const addBanner = async (req, res) => {
  try {
    const categories = await categoryModel.find({});
    const products = await productModel.find({});
    const coupons = await couponModel.find({});
    bannerInfo = req.session.bannerInfo;
    res.render("admin/addbanner", {
      categories,
      products,
      coupons,
      bannerInfo,
      expressFlash: {
        titleError: req.flash("titleError"),
        subtitleError: req.flash("subtitleError"),
      },
    });
  } catch (error) {
    console.log("error occured adding banner", error);
  }
};

const addBannerPost = async (req, res) => {
  try {
    const { bannerLabel, bannerTitle, bannerSubtitle, image, bannerColor } =
      req.body;
    req.session.bannerInfo = req.body;

    const titleValid = alphanumValid(bannerTitle);
    const subtitleValid = alphanumValid(bannerSubtitle);

    if (!titleValid) {
      req.flash("titleError", "Enter valid title");
      return req.redirect("/admin/newbanner");
    }
    if (!subtitleValid) {
      req.flash("subtitleError", "Enter a valid subtitle");
      return res.redirect("/admin/newbanner");
    }
    req.session.bannerInfo = null;

    let bannerLink;

    if (bannerLabel == "category") {
      bannerLink = req.body.category;
    } else if (bannerLabel == "product") {
      bannerLink = req.body.product;
    } else if (bannerLabel == "coupon") {
      bannerLink = req.body.coupon;
    } else {
      bannerLink = req.body.general;
    }

    const newBanner = new bannerModel({
      title: bannerTitle,
      subtitle: bannerSubtitle,
      label: bannerLabel,
      image: {
        public_id: req.file.filename,
        url: `/uploads/${req.file.filename}`,
      },
      color: bannerColor,
      bannerlink: bannerLink,
    });

    await newBanner.save();
    const banners = await bannerModel.find({});
    res.render("admin/bannerview", { banners });
  } catch (error) {
    console.log("error occured adding ne banner", error);
  }
};

const unlistBanner = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("aaaaaab", id);
    const banner = await bannerModel.findOne({ _id: id });

    if (!banner) {
      res.status(404).send("banner is not found");
    }
    banner.active = !banner.active;
    console.log("aa", banner.active);
    await banner.save();

    res.redirect("/admin/bannerList");
  } catch (error) {
    console.log("unlist banner is not working", error);
  }
};

const editBanner = async (req, res) => {
  try {
    const id = req.params.id;
    const banner = await bannerModel.findOne({ _id: id });
    const products = await productModel.find({});
    const categories = await categoryModel.find({});
    const coupons = await couponModel.find({});
    res.render("admin/editbanner", { banner, products, categories, coupons,expressFlash:{
        titleError: req.flash("titleError"),
        subtitleError: req.flash("subtitleError"), 
    } });
  } catch (error) {
    console.log("error editing banner");
  }
};


const editBannerPost = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id);
        const {bannerLabel,bannerTitle,bannerSubtitle,bannerColor } = req.body;
        console.log("dssjs",req.body);
        const banner = await bannerModel.findOne({ _id: id });

        const subtitleValid = alphanumValid(bannerSubtitle);
        const titleValid = alphanumValid(bannerTitle);

        if (!titleValid || !subtitleValid) {
            req.flash("titleError", "Invalid Entry!");
            req.flash("subtitleError", "Invalid Entry!");
            return res.redirect(`/admin/updateBanner/${id}`);
        }

        let bannerLink;

        if (bannerLabel == "category") {
            bannerLink = req.body.category;
        } else if (bannerLabel == "product") {
            bannerLink = req.body.product;
        } else if (bannerLabel == "coupon") {
            bannerLink = req.body.coupon;
        } else {
            bannerLink = "general";
        }

        banner.bannerlink = bannerLink;
        banner.label = bannerLabel;
        banner.title = bannerTitle;
        banner.subtitle = bannerSubtitle;
        banner.color = bannerColor;

        // Handle image upload if a new image is provided
        if (req.file) {
            banner.image = {
                public_id: req.file.filename,
                url: `/uploads/${req.file.filename}`,
            };
        }

        await banner.save();
        res.redirect('/admin/bannerList');
    } catch (error) {
        console.log("Error editing post banner", error);
        res.status(500).send("Internal Server Error");
    }
};


const deleteBanner = async(req,res)=>{
    try {
        const id = req.params.id
        const banner = await bannerModel.findByIdAndDelete(id)

        if (banner && banner.image && banner.image.public_id) {
            const imagePath = `./uploads/${banner.image.public_id}`
            console.log(imagePath);
            await fs.unlinkSync(imagePath)
        }
        res.redirect('/admin/bannerList')
    } catch (error) {
        console.log("error deletingn the image from banner",error);
    }
}


const bannerUrl = async(req,res)=>{
    try {
        const banner = req.query.id
        if (banner.label=='category') {
            const categoryId = new mongoose.Types.ObjectId(banner.bannerlink)
            const category = await categoryModel.findOne({_id:categoryId})
            res.redirect(`/shop?category=${categoryId}`) 
        }   
        else if (banner.label =="product") {
            const productId = new mongoose.Types.ObjectId(banner.bannerlink)
            const product = await productModel.findOne({_id:productId})
            console.log('yeaaa',productId);
            res.redirect(`/shop?product=${productId}`)
        }
        else if (banner.label=='coupon') {
            const couponId = new mongoose.Types.ObjectId(banner.bannerlink)
            const coupon = await couponModel.findOne({_id:couponId})
            res.redirect('/Rewards')

        }else{
            res.redirect('/')
        }

    } catch (error) {
        console.log("bannerUrl is not working error",error);
    }
}
  

module.exports = { bannerView, addBanner, addBannerPost, unlistBanner, editBanner, editBannerPost,deleteBanner, bannerUrl };
