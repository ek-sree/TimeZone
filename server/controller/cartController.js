const categoryModel = require("../model/categoryModel");
const userModels = require("../model/userModels");
const cartModel = require("../model/cartModel");
const productModel = require("../model/productModels");
const favouritesModel = require("../model/favouriteModel");

const cartView = async (req, res) => {
  try {
    const userId = req.session.userId;
    let cart;

    if (userId) {
      cart = await cartModel.findOne({ userId: userId }).populate({
        path: "item.productId",
        select: "images name price stock",
      });
    }

    if (!cart || !cart.item) {
      cart = new cartModel({
        item: [],
        total: 0,
      });
    }
    res.render("user/cart", { cart });
  } catch (error) {
    console.log("Error while loading or showing cart page or list:", error);
    res.render("user/serverError");
  }
};

const addToCart = async (req, res) => {
  try {
    const pid = req.params.id;
    const product = await productModel.findOne({ _id: pid });
    const userId = req.session.userId;
    const price = product.price;
    const stock = product.stock;
    const quantity = req.body.quantity || 1;

    // Check if the product is in stock
    if (stock === 0) {
      return res.redirect("/cart");
    }

    let cart = await cartModel.findOne({ userId: userId });

    // If the user has an existing cart
    if (!cart) {
      cart = new cartModel({
        item: [],
        total: 0,
        userId: userId,
      });
    }
    // Check if the product is already in the cart
    const productExist = cart.item.findIndex((item) => item.productId == pid);

    if (productExist !== -1) {
      cart.item[productExist].quantity += quantity;
      cart.item[productExist].total = cart.item[productExist].quantity * price;
    } else {
      const newItems = {
        productId: pid,
        quantity: quantity,
        price: price,
        stock: stock,
        total: quantity * price,
      };
      cart.item.push(newItems);
    }

    // Update the cart total
    cart.total = cart.item.reduce((num, item) => num + item.total, 0);

    await cart.save();
    res.redirect("/cart");
  } catch (error) {
    console.error("Error adding cart item:", error);
    res.render("user/serverError");
  }
};

const updateCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const { action, cartId } = req.body;
    const cart = await cartModel.findOne({ _id: cartId });

    // Find the item in the cart
    const itemIndex = cart.item.findIndex((item) => item._id == productId);

    // Check if the product is in the cart
    if (itemIndex === -1) {
      return res
        .status(400)
        .json({ success: false, error: "Product not found in the cart" });
    }

    // Retrieve product details and stock limit
    const currentQuantity = cart.item[itemIndex].quantity;
    const selectedProductId = cart.item[itemIndex].productId;
    const selectedProduct = await productModel.findOne({
      _id: selectedProductId,
    });
    const stockLimit = selectedProduct.stock;
    const price = cart.item[itemIndex].price;

    // Update the quantity based on the action
    let updatedQuantity;

    if (action == "1") {
      updatedQuantity = currentQuantity + 1;
    } else if (action == "-1") {
      updatedQuantity = currentQuantity - 1;
    } else {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    // Ensure the updated quantity is within stock limits
    if (
      updatedQuantity < 1 ||
      (updatedQuantity > stockLimit && action == "1")
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Quantity exceeds stock limits" });
    }

    // Update the cart item and total
    cart.item[itemIndex].quantity = updatedQuantity;
    const newProductTotal = price * updatedQuantity;
    cart.item[itemIndex].total = newProductTotal;
    cart.total = cart.item.reduce((total, item) => total + item.total, 0);

    await cart.save();
    res.json({
      success: true,
      newQuantity: updatedQuantity,
      newProductTotal,
      total: cart.total,
    });
  } catch (error) {
    console.log("Can't update cart ", error);
    res
      .status(400)
      .json({
        success: false,
        error: "Error occurred while updating cart",
        details: error.message,
      });
  }
};

const deleteCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const productId = req.params.id;

    const updatedCart = await cartModel.findOneAndUpdate(
      { userId: userId },
      { $pull: { item: { _id: productId } } },
      { new: true }
    );

    if (!updatedCart) {
      return res
        .status(400)
        .json({ success: false, error: "Item not found in the cart" });
    }

    // Recalculate total
    const total = updatedCart.item.reduce(
      (total, item) => total + item.total,
      0
    );
    updatedCart.total = total;

    await updatedCart.save();
    let response = { success: true, total: total };
    res.json(response);
  } catch (error) {
    console.error("Error deleting item from cart", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

/////////////////////////////////////////
// <<<<<<<<<<<<<------------Favourite------------->>>>>>>>>>>>>>>>
///////////////////////////////////////////////

const favouritesView = async (req, res) => {
  try {
    const userId = req.session.userId;

    let favourite;

    if (userId) {
      favourite = await favouritesModel.findOne({ userId: userId }).populate({
        path: "item.productId",
        select: "images name price",
      });
    }

    if (!favourite || !favourite.item) {
      favourite = new favouritesModel({
        item: [],
        total: 0,
      });
    }
    res.render("user/favourites", {
      favourite,
      expressFlash: {
        productExist: req.flash("productExist"),
      },
    });
  } catch (error) {
    console.log("fav page viewing error");
    res.render("user/serverError");
  }
};

const addToFav = async (req, res) => {
  try {
    const pid = req.params.id;
    const product = await productModel.findOne({ _id: pid });
    const userId = req.session.userId;
    const price = product.price;

    let favourite;
    if (userId) {
      favourite = await favouritesModel.findOne({ userId: userId });
    }
    if (!favourite) {
      favourite = new favouritesModel({
        item: [],
        total: 0,
      });
    }

    const productExist = favourite.item.findIndex(
      (item) => item.productId == pid
    );

    if (productExist !== -1) {
    } else {
      const newItem = {
        productId: pid,
        price: price,
      };
      favourite.item.push(newItem);
    }

    if (userId && !favourite.userId) {
      favourite.userId = userId;
    }

    await favourite.save();
    res.redirect("/favourites");
  } catch (error) {
    console.log("error adding favourite");
    res.render("user/serverError");
  }
};

const favToCart = async (req, res) => {
  try {
    const pid = req.params.id;
    const product = await productModel.findOne({ _id: pid });
    const userId = req.session.userId;
    const price = product.price;
    const stock = product.stock;
    const quantity = req.body.quantity || 1;

    if (stock === 0) {
      return res.redirect("/favourites");
    }

    let cart = await cartModel.findOne({ userId: userId });

    if (!cart) {
      cart = new cartModel({
        item: [],
        total: 0,
        userId: userId,
      });
    }

    const productExistIndex = cart.item.findIndex(
      (item) => item.productId == pid
    );

    if (productExistIndex !== -1) {
      req.flash("productExist", "This product is already in the cart");
      return res.redirect("/favourites");
    }

    const newItems = {
      productId: pid,
      quantity: quantity,
      price: price,
      stock: stock,
      total: quantity * price,
    };

    cart.item.push(newItems);

    cart.total = cart.item.reduce((num, item) => num + item.total, 0);

    await cart.save();

    const wishlist = await favouritesModel.findOne({ userId: userId });

    if (wishlist) {
      wishlist.item = wishlist.item.filter((item) => item.productId != pid);
      await wishlist.save();
    }
    res.redirect("/cart");
  } catch (error) {
    console.log("not working add to cart from favourites", error);
    res.render("user/serverError");
  }
};

const deleteFav = async (req, res) => {
  const ItemId = req.params.id;
  const userId = req.session.userId;
  const newFav = await favouritesModel.updateOne(
    { userId: userId },
    { $pull: { item: { _id: ItemId } } }
  );
  console.log("deleted fav", newFav);
  res.redirect("/favourites");
};

module.exports = {
  cartView,
  addToCart,
  updateCart,
  deleteCart,
  favouritesView,
  addToFav,
  favToCart,
  deleteFav,
};
