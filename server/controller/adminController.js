const session = require("express-session");
const userModels = require("../model/userModels");
const categoryModel = require("../model/categoryModel");
const productModel = require("../model/productModels");
const bcrypt = require("bcrypt");
const fs = require("fs");
const sharp = require("sharp");
const orderModel = require("../model/orderModel");
const couponModel = require("../model/couponModel");
const { findOne } = require("../model/walletModel");
const { default: puppeteer } = require("puppeteer");
const os = require("os");
const path = require("path");
const {
  alphanumValid,
  onlyNumbers,
  zerotonine,
  isFutureDate,
  uppercaseAlphanumValid
} = require("../../utils/validators/adminValidators");
const flash = require("express-flash");
const Excel = require("excel4node");

// <<<<<<<<<<<<<<<<<<-----------------Admin login page rendering------------------->>>>>>>>>>>>>>>>>
const login = (req, res) => {
  try {
    res.render("admin/adminlogin");
  } catch (error) {
    console.log("cant login this page", error);
  }
};

const adminloginpost = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await userModels.findOne({ email: email });
    const password = await bcrypt.compare(req.body.password, user.password);
    if (password && user.isAdmin) {
      req.session.admin = true;
      res.render("admin/adminpanel");
    } else {
      res.render("admin/adminlogin", { passworderro: "Invaild password" });
    }
  } catch (error) {
    res.render("admin/adminlogin", { emailerror: "Email is invaild" });
  }
};

// <<<<<<<<<<<<<<<<<<-----------------Admin pannel rendering------------------->>>>>>>>>>>>>>>>>

const adminpanel = (req, res) => {
  try {
    res.render("admin/adminpanel");
  } catch (error) {
    console.log("error loading page", error);
  }
};

// <<<<<<<<<<<<<<<<<<-----------------List users------------------->>>>>>>>>>>>>>>>>

const userslist = async (req, res) => {
  try {
    const user = await userModels.find({ isAdmin: false });
    res.render("admin/userlist", { users: user });
  } catch (error) {
    console.log(error);
  }
};

// <<<<<<<<<<<------------------ Block/UNBLOCK -------------------->>>>>>>>>>>>>>>
const userupdate = async (req, res) => {
  try {
    const email = req.params.email;

    const user = await userModels.findOne({ email: email });

    user.status = !user.status;
    await user.save();

    if (req.session.isAuth && req.session.userId == user._id) {
      req.session.isAuth = false;
    }
    res.redirect("/admin/userslist");
  } catch (error) {
    res.send("error occured");
    console.log("Error occure", error);
  }
};

// <<<<<<<<<<<------------------ SEARCH USER -------------------->>>>>>>>>>>>>>>

const searchpost = async (req, res) => {
  try {
    const searchName = req.body.search;
    const data = await userModels.find({
      name: { $regex: new RegExp(`^${searchName}`, "i") },
    });
    req.session.searchUser = data;
    res.redirect("/admin/searchView");
  } catch (error) {
    console.log("error occured", error);
  }
};

const searchView = (req, res) => {
  try {
    const user = req.session.searchUser;
    res.render("admin/userlist", { users: user });
  } catch (error) {
    console.log("error occured loading page", error);
  }
};

// <<<<<<<<<<<<<<<<<<-----------------User sorting------------------->>>>>>>>>>>>>>>>>

const sort = async (req, res) => {
  try {
    const option = req.params.option;
    if (option === "A-Z") {
      user = await userModels.find({ isAdmin: false }).sort({ name: 1 });
    } else if (option === "Z-A") {
      user = await userModels.find({ isAdmin: false }).sort({ name: -1 });
    } else if (option === "Blocked") {
      user = await userModels.find({ status: false });
    } else {
      user = await userModels.find({ isAdmin: false });
    }
    res.render("admin/userlist", { users: user });
  } catch (error) {
    console.log("error occuring while loading the page", error);
    res.render("admin/userlist", { users: [] });
  }
};

// <<<<<<<<<<<<<<<<<<-----------------Render category page(Admin side)------------------->>>>>>>>>>>>>>>>>

const categories = async (req, res) => {
  try {
    const category = await categoryModel.find({});
    res.render("admin/categories", { cat: category });
  } catch (error) {
    console.log("error occured loading page", error);
    res.send("error occured", error);
  }
};

// <<<<<<<<<<<<<<<<<<-----------------Render admin category page------------------->>>>>>>>>>>>>>>>>

const addcategory = async (req, res) => {
  try {
    res.render("admin/addcategories");
  } catch (error) {
    console.log("error occured");
  }
};

const addcategorypost = async (req, res) => {
  try {
    const categoryName = req.body.categoryName;
    const description = req.body.description;

    if (!categoryName.trim() || !description.trim()) {
      return res.render("admin/addcategories", {
        catexist: "category name and description must be required",
      });
    }
    const categoryExist = await categoryModel.findOne({ name: categoryName });
    if (categoryExist) {
      res.render("admin/addcategories", { catexist: "already exist" });
    } else {
      await categoryModel.create({
        name: categoryName,
        description: description,
      });
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log("error add post categories", error);
    res.send("error occured loading ");
  }
};

// <<<<<<<<<<<<<<<<<<-----------------List / Unlist category------------------->>>>>>>>>>>>>>>>>

const unlistcat = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await categoryModel.findOne({ _id: id });
    category.status = !category.status;
    await category.save();
    const products = await productModel.find({ category: id });
    await productModel.updateMany(
      { category: id },
      { $set: { status: category.status } }
    );
    res.redirect("/admin/Category");
  } catch (error) {
    console.log("error cant load this", error);
  }
};

// <<<<<<<<<<<<<<<<<<-----------------edit category page rendering------------------->>>>>>>>>>>>>>>>>

const editcat = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await categoryModel.findOne({ _id: id });
    res.render("admin/editcat", {
      itemcat: category,
      categoryInfo: req.session.categoryInfo,
      expressFlash: {
        categoryError: req.flash("categoryError"),
        descriptionError: req.flash("descriptionError"),
        categoryExistError: req.flash("categoryExistError"),
      },
    });
  } catch (error) {
    console.log("error editing", error);
    res.status(400).send("cant load this page");
  }
};

const editcatppost = async (req, res) => {
  try {
    const id = req.params.id;
    const catName = req.body.categoryName;
    const catDes = req.body.description;
    const categoryExist = await categoryModel.findOne({
      name: catName,
      _id: { $ne: id },
    });

    const catNameValid = alphanumValid(catName);
    const catDesValid = alphanumValid(catDes);
    req.session.categoryInfo = req.body;
    if (!catNameValid || !catDesValid) {
      req.flash("categoryError", "Enter a valid category name");
      req.flash("descriptionError", "Enter a valid category name");
      return res.redirect(`/admin/editcat/${id}`);
    }
    if (categoryExist) {
      req.flash("categoryExistError", "Category you entered is already exist!");
      return res.redirect(`/admin/editcat/${id}`);
    } else {
      req.session.categoryInfo = null;
      await categoryModel.updateOne(
        { _id: id },
        { $set: { name: catName, description: catDes } }
      );
      res.redirect("/admin/Category");
    }
  } catch (error) {
    console.log("error editing category", error);
    res.status(400).send("error loading this page", error);
  }
};

// <<<<<<<<<<<<<<<<<<-----------------product page rendering------------------->>>>>>>>>>>>>>>>>

const product = async (req, res) => {
  try {
    const product = await productModel.find({}).populate({
      path: "categories",
      options: { strictPopulate: false },
      select: "name",
    });
    res.render("admin/product", { product: product });
  } catch (error) {
    console.log("error occured cant load the page", error);
  }
};

// <<<<<<<<<<<<<<<<<<-----------------new product adding page rendering------------------->>>>>>>>>>>>>>>>>

const newproduct = async (req, res) => {
  try {
    req.session.productInfo = req.body;
    const category = await categoryModel.find({ status: true });
    res.render("admin/newproduct", {
      category: category,
      productInfo: req.session.productInfo,
      expressFlash: {
        productNameError: req.flash("productNameError"),
        categoryError: req.flash("categoryError"),
        stockError: req.flash("stockError"),
        mrpError: req.flash("mrpError"),
        priceError: req.flash("priceError"),
        discountError: req.flash("discountError"),
        descriptionError: req.flash("descriptionError"),
        displayError: req.flash("displayError"),
        strapTypeError: req.flash("strapError"),
        strapmaterialError: req.flash("starpmaterialError"),
        strapColorError: req.flash("strapColorError"),
        powerSourceError: req.flash("powerSourceError"),
        dialColorError: req.flash("dialColorError"),
        featureError: req.flash("featureError"),
      },
    });
    req.session.productInfo = null;
  } catch (error) {
    console.log("error occured loading page", error);
  }
};

const newproductpost = async (req, res) => {
  try {
    const {
      productName,
      category,
      images,
      stock,
      mrp,
      price,
      discount,
      description,
      displayType,
      strapType,
      strapMaterial,
      strapColor,
      powerSource,
      dialColor,
      feature,
    } = req.body;
    const productNameValid = alphanumValid(productName);
    const categoryValid = alphanumValid(category);
    const stockValid = onlyNumbers(stock);
    const mrpValid = onlyNumbers(mrp);
    const discountValid = zerotonine(discount);
    const descriptionValid = alphanumValid(description);
    const displayTypeValid = alphanumValid(displayType);
    const strapTypeValid = alphanumValid(strapType);
    const strapMaterialValid = alphanumValid(strapMaterial);
    const strapColorValid = alphanumValid(strapColor);
    const powerSourceValid = alphanumValid(powerSource);
    const dialColorValid = alphanumValid(dialColor);
    const featureValid = alphanumValid(feature);

    if (
      !productNameValid ||
      !categoryValid ||
      !stockValid ||
      !mrpValid ||
      !discountValid ||
      !descriptionValid ||
      !displayTypeValid ||
      !strapTypeValid ||
      !strapMaterialValid ||
      !strapColorValid ||
      !powerSourceValid ||
      !dialColorValid ||
      !featureValid
    ) {
      req.flash("productNameError", "Enter a valid product name");
      req.flash("categoryError", "Enter a valid product name");
      req.flash("stockError", "Enter a valid product name");
      req.flash("mrpError", "Enter a valid product name");
      req.flash("priceError", "Enter a valid product name");
      req.flash("discountError", "Enter a valid product name");
      req.flash("descriptionError", "Enter a valid product name");
      req.flash("displayError", "Enter a valid product name");
      req.flash("strapTypeError", "Enter a valid product name");
      req.flash("strapmaterialError", "Enter a valid product name");
      req.flash("strapColorError", "Enter a valid product name");
      req.flash("powerSourceErrorr", "Enter a valid product name");
      req.flash("dialColorError", "Enter a valid product name");
      req.flash("featureError", "Enter a valid product name");
      req.session.productInfo = req.body;
      return res.redirect("/admin/newproduct");
    }

    const newproduct = await productModel.create({
      name: productName,
      category: category,
      mrp: mrp,
      price: price,
      discount: discount,
      stock: stock,
      description: description,
      displayType: displayType,
      straptype: strapType,
      strapmaterial: strapMaterial,
      strapcolor: strapColor,
      powersource: powerSource,
      dialcolor: dialColor,
      feature: feature,
      images: req.files.map((file) => file.path),
    });
    req.session.productInfo = null;
    await newproduct.save();
    res.redirect("/admin/product");
  } catch (error) {
    res.status(400).send("error adding" + error.message);
    console.log("error adding", error);
  }
};

// <<<<<<<<<<<<<<<<<<-----------------Product list or unlist------------------->>>>>>>>>>>>>>>>>

const productUnlist = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await productModel.findOne({ _id: id });
    product.status = !product.status;
    await product.save();
    res.redirect("/admin/product");
  } catch (error) {
    console.log("product unlist error", error);
    res.status(400).send("error loading");
  }
};

// <<<<<<<<<<<<<<<<<<-----------------Update product page rendering------------------->>>>>>>>>>>>>>>>>

const updatepro = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await productModel.findOne({ _id: id });
    res.render("admin/updateproduct", {
      product: product,
      productInfo: req.session.productInfo,
      expressFlash: {
        productNameError: req.flash("productNameError"),
        categoryError: req.flash("categoryError"),
        stockError: req.flash("stockError"),
        mrpError: req.flash("mrpError"),
        priceError: req.flash("priceError"),
        discountError: req.flash("discountError"),
        descriptionError: req.flash("descriptionError"),
        displayError: req.flash("displayError"),
        strapTypeError: req.flash("strapError"),
        strapmaterialError: req.flash("starpmaterialError"),
        strapColorError: req.flash("strapColorError"),
        powerSourceError: req.flash("powerSourceError"),
        dialColorError: req.flash("dialColorError"),
        featureError: req.flash("featureError"),
      },
    });
  } catch (error) {
    console.log("error update product", error);
    res.status(400).send("error updating product");
  }
};

const editimg = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await productModel.findOne({ _id: id });

    if (!product) {
      res.status(404).send("Product not found");
      return;
    }
    res.render("admin/editimg", { product: product });
  } catch (error) {
    console.log("Error loading editimage page", error);
    res.status(400).send("Error loading this page");
  }
};

const updatepropost = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      productName,
      mrp,
      discount,
      productprice,
      stock,
      description,
      displayType,
      strapType,
      strapMaterial,
      strapColor,
      powerSource,
      dialColor,
      feature,
    } = req.body;
    const productNameValid = alphanumValid(productName);
    const stockValid = onlyNumbers(stock);
    const mrpValid = onlyNumbers(mrp);
    const discountValid = zerotonine(discount);
    const descriptionValid = alphanumValid(description);
    const displayTypeValid = alphanumValid(displayType);
    const strapTypeValid = alphanumValid(strapType);
    const strapMaterialValid = alphanumValid(strapMaterial);
    const strapColorValid = alphanumValid(strapColor);
    const powerSourceValid = alphanumValid(powerSource);
    const dialColorValid = alphanumValid(dialColor);
    const featureValid = alphanumValid(feature);
    if (
      !productNameValid ||
      !stockValid ||
      !mrpValid ||
      !discountValid ||
      !descriptionValid ||
      !displayTypeValid ||
      !strapTypeValid ||
      !strapMaterialValid ||
      !strapColorValid ||
      !powerSourceValid ||
      !dialColorValid ||
      !featureValid
    ) {
      req.flash("productNameError", "Enter a valid product name");
      req.flash("stockError", "Enter a valid product name");
      req.flash("mrpError", "Enter a valid product name");
      req.flash("priceError", "Enter a valid product name");
      req.flash("discountError", "Enter a valid product name");
      req.flash("descriptionError", "Enter a valid product name");
      req.flash("displayError", "Enter a valid product name");
      req.flash("strapTypeError", "Enter a valid product name");
      req.flash("strapmaterialError", "Enter a valid product name");
      req.flash("strapColorError", "Enter a valid product name");
      req.flash("powerSourceErrorr", "Enter a valid product name");
      req.flash("dialColorError", "Enter a valid product name");
      req.flash("featureError", "Enter a valid product name");
      req.session.productInfo = req.body;
      return res.redirect(`/admin/updatepro/${id}`);
    }
    req.session.productInfo = req.body;
    await productModel.updateOne(
      { _id: id },
      {
        $set: {
          name: productName,
          mrp: mrp,
          price: productprice,
          stock: stock,
          description: description,
          displaytype: displayType,
          straptype: strapType,
          strapmaterial: strapMaterial,
          strapcolor: strapColor,
          powersource: powerSource,
          dialcolor: dialColor,
          feature: feature,
        },
      }
    );
    res.redirect("/admin/product");
  } catch (error) {
    console.log("Error updating product", error);
    res.status(400).send("Error updating product");
  }
};

const deleteimg = async (req, res) => {
  try {
    const pid = req.query.pid;
    const filename = req.query.filename;

    if (fs.existsSync(filename)) {
      try {
        fs.unlinkSync(filename);
        res.redirect(`/admin/editimg/${pid}`);
        await productModel.updateOne(
          { _id: pid },
          { $pull: { images: filename } }
        );
      } catch (error) {
        console.log("cant delete image", error);
      }
    } else {
      res.send("image not found");
      console.log("image not found");
    }
  } catch (error) {
    console.log("Page not found", error);
    res.status(400).send("page not found error occured");
  }
};

const newimg = async (req, res) => {
  try {
    const id = req.params.id;
    const imgPaths = req.files.map((file) => file.path);

    const product = await productModel.findOne({ _id: id });

    if (product) {
      if (imgPaths.length > 0) {
        product.images.push(...imgPaths);
        await product.save();
        res.redirect(`/admin/updatepro/${id}`);
      } else {
        res.status(400).send("No images to add");
      }
    } else {
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.log("Error adding image", error);
    res.status(500).send("Error adding new image");
  }
};

const deletepro = async (req, res) => {
  try {
    const id = req.params.id;
    const filename = req.query.filename;
    const product = await productModel.findOne({ _id: id });
    if (product) {
      await productModel.deleteOne({ _id: id });
      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }
      res.redirect("/admin/product");
    } else {
      res.status(400).send("product not found");
    }
  } catch (error) {
    console.log("cant delete error", error);
    res.status(500).send("internal server error");
  }
};

// <<<<<<<<<<<<<<<<<<----------------Not yet done -------------------->>>>>>>>>>>>>>>>>>>>>

const resizeimg = async (req, res) => {
  console.log("resize is loading");
  try {
    const pid = req.params.pid;
    const filename = req.query.filename;
    console.log("product id", pid);
    console.log("filename :", filename);
    const product = await productModel.findOne({ _id: pid });

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const imagepath = fs.readFileSync(filename);
    const resizedImg = await sharp(imagepath).resize(522, 454).toBuffer();

    fs.writeFileSync(filename, resizedImg);
    console.log("Image resized and saved successfully");
    res.redirect(`/admin/editimg/${pid}`);
  } catch (error) {
    console.error("Error resizing image:", error);
    res.status(400).send("Can't resize or save image");
  }
};

const orderPage = async (req, res) => {
  try {
    const order = await orderModel.find({});
    res.render("admin/orderpage", { order });
  } catch (error) {
    console.log("error loading order page");
  }
};

const orderStatus = async (req, res) => {
  try {
    const { status, orderId } = req.body;
    const updateOrder = await orderModel.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: status, updatedAt: Date.now() } },
      { new: true }
    );

    if (updateOrder) {
      res.redirect("admin/orderPage");
    }
    res.status(400).send("cant change the order status error");
    console.log("error changing order status");
  } catch (error) {}
};

const couponView = async (req, res) => {
  try {
    const coupons = await couponModel.find({});

    res.render("admin/coupon", { coupons });
  } catch (error) {}
};

const addCouponView = async (req, res) => {
  try {
    res.render("admin/addcoupon", {
      expressFlash: {
        expiryError: req.flash("expiryError"),
        couponCodeError: req.flash("couponCodeError"),
      },
    });
  } catch (error) {}
};

const createCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      couponType,
      minimumPrice,
      discount,
      maxRedeem,
      expiry,
    } = req.body;

    const couponCodeValid = uppercaseAlphanumValid(couponCode)
    const expiryValid = isFutureDate(expiry)
    if (!couponCodeValid) {
      req.flash('couponCodeError',"Coupon code must be uppercase alphabet")
      return res.redirect('/admin/newcoupon')
    }
    if(!expiryValid){
      req.flash("expiryError","Invaild Date")
      return res.redirect('/admin/newcoupon')
    }
    const couponExist = await couponModel.findOne({ couponCode: couponCode });

    if (couponExist) {
      res.render("admin/addcoupon", {
        couponExisterror: "coupon code already exist",
      });
    } else {
      await couponModel.create({
        couponCode: couponCode,
        type: couponType,
        minimumPrice: minimumPrice,
        discount: discount,
        maxRedeem: maxRedeem,
        expiry: expiry,
      });
      res.redirect("/admin/couponList");
    }
  } catch (error) {
    console.log("coupon adding is not working",error);
    res.status(404).send("adding new coupon error", error);
  }
};

const couponUnist = async (req, res) => {
  try {
    const id = req.params.id;
    const coupons = await couponModel.findOne({ _id: id });
    coupons.status = !coupons.status;
    await coupons.save();
    res.redirect("/admin/couponList");
  } catch (error) {
    console.log("coupon unist error");
    res.status(404).send("error while unlisting coupon");
  }
};

const editCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const coupon = await couponModel.findOne({ _id: id });
    res.render("admin/editcoupon", {
      coupon,
      expressFlash: { existingCouponError: req.flash("existingCouponError"),
      expiryError: req.flash("expiryError"),
      couponCodeError: req.flash("couponCodeError"), },
    });
  } catch (error) {
    console.log("error rendering coupon page");
    res.status(404).send("error rendering edit coupon page");
  }
};

const editCouponPost = async (req, res) => {
  try {
    const {
      couponCode,
      couponType,
      minimumPrice,
      discount,
      maxRedeem,
      expiry,
    } = req.body;
    const id = req.params.id;
    const couponCodeValid = uppercaseAlphanumValid(couponCode)
    const expiryValid = isFutureDate(expiry)

    if (!couponCodeValid) {
      req.flash("couponCodeError", "Coupon code must be alphabet");
      return res.redirect(`/admin/editCouponGet/${id}`);
    }
    if (!expiryValid) {
      req.flash("expiryError","Invaild Date")
      return res.redirect(`/admin/editCouponGet/${id}`)
    }

    const existingCoupon = await couponModel.findOne({
      couponCode,
      _id: { $ne: id },
    });

    if (existingCoupon) {
      req.flash("existingCouponError", "coupon code is already exist");
      return res.redirect(`/admin/editCouponGet/${id}`);
    } else {
      const result = await couponModel.updateOne(
        { _id: id },
        {
          $set: {
            couponCode: couponCode,
            type: couponType,
            minimumPrice: minimumPrice,
            discount: discount,
            maxRedeem: maxRedeem,
            expiry: expiry,
          },
        }
      );
      res.redirect("/admin/couponList");
    }
  } catch (error) {
    console.log("Error during coupon edit:", error);
    res.status(404).send("Error happened during editing coupon");
  }
};

const chartDetails = async (req, res) => {
  try {
    const selected = req.body.selected;
    if (selected == "month") {
      const orderByMonth = await orderModel.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      const salesByMonth = await orderModel.aggregate([
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
            },
            totalAmount: { $sum: "$totalPrice" },
          },
        },
      ]);
      const responseData = {
        order: orderByMonth,
        sales: salesByMonth,
      };
      res.status(200).json(responseData);
    } else if (selected == "year") {
      const orderByYear = await orderModel.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      const salesByYear = await orderModel.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
            },
            totalAmount: { $sum: "$totalPrice" },
          },
        },
      ]);
      const responseData = {
        order: orderByYear,
        sales: salesByYear,
      };
      res.status(200).json(responseData);
    }
  } catch (error) {
    console.log("error occured admin chart");
    res.status(404).send("error occured ", error);
  }
};

const calculateSalesData = async (startDate, endDate) => {
  return await orderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: "",
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: "$totalPrice" },
      },
    },
  ]);
};

const downloadSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const salesData = await calculateSalesData(startDate, endDate);

    const products = await orderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          productName: { $first: "$items.productName" }, // Add this line
        },
      },
      {
        $lookup: {
          from: "product",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 1,
          totalSold: 1,
          productName: "$items.productName",
        },
      },
      {
        $sort: { totalSold: -1 },
      },
    ]);
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Report</title>
    <style>
        body {
            margin-left: 20px;
        }
    </style>
</head>
<body>
    <h2 align="center"> Sales Report</h2>
    Start Date:${startDate}<br>
    End Date:${endDate}<br> 
    <center>
        <table style="border-collapse: collapse;">
        <thead>
        <tr>
            <th style="border: 1px solid #000; padding: 8px;">Sl N0</th>
            <th style="border: 1px solid #000; padding: 8px;">Product Name</th>
            <th style="border: 1px solid #000; padding: 8px;">Quantity Sold</th>
        </tr>
    </thead>
    <tbody>
        <!-- Product Details -->
        ${products
          .map(
            (item, index) => `
            <tr>
                <td style="border: 1px solid #000; padding: 8px;">${
                  index + 1
                }</td>
                <td style="border: 1px solid #000; padding: 8px;">${
                  item.productDetails.name || "N/A"
                }</td>
                <td style="border: 1px solid #000; padding: 8px;">${
                  item.totalSold || 0
                }</td>
            </tr>`
          )
          .join("")}
    
        <!-- Total Orders and Revenue -->
        <tr>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;">Total No of Orders</td>
            <td style="border: 1px solid #000; padding: 8px;">${
              salesData[0].totalOrders || 0
            }</td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;">Total Revenue</td>
            <td style="border: 1px solid #000; padding: 8px;">${
              salesData[0].totalAmount || 0
            }</td>
        </tr>
    </tbody>
        </table>
    </center>
</body>
</html>
`;

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf();
    await browser.close();

    const downloadPath = path.join(os.homedir(), "Downloads");
    const pdfFilePath = path.join(downloadPath, "sales.pdf");

    fs.writeFileSync(pdfFilePath, pdfBuffer);

    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales.pdf");
    res.status(200).end(pdfBuffer);
  } catch (error) {
    console.log("error cant download the sales Report", error);
    res.status(404).send("Error downloading the sales report", error);
  }
};

const downloadSalesReportExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const salesData = await calculateSalesData(startDate, endDate);
    const products = await orderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          productName: { $first: "$items.productName" }, // Add this line
        },
      },
      {
        $lookup: {
          from: "product",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 1,
          totalSold: 1,
          productName: "$items.productName",
        },
      },
      {
        $sort: { totalSold: -1 },
      },
    ]);

    // Create a new Excel workbook and add a worksheet
    const wb = new Excel.Workbook();
    const ws = wb.addWorksheet("Sales Report");

    // Set up headers
    ws.cell(1, 1).string("Sl N0");
    ws.cell(1, 2).string("Product Name");
    ws.cell(1, 3).string("Quantity Sold");

    // Populate product details
    products.forEach((item, index) => {
      ws.cell(index + 2, 1).number(index + 1);
      ws.cell(index + 2, 2).string(item.productDetails.name || "N/A");
      ws.cell(index + 2, 3).number(item.totalSold || 0);
    });

    // Add Total Orders and Revenue
    ws.cell(products.length + 2, 2).string("Total No of Orders");
    ws.cell(products.length + 2, 3).number(salesData[0].totalOrders || 0);

    ws.cell(products.length + 3, 2).string("Total Revenue");
    ws.cell(products.length + 3, 3).number(salesData[0].totalAmount || 0);

    // Save the Excel file
    const downloadPath = path.join(os.homedir(), "Downloads");

    // Ensure the Downloads directory exists
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath);
    }

    const excelFilePath = path.join(downloadPath, "sales.xlsx");
    await wb.write(excelFilePath);

    // Send the Excel file to the client for download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=sales.xlsx");
    res.status(200).sendFile(excelFilePath);
  } catch (error) {
    console.log("Error generating or downloading the sales report", error);
    res.status(500).send("Error generating or downloading the sales report");
  }
};

const adlogout = async (req, res) => {
  req.session.admin = false;
  req.session.destroy();
  res.redirect("/admin");
};

module.exports = {
  login,
  adminloginpost,
  adminpanel,
  userslist,
  product,
  categories,
  newproduct,
  userupdate,
  searchView,
  searchpost,
  sort,
  addcategory,
  addcategorypost,
  newproductpost,
  unlistcat,
  editcat,
  editcatppost,
  productUnlist,
  updatepro,
  editimg,
  updatepropost,
  deleteimg,
  newimg,
  adlogout,
  deletepro,
  resizeimg,
  orderPage,
  orderStatus,
  couponView,
  addCouponView,
  createCoupon,
  couponUnist,
  editCoupon,
  editCouponPost,
  chartDetails,
  downloadSalesReport,
  downloadSalesReportExcel,
};
