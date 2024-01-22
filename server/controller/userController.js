const userModels = require("../model/userModels");
const otpModel = require("../model/userOtpModels");
const otpgenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const { Email, pass,key_id, key_secret } = require("../../.env");
const nodemailer = require("nodemailer");
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
const productModel = require("../model/productModels");
const orderModel = require("../model/orderModel");
const walletModel = require("../model/walletModel");
const Razorpay = require('razorpay')
var easyinvoice = require('easyinvoice');
const couponModel = require("../model/couponModel");
const categoryModel = require("../model/categoryModel");
const bannerModel = require("../model/bannerModel");


//    <<<<<<<<<---------- RENDERING HOMEPAGE ---------->>>>>>>>>>
const home = async (req, res) => {
  try {
    req.session.loginpressed = true;
    const products = await productModel.find().limit(6);
    const banners = await bannerModel.find()
    res.render("user/index", { products , banners});
    // console.log(banners);
  } catch (error) {
    console.log(error);
    res.render('user/serverError')
  }
};

//    <<<<<<<<<---------- RENDERING SIGNUP PAGE ---------->>>>>>>>>>
const signup = async (req, res) => {
  try {
    req.session.otppressed = true;
    res.render("user/signup");
  } catch (error) {
    console.log(error);
    res.render('user/serverError')
  }
};

//    <<<<<<<<<---------- OTP SEND MAIL  ---------->>>>>>>>>>
const sendmail = async (email, otp) => {
  try {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: Email,
        pass: pass,
      },
    });

    var mailOptions = {
      from: "TimeZone <timezoneofficial09@gmail.com>",
      to: email,
      subject: "Email Verification",
      text: "Your OTP is:" + otp,
    };

    transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("cant send message", error);
    res.render('user/serverError')
  }
};

//    <<<<<<<<<----------  OTP GENERATING---------->>>>>>>>>>
const generateotp = () => {
  const otp = otpgenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
  console.log("Generated otp", otp);
  return otp;
};

//    <<<<<<<<<---------- SIGNUP VALIDATION ---------->>>>>>>>>>

const signuppost = async (req, res) => {
  try {
    const username = req.body.username;
    const email = req.body.email;
    const phone = req.body.phoneNumber;
    const password = req.body.password;
    const conformPass = req.body.conform - password;
    let referralCode;
    if (req.body.referralCode) {
      referralCode = req.body.referralCode
    }
    const isNameValid = nameValid(username);
    const isEmailValid = emailValid(email);
    const isPhoneValid = phoneValid(phone);
    const ispasswordValid = passwordValid(password);
    // const IsConformPassValid = confirmpasswordValid(conformPass,password)
    // const isConformPassValid = confirmPasswordValid(conformPass, password);
    const isConformPassValid = confirmPasswordValid(
      req.body["conform-password"],
      req.body.password
    );
    const emailExist = await userModels.findOne({ email: email });
    if (emailExist) {
      res.render("user/signup", { emailerror: "E-mail already exits" });
    } else if (!isEmailValid) {
      res.render("user/signup", { emailerror: "Enter a valid E-mail" });
    } else if (!isNameValid) {
      res.render("user/signup", { nameerror: "Enter a valid Name" });
    } else if (!isPhoneValid) {
      res.render("user/signup", { phoneerror: "Enter a valid Phone Number" });
    } else if (!ispasswordValid) {
      res.render("user/signup", {
        passworderror:
          "Password should contain one uppercase,one lowercase,one number,one special charecter",
      });
    } else if (!isConformPassValid) {
      res.render("user/signup", {
        cpassworderror: "Password and Confirm password should be match",
      });
    } else {
      const hashedpassword = await bcrypt.hash(password, 10);
      const user = new userModels({
        name: username,
        email: email,
        phonenumber: phone,
        password: hashedpassword,
      });
      if (referralCode) {
        req.session.referralCode=referralCode
      }
      req.session.user = user;
      req.session.signup = true;
      req.session.forgot = false;
      const otp = generateotp();
      const currentTimestamp = Date.now();
      const expiryTimestamp = currentTimestamp + 30 * 1000;
      const filter = { email: email };
      const update = {
        $set: {
          email: email,
          otp: otp,
          expiry: new Date(expiryTimestamp),
        },
      };

      const option = { upsert: true };
      await otpModel.updateOne(filter, update, option);

      await sendmail(email, otp);
      res.redirect("/otp");
    }
  } catch (error) {
    console.log("Error", error);
    res.render('user/serverError')
  }
};

//    <<<<<<<<<---------- RENDERING OTP PAGE---------->>>>>>>>>>
const otp = (req, res) => {
  try {
    res.render("user/otp");
  } catch (error) {
    res.render('user/serverError')
  }
};

//    <<<<<<<<<---------- VERIFY OTP ---------->>>>>>>>>>

const verifyotp = async (req, res) => {
  try {
    const enteredotp = req.body.otp;
    const user = req.session.user;
    const email = req.session.user.email;
    const userdb = await otpModel.findOne({ email: email });
    const otp = userdb.otp;
    const expiry = userdb.expiry;

    if (enteredotp == otp && expiry.getTime() >= Date.now()) {
      user.isVerified = true;

      if (req.session.user) {
        try {
          if (req.session.signup) {
            await userModels.create(user);
            const userdata = await userModels.findOne({ email: email });
            req.session.userId = userdata._id;
            req.session.isAuth = true;
            req.session.admin= false
            req.session.otppressed=false
            const referal = req.session.referralCode
            const userIdObject = await userModels.findOne({ _id: referal });
const idUser = userIdObject._id;
console.log("user id obj",idUser);
const refeWallet = await walletModel.findOne({ userId: idUser });
if (idUser) {
  const updateWallet = refeWallet.wallet + 50;

  const walletUpdateResult = await walletModel.findOneAndUpdate(
    { userId: idUser },
    { $set: { wallet: updateWallet } },
    { new: true }
  );

  if (walletUpdateResult) {
    const transaction = {
      date: new Date(),
      type: "Credited",
      amount: 50,
    };

    await walletModel.findOneAndUpdate(
      { userId: idUser },
      { $push: { walletTransactions: transaction } },
      { new: true }
    );
  } else {
    console.log("user not found with that provided referral code");
  }
} else {
  console.log("user not found with that provided referral code");
}


            req.session.otppressed=false
            req.session.forgotpressed=false
            res.redirect("/login");
          } else if (req.session.forgot) {
            req.session.newpasspressed = true;
            res.redirect("/newpassword");
          }
        } catch (error) {
          console.log(error);
          res.status(500).send("Error occurred while saving user data");
        }
      } else {
        console.log("Name field is missing in req.session.user");
        res.status(400).send("Name field is missing in req.session.user");
      }
    } else {
      res.render("user/otp", { otperror: "Invaild otp or time expired" });
    }
  } catch (error) {
    console.log(error);
    res.render('user/serverError')
  }
};

//    <<<<<<<<<---------- RESEND OTP ---------->>>>>>>>>>

const resendotp = async (req, res) => {
  try {
    const email = req.session.user.email;
    const otp = generateotp();
    const currentTimestamp = Date.now();
    const expiryTimestamp = currentTimestamp + 60 * 1000;
    await otpModel.updateOne(
      { email: email },
      { otp: otp, expiry: new Date(expiryTimestamp) }
    );
    await sendmail(email, otp);
  } catch (error) {
    console.log(error);
    res.render('user/serverError')
  }
};

//    <<<<<<<<<----------LOGIN RENDER PAGE---------->>>>>>>>>>

const login = (req, res) => {
  req.session.signuppressed = true;
  req.session.forgotpressed = true;
  res.render("user/login");
};

//    <<<<<<<<<----------LOGIN ACTION---------->>>>>>>>>>

const loginaction = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await userModels.findOne({ email: email });
    if (!user) {
      throw new Error("User not found");
    }
    const passwordmatch = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (passwordmatch && user.status) {
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.isAuth = true;
      res.redirect("/");
    } else {
      res.render("user/login", {
        passworderror: "Invaild password or Your accound is blocked",
      });
    }
  } catch (error) {
    console.error(error);
    res.render("user/login", { emailerror: "Invaild email" });
  }
};

//    <<<<<<<<<----------Forgot page avtion---------->>>>>>>>>>

const forgot = (req, res) => {
  req.session.otppresssed = true;
  res.render("user/forgotpass");
};

//    <<<<<<<<<----------Forgot pass  ACTION---------->>>>>>>>>>

const forgotpasspost = async (req, res) => {
  try {
    const email = req.body.email;
    const emailExist = await userModels.findOne({ email: email });
    if (emailExist) {
      req.session.forgot = true;
      req.session.signup = false;
      req.session.user = { email: email };
      const otp = generateotp();
      const currentTimestamp = Date.now();
      const expiryTimestamp = currentTimestamp + 30 * 1000;
      const filter = { email: email };
      const update = {
        $set: {
          email: email,
          otp: otp,
          expiry: new Date(expiryTimestamp),
        },
      };
      const options = { upsert: true };
      await otpModel.updateOne(filter, update, options);

      await sendmail(email, otp);
      req.session.forgotpressed = false;
      req.session.otppressed = true;
      res.render("user/otp");
    } else {
      res.render("user/forgotpass", { emailerror: "Invaild email" });
    }
  } catch (error) {
    console.log(error, "error in forgotpass checking");
    res.render('user/serverError')
  }
};

//    <<<<<<<<<----------NEW PASSWORD RENDERING PAGE---------->>>>>>>>>>

const newpassword = (req, res) => {
  res.render("user/newpassword");
};

//    <<<<<<<<<----------NEW PASSWORD RENDERING PAGE---------->>>>>>>>>>
const newpasswordpost = async (req, res) => {
  try {
    req.session.otppressed = false;
    const password = req.body.password;
    const conformPass = req.body["conform-password"];

    const ispasswordValid = passwordValid(password);
    const isConformPassValid = confirmPasswordValid(conformPass, password);

    if (!ispasswordValid) {
      res.redirect("/newpassword", {
        passworderror:
          "Password should contain one uppercase,one lowercase,one number,one special charecter",
      });
    } else if (!isConformPassValid) {
      res.redirect("/newpassword", {
        cpassworderror: "password and conform password should match",
      });
    } else {
      const hashedpassword = await bcrypt.hash(password, 10);
      const email = req.session.user.email;
      await userModels.updateOne(
        { email: email },
        { password: hashedpassword }
      );
      req.session.newpasspressed = false;
      res.redirect("/profile");
    }
  } catch (error) {
    res.render('user/serverError')
  }
};

const profile = async (req, res) => {
  try {
    if (req.session.isAuth) {
      const userId = req.session.userId;
      const user = await userModels.findOne({ _id: userId });
      const name = user.name;
      res.render("user/profile", { name, userId });
    } else {
      req.session.signuppressed = true;
      req.session.forgotpressed = true;
      res.render("user/login");
    }
  } catch (error) {
    console.log("error rendering profile page",err);
    res.render('user/serverError')
  }
};

const userdetails = async (req, res) => {
  try {
    const userId = req.session.userId;
    const data = await userModels.findOne({ _id: userId });
    res.render("user/userdetails", { userData: data });
  } catch (error) {
    console.log("error showing user details");
    res.render('user/serverError')
  }
};

const newAddress = async (req, res) => {
  res.render("user/newAddress");
};

const newAddresspost = async (req, res) => {
  try {
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
    const userExisted = await userModels.findOne({ _id: userId });
    const fullnamevalid = bnameValid(fullname);
    const saveasvalid = bnameValid(saveas);
    const adnameValid = bnameValid(adname);
    const streetValid = bnameValid(street);
    const pinvalid = pincodeValid(pincode);
    const cityValid = bnameValid(city);
    const stateValid = bnameValid(state);
    const countryValid = bnameValid(country);
    const phoneValid = adphoneValid(phone);
    if (!saveasvalid) {
      return res.render("user/newAddress", {
        saveaserror: "Enter valid address type",
      });
    }
    if (!fullnamevalid) {
      return res.render("user/newAddress", {
        fullnameerror: "Enter a valid fullname",
      });
    }
    if (!adnameValid) {
      return res.render("user/newAddress", {
        adnameerror: "Enter a valid house or flat name",
      });
    }
    if (!streetValid) {
      return res.render("user/newAddress", {
        streeterror: "Enter a valid street name",
      });
    }
    if (!pinvalid) {
      return res.render("user/newAddress", {
        pinerror: "Enter a valid pincode",
      });
    }
    if (!cityValid) {
      return res.render("user/newAddress", { cityerror: "Enter a valid city" });
    }
    if (!stateValid) {
      return res.render("user/newAddress", {
        stateerror: "Enter a valid state",
      });
    }
    if (!countryValid) {
      return res.render("user/newAddress", {
        countryerror: "Enter a valid country",
      });
    }
    if (!phoneValid) {
      return res.render("user/newAddress", {
        phoneerror: "Enter a valid Phone number",
      });
    }
    console.log("validation of address completed");
    if (userExisted) {
      const addressExist = await userModels.findOne({
        _id: userId,
        "address.types": {
          $elemMatch: {
            saveas: saveas,
            fullname: fullname,
            adname: adname,
            street: street,
            pincode: pincode,
            city: city,
            state: state,
            country: country,
            mobilenumber: phone,
          },
        },
      });

      if (addressExist) {
        res.redirect("/newAddress");
      } else {
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

        const result = await userExisted.save();
        res.redirect("/userdetails");
      }
    }
  } catch (error) {
    console.log("error happened new address adding");
    res.render('user/serverError')
  }
};

const editprofile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = await userModels.findOne({ _id: userId });
    res.render("user/editprofile", { userData });
  } catch (error) {
    console.log("error loading edit user details page");
    res.render('user/serverError')
  }
};

const editprofilepost = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.session.userId;
    await userModels.updateOne(
      { _id: userId },
      { $set: { name: name, phonenumber: phone } }
    );
    res.redirect("/userdetails");
  } catch (error) {
    console.log("cant edit user details");
    res.render('user/serverError')
  }
};

const changepass = async (req, res) => {
  try {
    res.render("user/changepass");
  } catch (error) {
    console.log("error rendering changepass page");
    res.render('user/serverError')
  }
};

const changepasspost = async (req, res) => {
  try {
    const userId = req.session.userId;
    const currentpass = req.body.currentpass;
    const password = req.body.password;
    const cppassword = req.body.cppassword;

    const userFound = await userModels.findOne({ _id: userId });
    if (
      !userFound ||
      !(await bcrypt.compare(currentpass, userFound.password))
    ) {
      return res.render("user/changepass", {
        currentpasserror: "Your current password is wrong",
      });
    }
    const ispasswordValid = passwordValid(password);
    const isConformPassValid = confirmPasswordValid(cppassword, password);

    if (!ispasswordValid) {
      return res.render("user/changepass", {
        passworderror:
          "Password should contain one uppercase, one lowercase, one number, one special character",
      });
    } else if (!isConformPassValid) {
      return res.render("user/changepass", {
        cpassworderror: "Password and Confirm password should match",
      });
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    await userModels.updateOne({ _id: userId }, { password: hashedpassword });

    res.redirect("/userdetails");
  } catch (error) {
    console.log("Error changing password:", error);
    res.render('user/serverError')
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.params.addressId;
    const user = await userModels.findOne({ _id: userId });
    const addressToEdit = user.address.types.id(addressId);
    res.render("user/editaddress", { addressToEdit: addressToEdit ,expressFlash:{
      saveaserror:req.flash('saveaserror'),
      fullnameerror:req.flash('fullnameerror'),
      adnameerror:req.flash('adnameerror'),
      streeterror:req.flash('streeterror'),
      pinerror:req.flash('pinerror'),
      cityerror:req.flash('cityerror'),
       stateerror:req.flash(' stateerror'),
      countryerror:req.flash('countryerror'),
      phoneerror:req.flash('phoneerror'),
    } });
  } catch (error) {
    console.log("error editing address");
    res.render('user/serverError')
  }
};

const editAddresspost = async (req, res) => {
  try {
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
    const addressId = req.params.addressId;

    const isAddressExist = await userModels.findOne({
      _id: userId,

      "address.types": {
        $elemMatch: {
          _id: { $ne: addressId },
          saveas: saveas,
          fullname: fullname,
          adname: adname,
          street: street,
          pincode: pincode,
          city: city,
          state: state,
          country: country,
          mobilenumber: phone,
        },
      },
    });

    const userExisted = await userModels.findOne({ _id: userId });
    const fullnamevalid = bnameValid(fullname);
    const saveasvalid = bnameValid(saveas);
    const adnameValid = bnameValid(adname);
    const streetValid = bnameValid(street);
    const pinvalid = pincodeValid(pincode);
    const cityValid = bnameValid(city);
    const stateValid = bnameValid(state);
    const countryValid = bnameValid(country);
    const phoneValid = adphoneValid(phone);
    if (!saveasvalid) {
      req.flash('saveaserror',"Enter valid address type")
      return res.redirect(`/editaddress/${addressId}`);
    }
    if (!fullnamevalid) {
      req.flash('fullnameerror',"Enter valid Name")
      return res.redirect(`/editaddress/${addressId}`);
    }
    if (!adnameValid) {
      req.flash('adnameerror',"Enter valid house or flat name")
      return res.redirect(`/editaddress/${addressId}`);
    }
    if (!streetValid) {
      req.flash('streeterror',"Enter valid street name")
      return res.redirect(`/editaddress/${addressId}`);
    }
    if (!pinvalid) {
      req.flash('pinerror',"Enter valid pincode")
      return res.redirect(`/editaddress/${addressId}`);
    }
    if (!cityValid) {
      req.flash('cityerror',"Enter valid city")
      return res.redirect(`/editaddress/${addressId}`);
    }
    if (!stateValid) {
      req.flash('stateerro',"Enter valid state")
      return res.redirect(`/editaddress/${addressId}`);
    }
    if (!countryValid) {
      req.flash('countryerror',"Enter valid country")
      return res.redirect(`/editaddress/${addressId}`);
    }
    if (!phoneValid) {
      req.flash('phoneerror',"Enter valid Phone number")
      return res.redirect(`/editaddress/${addressId}`);
    }
    console.log("validation of edit address completed");

    if (isAddressExist) {
      console.log("not edited");
      return res.redirect("/userdetails");
    }

    await userModels.updateOne(
      { _id: userId },
      {
        $set: {
          "address.types.$[elem].saveas": saveas,
          "address.types.$[elem].fullname": fullname,
          "address.types.$[elem].adname": adname,
          "address.types.$[elem].street": street,
          "address.types.$[elem].pincode": pincode,
          "address.types.$[elem].city": city,
          "address.types.$[elem].state": state,
          "address.types.$[elem].country": country,
          "address.types.$[elem].mobilenumber": phone,
        },
      },
      { arrayFilters: [{ "elem._id": addressId }] }
    );

    res.redirect("/userdetails");
  } catch (error) {
    console.log("update address error");
    res.render('user/serverError')
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.params.addressId;
    await userModels.updateOne(
      { _id: userId, "address.types._id": addressId },
      { $pull: { "address.types": { _id: addressId } } }
    );
    res.redirect("/userdetails");
  } catch (error) {
    console.log("delete address is not working");
    res.render('user/serverError')
  }
};

const orderDetailsView = async(req,res)=>{
    try {
        const userId = req.session.userId
        const order = await orderModel.find({userId:userId})
        
        const allOrderItems=[]
         order.forEach((order)=>{
            allOrderItems.push(...order.items)
        })
        const orders = await orderModel.aggregate([
          { $match: { userId: userId, 'items.productId': { $ne: '' } } }, // Exclude documents with empty product IDs
          { $sort: { createdAt: -1 } },
          {
              $lookup: {
                  from: 'products',
                  let: { productIds: '$items.productId' },
                  pipeline: [
                      // ...
                  ],
                  as: 'productDetails'
              }
          }
      ]);
const updatedOrders = orders.map(order => ({
    ...order,
    items: order.items.map(item => ({
        ...item,
        productDetails: order.productDetails.find(product => product._id.toString() === item.productId.toString())
    }))
}));

        

        res.render('user/orderdetails',{orders:updatedOrders})
    } catch (error) {
        console.log("cant show order details of users");
        res.render('user/serverError')
    }
}


const sortPrice = async (req, res) => {
  try {
      let data;
      const sortedProduct = req.body.sortOrder;

      if (sortedProduct === 'allProduct') {
        data = await productModel.find({})
      }
      else if (sortedProduct === 'highToLow') {
          data = await productModel.find({}).sort({ price: -1 });
      } else if (sortedProduct === 'lowToHigh') {
          data = await productModel.find({}).sort({ price: 1 });
      } else {
          
      }

      res.json(data);
  } catch (error) {
      console.error('Error sorting products:', error);
      res.render('user/serverError')
  }
};


const orderTracking = async (req,res)=>{
  try {
    const oid = req.params.id
    const  order = await orderModel.findOne({_id:oid})
    res.render('user/orderTrack',{order})
  } catch (error) {
    console.log("error",error);
    res.render('user/serverError')
  }
}


const orderHistoryShown = async(req,res)=>{
  try {
    const pid = req.params.id
    const order = await orderModel.findOne({_id:pid})
    res.render('user/orderTrack',{order:order})
  } catch (error) {
    console.log("error",error);
    res.render('user/serverError')
  }
}

const wallet = async(req,res)=>{
  try {
    const userId = req.session.userId
    const user = await walletModel.findOne({userId:userId}).sort({'walletTransactions':-1})

    if (!user) {
      user = await walletModel.create({userId:userId})
    }
    const userWallet = user.wallet
    const usertransactions = user.walletTransactions.reverse()
    res.render('user/wallet',{userWallet,usertransactions})
  } catch (error) {
    console.log("error",error);
    res.render('user/serverError')
  }
}


const walletTopup = async (req,res)=>{
  try {
    const userId = req.session.userId
    const Amount = parseFloat(req.body.Amount)
    const wallet = await walletModel.findOne({userId:userId})

    wallet.wallet = wallet.wallet + Amount
    wallet.walletTransactions.push({type:'Credited', amount:Amount, date: new Date()})
    await wallet.save()
    res.redirect('/wallet')
  } catch (error) {
    res.render('user/serverError')
    console.log("cant add amount to wallet",error);
  }
}


const ordercancelling = async (req, res) => {
  try {
    const userId = req.session.userId;
    const orderId = req.params.id;
    await orderModel.updateOne({ _id: orderId }, { status: "Cancelled" });
    const order = await orderModel.findOne({ _id: orderId });
    if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'Wallet') {
      const user = await walletModel.findOne({ userId: userId });
      const refund = order.totalPrice;
      const currentWallet = user.wallet;
      const newWallet = currentWallet + refund;
      await walletModel.updateOne(
        { userId: userId },
        {
          $set: { wallet: newWallet },
          $push: { walletTransactions: { date: new Date(), type: 'Credited', amount: refund } },
        }
      );
    }

    for (const item of order.items) {
      if (item.status !== 'cancelled') {
        const product = await productModel.findOne({ _id: item.productId });
        product.discount = 0;

        product.stock += item.quantity;
        await product.save();
      }
    }
    res.redirect('/orderdetails');
  } catch (error) {
    console.log("Error cancelling product", error);
    res.render('user/serverError')
  }
};


const orderReturning = async (req,res)=>{
  try {
    const userId = req.session.userId
    const id = req.params.id
    const user = await walletModel.findOne({userId:userId})
    await orderModel.updateOne({_id:id},{status:"Returned"})
    const result = await orderModel.findOne({_id:id})
    const refund = result.totalPrice
    const currentWallet = user.wallet
    const newWallet = currentWallet + refund
    await walletModel.updateOne({userId:userId},{$set:{wallet:newWallet},$push:{walletTransactions:{date:new Date(),type:"Credited",amount:refund}}})
    const items = result.items.map(item=>({
      productId:item.productId,
      quantity:item.quantity,
      status:item.status
    }))

    for(const item of items){
      if (item.status!=='returned') {
      const product = await productModel.findOne({_id:item.productId})
      product.stock+= item.quantity
      await product.save()
      console.log("order returned success");
      }
    }
    res.redirect('/orderdetails')
  } catch (error) {
    res.render('user/serverError')
    console.log("Cant return order error happened",error);
  }
}

const itemCancel = async (req, res) => {
  try {
    const userId = req.session.userId;
    const productId = req.params.productId;
    const orderId = req.params.orderId;
    const order = await orderModel.findOne({ _id: orderId });
    const singleItem = order.items.find((item) => item.productId == productId);
    if (!singleItem) {
      return res.status(404).send("Item is not found!!");
    }

    if (order.paymentMethod == "Razorpay" || order.paymentMethod == "Wallet") {
      const user = await walletModel.findOne({ userId: userId });
      const refund = singleItem.price;
      const currentWallet = user.wallet;
      const newWallet = currentWallet + refund;
      await walletModel.updateOne(
        { userId: userId },
        {
          $set: { wallet: newWallet },
          $push: {
            walletTransactions: {
              date: new Date(),
              type: "Credited",
              amount: refund,
            },
          },
        }
      );
    }

    await orderModel.updateOne(
      {
        _id: orderId,
        "items.productId": singleItem.productId,
      },
      {
        $set: {
          "items.$.status": "cancelled",
          totalPrice: order.totalPrice - singleItem.price,
          updatedAt: new Date(),
        },
      }
    );
    const product = await productModel.findOne({
      _id: singleItem.productId,
    });
product.discount=0
    product.stock += singleItem.quantity;
    await product.save();
    const remainingNotCancelled =  order.items.filter(
      (item) => item.status !== "cancelled"
    );

    if (remainingNotCancelled.length <2) {
      order.status = "Cancelled";
      await order.save();
    }

    res.redirect(`/singleorder/${orderId}`);
  } catch (error) {
    console.log("error cancelling single product", error);
    res.render('user/serverError')
  }
};

const itemReturn = async(req,res)=>{
  try {
    const userId = req.session.userId
    const orderId = req.params.orderId
    const productId = req.params.productId

    const order = await orderModel.findOne({_id:orderId})
    const singleItem = order.items.find((item)=>item.productId == productId)

    if (!singleItem) {
      return res.status(404).send('product not found')
    }

    if (order.paymentMethod == 'Razorpay' || order.paymentMethod == 'Wallet') {
      const user = await walletModel.findOne({userId:userId})

      const refund = singleItem.price
      const currentWallet = user.wallet
      const newWallet = currentWallet + refund
      
      await walletModel.updateOne({userId:userId},{$set:{wallet:newWallet},$push:{walletTransactions:{date:new Date(),type:"Credited",amount:refund}}})
    }

   await orderModel.updateOne({_id:orderId,'items.productId':singleItem.productId},
   {$set:{"items.$.status":'returned',
    totalPrice:order.totalPrice - singleItem.price,
    updatedAt:new Date()}})

    const product = await productModel.findOne({_id:singleItem.productId})

    product.stock += singleItem.quantity
    await product.save()

    const remainingNotReturned = order.items.filter((item)=>item.status!=='returned')
    if (remainingNotReturned.length <2) {
      order.status = "Returned"
      await order.save()
    }
    res.redirect(`/singleorder/${orderId}`)
  } catch (error) {
    console.log("error on returning single order ",error);
    res.render('user/serverError')
  }
}

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await orderModel.findOne({ orderId: orderId });

    const pdfBuffer = await generateInvoice(order);

    if (pdfBuffer) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
      res.send(pdfBuffer);
    } else {
      console.log("Error generating PDF");
      res.render('user/serverError')
    }
  } catch (error) {
    console.log("cant send pdf invoice", error);
    res.render('user/serverError')
  }
};


const generateInvoice = async (order) => {
  try {
    let totalAmount = order.totalPrice;
    const data = {
      documentTitle: 'Invoice',
      currency: 'INR',
      marginTop: 25,
      marginRight: 25,
      marginLeft: 25,
      marginBottom: 25,
      sender: {
        company: 'TimeZone',
        address: '123 Main Street, Bangalore, India',
        zip: '651323',
        city: 'Bangalore',
        country: 'INDIA',
        phone: '9562605265',
        email: 'timezoneofficial09@gmail.com',
        website: 'www.timezone.shop',
      },
      invoiceNumber: `INV-${order.orderId}`,
      invoiceDate: new Date().toJSON(),
      products: order.items.map((item) => ({
        quantity: item.quantity,
        description: item.productName,
        price: item.price,
      })),
      total: `₹${totalAmount.toFixed(2)}`,
      tax: 0,
      bottomNotice: 'Thank you for shopping at UrbanSole!',
    };

    const output = await easyinvoice.createInvoice(data);
    if (output && output.pdf) {
      const bufferedPdf = Buffer.from(output.pdf, 'base64');
      return bufferedPdf;
    } else {
      console.log("Error generating PDF. Response:", output);
      return null;
    }
    
  } catch (error) {
    console.log("Error happened, can't download invoice", error);
    return null;
  }
};


const walletTransaction = async(req,res)=>{
  try {
    const userId = req.session.userId
    const amount = req.body.amount
    const user = await walletModel.findOne({userId:userId})
    const wallet = user.wallet

    if (wallet >= amount) {
      user.wallet -= amount
      await user.save()

     const wallet = await walletModel.findOne({userId:userId})

     wallet.walletTransactions.push({type:"Debited",amount:amount,date:new Date()})
     await wallet.save()  
      res.json({success:true})
    }
    else{
      res.json({success:false,message:"Don't have enough money in your wallet!"})
    }
  } catch (error) {
    console.log("error in wallet transaction");
    res.render('user/serverError')
  }
} 


const instance = new Razorpay({key_id: key_id,key_secret:key_secret})

const upi = async(req,res)=>{
  var option  = {
    amount :500,
    currency:"INR",
    receipt:'order_rcpt'
  }
  instance.orders.create(option,function(err,order){
    res.send({order:order.id})
  })
}


const coupons = async(req,res)=>{
  try {
    const userId = req.session.userId
    const referralCodetaking = await userModels.findOne({_id:userId})
    const referralCode = referralCodetaking._id
    const coupons = await couponModel.find({couponCode:{$nin:userId.usedCoupons},status:true})
    res.render('user/rewards',{coupons,referralCode})
  } catch (error) {
    console.log("error coupon",error);
    res.render('user/serverError')
  }
}

const couponApply = async(req,res)=>{
  try {
    const userId = req.session.userId
    const {couponCode,subtotal}= req.body
    const user = await userModels.findOne({_id:userId})
    const coupon = await couponModel.findOne({couponCode:couponCode.trim()})
    if (coupon && coupon.status == true) {
      if (user && user.usedCoupons.includes(couponCode)) {
        res.json({success:false, message:"Already Redeemed this Coupon!"})
      }
      else if (coupon.expiry > new Date() && coupon.minimumPrice <= subtotal) {
        let dicprice
        let price
        if (coupon.type === 'flatDiscount') {
          dicprice= coupon.discount
          price = subtotal-dicprice
        }
        else if (coupon.type === 'percentageDiscount') {
          dicprice = (subtotal * coupon.discount)/100
          if (dicprice>= coupon.maxRedeem) {
            dicprice=coupon.maxRedeem
          }
          price=subtotal-dicprice
        }
        await userModels.findByIdAndUpdate(userId,{
          $addToSet:{usedCoupons:couponCode}
        },{new:true})
        res.json({success:true, dicprice,price})
      }else{
        res.json({success:false,message:"Invaild coupon"})
      }
    }else{
      res.json({success:false, message:"Coupon not found"})
    }
  } catch (error) {
    console.log("error adding couppon on checkout");
    res.render('user/serverError')
  }
}

const revokedCoupon = async(req,res)=>{
  try {
    const userId = req.session.userId
    const {couponCode,subtotal}= req.body
    const coupon = await couponModel.findOne({couponCode:couponCode})
    if (coupon) {
      if (coupon.expiry > new Date() && coupon.minimumPrice <= subtotal) {
        const dicprice = 0
        const price = subtotal

        await userModels.findByIdAndUpdate(userId,{$pull:{usedCoupons:couponCode}},{new:true})
        res.json({success:true, dicprice,price})
      }else{
        res.json({success:false,message:"Invaild coupon"})
      }
    }else{
      res.json({success:false, message:"Coupon not found"})
    }
  } catch (error) {
    console.log("revoked coupon not working");
    res.render('user/serverError')
  }
}


const searchFunc = async (req, res) => {
  try {
      const searchTerm = req.query.q;
      const page = parseInt(req.query.page) || 1;
        const perPage = 6;


      const categorys = await categoryModel.find({
          name: {
              $regex: new RegExp(searchTerm, 'i') 
          },
          status:true
      });
      const products = await productModel.find({
          $or: [
              { name: { $regex: new RegExp(searchTerm, 'i') } },
              { description: { $regex: new RegExp(searchTerm, 'i') } }
          ],
          status:true
      })
      .skip((page - 1) * perPage)
      .limit(perPage);
      const totalProducts = await productModel.countDocuments({ status: true });

      res.render('user/shop', { categorys, products,currentPage: page, perPage, totalProducts });
  } catch (error) {
      console.error('Error during search:', error);
      res.render('user/serverError')
  }
};

const ratingUser = async (req, res) => {
  try {
    const { id, rating, review } = req.body;
    const userId = req.session.userId;
    const productId = id;
    
    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }
    if (!product.userRatings) {
      product.userRatings = [];
    }

    const existingUserRating = product.userRatings.find(
      (userRating) => userRating.userId.toString() === userId
    );

    if (existingUserRating) {
      existingUserRating.rating = rating;
      existingUserRating.review = review;
    } else {
     
      product.userRatings.push({ userId, review, rating });
    }

    await product.save();

    res.redirect('/orderdetails');
  } catch (error) {
    console.log("Can't rate product", error);
    res.render('user/serverError')
  }
};


const logout = async (req, res) => {
  try {
    req.session.userId = null;
    req.session.isAuth = false;
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.render('user/serverError')
  }
};




module.exports = {
  home,
  signup,
  signuppost,
  generateotp,
  otp,
  verifyotp,
  resendotp,
  login,
  loginaction,
  forgot,
  forgotpasspost,
  newpassword,
  newpasswordpost,
  profile,
  userdetails,
  logout,
  newAddress,
  newAddresspost,
  editprofile,
  editprofilepost,
  changepass,
  changepasspost,
  deleteAddress,
  editAddress,
  editAddresspost,
  orderDetailsView,
  sortPrice,
  orderTracking,
  orderHistoryShown,
  wallet,
  walletTopup,
  ordercancelling,
  orderReturning,
  itemCancel,
  itemReturn,
  downloadInvoice,
  walletTransaction,
  upi,
  coupons,
  couponApply,
  revokedCoupon,
  searchFunc,
  ratingUser
};
