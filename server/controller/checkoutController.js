const cartModel = require("../model/cartModel");
const categoryModel = require("../model/categoryModel");
const productModel = require("../model/productModels");
const userModels = require("../model/userModels");
const {
  nameValid,
  emailValid,
  phoneValid,
  passwordValid,
  confirmPasswordValid,
} = require("../../utils/validators/signupValidators");
const {
  bnameValid,
  adphoneValid,
  pincodeValid,
} = require("../../utils/validators/addressValidator");
const orderModel = require("../model/orderModel");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const couponModel = require("../model/couponModel");

const checkOutView = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cartId = req.query.cartId;
    const categories = await categoryModel.find();
    const user = await userModels.findById(userId);
    const availableCoupons = await couponModel.find({
      couponCode: { $nin: user.usedCoupons },
      status: true,
    });
    const addresslist = await userModels.findOne({ _id: userId });

    if (!addresslist) {
      return res.status(400).send("cant load this user not found");
    }

    const addresses = addresslist.address.types;

    const cart = await cartModel.findById(cartId).populate("item.productId");

    for (const cartItem of cart.item || []) {
      const product = await productModel.findById(cartItem.productId);
      if (cartItem.quantity > product.stock) {
        const nonitemid = cartItem.productId;
        const theitem = await productModel.findOne({ _id: nonitemid });
        const nameitem = theitem.name;
        return res.render("user/cart", {
          cart,
          categories,
          message: `The product ${nameitem}'s quantity exceed stock limit`,
        });
      }
    }

    const cartItems = (cart.item || []).map((cartItem) => ({
      productId: cartItem.productId._id,
      productName: cartItem.productId.name,
      price: cartItem.productId.price,
      quantity: cartItem.quantity,
      itemTotal: cartItem.total,
    }));
    res.render("user/checkout", {
      availableCoupons,
      addresses,
      cartItems,
      categories,
      cart,
      cartId,
    });
    
  } catch (error) {
    console.log("cant show checkout page");
    res.render("user/serverError");
  }
};

const checkoutreload = async (req, res) => {
  try {
    const cartId = req.body.cartId;
    const {
      saveas,
      fullname,
      adname,
      street,
      pincode,
      city,
      state,
      country,
      phone,
    } = req.body;
    const userId = req.session.userId;
    const userExisted = await userModels.findOne({
      _id: userId,
    });

    const fullnamevalid = bnameValid(fullname);
    const saveasvalid = bnameValid(saveas);
    const adnameValid = bnameValid(adname);
    const streetValid = bnameValid(street);
    const pinvalid = pincodeValid(pincode);
    const cityValid = bnameValid(city);
    const stateValid = bnameValid(state);
    const countryValid = bnameValid(country);
    const phoneValid = adphoneValid(phone);

    if (
      !saveasvalid ||
      !fullnamevalid ||
      !adnameValid ||
      !streetValid ||
      !pinvalid ||
      !cityValid ||
      !stateValid ||
      !countryValid ||
      !phoneValid
    ) {
      req.flash("saveaserror", "Enter valid address type");
      req.flash("fullnameerror", "Enter valid Name");
      req.flash("adnameerror", "Enter valid house or flat name");
      req.flash("streeterror", "Enter valid street name");
      req.flash("pinerror", "Enter valid pincode");
      req.flash("cityerror", "Enter valid city");
      req.flash("stateerro", "Enter valid state");
      req.flash("countryerror", "Enter valid country");
      req.flash("phoneerror", "Enter valid Phone number");
      return res.redirect(`/checkoutpage?cartId=${cartId}`);
    }

    // Ensure that the cartId is provided
    if (!cartId) {
      return res.status(400).send("Cart ID not provided");
    }

    // Find the cart by ID
    const cart = await cartModel.findById(cartId).populate("item.productId");

    // Check if cart exists
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    // Update user's cart and add a new address
    if (userExisted) {
      const existingAddress = userExisted.address.types.find(
        (addr) =>
          addr.saveas === saveas &&
          addr.fullname === fullname &&
          addr.adname === adname &&
          addr.street === street &&
          addr.pincode === pincode &&
          addr.city === city &&
          addr.state === state &&
          addr.country === country &&
          addr.mobilenumber === phone
      );

      if (existingAddress) {
        return res.redirect(`/checkoutpage?cartId=${cartId}`);
      }

      userExisted.address.types.push({
        saveas,
        fullname,
        adname,
        street,
        pincode,
        city,
        state,
        country,
        mobilenumber: phone,
      });

      await userExisted.save();
    }

    const user = req.session.userId
    const availableCoupons = await couponModel.find({
      couponCode: { $nin: user.usedCoupons },
      status: true,
    });
    const categories = await categoryModel.find();
    const addresslist = await userModels.findOne({
      _id: userId,
    });

    if (!addresslist) {
      return res.status(404).send("User not found");
    }
    const addresses = addresslist.address.types;

    const cartItems = cart.item.map((cartItem) => ({
      productId: cartItem.productId._id,
      productName: cartItem.productId.name,
      quantity: cartItem.quantity,
      itemTotal: cartItem.total,
    }));

    res.render("user/checkout", {
      addresses,
      cartItems,
      categories,
      cart,
      availableCoupons
    });
  } catch (error) {
    console.log("Error in checkout reload:", error);
    res.render("user/serverError");
  }
};

// <<<<<<<<<<<<<<<<<<--------------------Order details------------------->>>>>>>>>>>>>>>>>>>>>>>
const orderingView = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Retrieve selected address and payment method from the request body
    const {
      selectedAddressId,
      selectedPaymentOption,
      selectedProductNames,
      selectedProductIds,
      selectedProductPrices,
      selectedQuantities,
      selectedCartTotals,
    } = req.body;

    // Find user and selected address
    const user = await userModels.findOne({
      _id: userId,
      "address.types._id": selectedAddressId,
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const selectedAddress = user.address.types.find((type) =>
      type._id.equals(selectedAddressId)
    );

    if (!selectedAddress) {
      return res.status(404).send("Selected address not found");
    }

    // Create items array
    // Create items array
    const items = req.body.selectedProductNames.map((productName, index) => ({
      productName: req.body.selectedProductNames[index],
      productId: req.body.selectedProductIds[index],
      singleprice: parseInt(req.body.selectedProductPrices[index]),
      quantity: parseInt(req.body.selectedQuantities[index]),
      price: parseInt(req.body.selectedCartTotals[index]),
    }));

    if (items.some((item) => isNaN(item.quantity))) {
      const invalidItem = items.find((item) => isNaN(item.quantity));
      return res.status(400).send("Invalid quantity value found");
    }

    // Calculate total price
    const totalPrice = items.reduce((total, item) => total + item.price, 0);

    // Create and save order
    const order = new orderModel({
      orderId: uuidv4(),
      userId: userId,
      userName: selectedAddress.fullname,
      items,
      price: totalPrice,
      totalPrice: parseInt(req.body.carttotal),
      shippingAddress: selectedAddress,
      paymentMethod: selectedPaymentOption,
      createdAt: new Date(),
      status: "pending",
      updatedAt: new Date(),
    });
    await order.save();

    // Update user's cart and product stocks
    for (const item of items) {
      const updatedQuantity = -item.quantity;
      await cartModel.updateOne(
        { userId },
        { $pull: { item: { productId: item.productId } } }
      );
      await cartModel.updateOne({ userId }, { $set: { total: 0 } });
      await productModel.updateOne(
        { _id: item.productId },
        { $inc: { stock: updatedQuantity } }
      );
    }

    // Render order confirmation page
    res.render("user/orderConformation", { order });
  } catch (error) {
    console.error("Error processing order:", error);
    res.render("user/serverError");
  }
};

module.exports = { checkOutView, checkoutreload, orderingView };
