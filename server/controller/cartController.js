const categoryModel = require('../model/categoryModel')
const cartModel = require('../model/cartModel')
const productModel = require('../model/productModels')
const favouritesModel = require('../model/favouriteModel')


const cartView = async(req,res)=>{
    try {
      const userId = req.session.userId
      let cart 

      if (userId) {
        cart = await cartModel.findOne({userId:userId}).populate({
          Path:'item.productId',
          select: 'image name price stock'
        }) 
      }

      if (!cart) {
        cart = new cartModel({
          item:[],
          total:0
        })
      }
      console.log(cart);
        res.render("user/cart",{cart})
    } catch (error) {
      console.log("cart page is not viewing"); 
      res.status(400).send("error loading or showing cart page or list") 
    }
}


const addToCart = async(req,res)=>{
  try {
    const pid = req.params.id
    const product = await productModel.findOne({_id:pid})
    const userId = req.session.userId
    const price = product.price
    const stock = product.stock

    if (stock == 0) {
      res.redirect('/cartpage')
    }else{
      let cart;
      if(userId){
        cart = await cartModel.findOne({userId:userId})
      }

      if(!cart){
        cart = new cartModel({
          item:[],
          total:0
        })
      }
      const productExist = cart.item.findIndex((item)=> item.productId == pid)
     if (productExist !== -1) {
      cart.item[productExist].quantity += 1;
      cart.item[productExist].total =
      cart.item[productExist].quantity * price
     }
     else{
      const newItems = {
        productId:pid,
        quantity:1,
        price:price,
        stock:stock,
        total: quantity * price
      }
      cart.item.push(newItems)
    }
    if (userId && !cart.userId) {
      cart.userId = userId
    }

    cart.total = cart.item.reduce((num,item)=>num + item.total,0)
    await cart.save()
    res.redirect('/cartpage')
    }
    
  } catch (error) {
    console.log("error adding cart item");
    res.status(400).send("error rendering this page")
  }
}
/////////////////////////////////////////
///////////////////////////////////////////////

const favouritesView = async(req,res)=>{
  try {
    const userId = req.session.userId

    let favourite

    if (userId) {
      favourite =  await favouritesModel.findOne({userId:userId}).populate({
        path:"item.productId",
        select:"images name price"
      })
    }
    
    if (!favourite || !favourite.item) {
      favourite = new favouritesModel({
        item:[],
        total:0
      })
    }
    res.render("user/favourites",{favourite})
  } catch (error) {
    console.log("fav page viewing error");
    res.status(400).send("error showing favourite page")
  }
}


const addToFav = async (req, res) => {
  try {
    console.log("session", req.session);
    const pid = req.params.id;
    console.log("here is pid fav list",pid);
    const product = await productModel.findOne({ _id: pid });
    console.log("product",product);
    const userId = req.session.userId;
    console.log(userId);
    const price = product.price;
    console.log(price);

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
    res.redirect('/favourites');
  } catch (error) {
    console.log('error adding favourite');
    res.status(400).send('error adding favourites page');
  }
};


module.exports={cartView,addToCart, favouritesView, addToFav}