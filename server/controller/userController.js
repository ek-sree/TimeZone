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


//    <<<<<<<<<---------- RENDERING HOMEPAGE ---------->>>>>>>>>>
const home = async (req, res) => {
  try {
    req.session.loginpressed = true;
    const products = await productModel.find();
    res.render("user/index", { products });
  } catch (error) {
    console.log(error);
    res.status(400).send("error page not found");
  }
};

//    <<<<<<<<<---------- RENDERING SIGNUP PAGE ---------->>>>>>>>>>
const signup = async (req, res) => {
  try {
    req.session.otppressed = true;
    res.render("user/signup");
  } catch (error) {
    console.log(error);
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
    console.log("Email sent successfully");
  } catch (error) {
    console.log("cant send message", error);
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
    console.log("reached signup");

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

    console.log("reached validate");

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
      req.session.user = user;
      req.session.signup = true;
      req.session.forgot = false;

      console.log("reached here");
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
    res.send("error");
  }
};
console.log("signup finish");

//    <<<<<<<<<---------- RENDERING OTP PAGE---------->>>>>>>>>>
const otp = (req, res) => {
  try {
    res.render("user/otp");
  } catch (error) {
    res.status(200).send("error occured");
  }
};

console.log("otp found");

//    <<<<<<<<<---------- VERIFY OTP ---------->>>>>>>>>>

const verifyotp = async (req, res) => {
  try {
    const enteredotp = req.body.otp;
    const user = req.session.user;

    console.log(enteredotp);
    console.log(req.session.user);

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

            console.log("User created successfully");
            res.redirect("/login");
          } else if (req.session.forgot) {
            req.session.newpasspressed = true;
            console.log("Redirecting to newpassword page");
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
      console.log("Wrong OTP or time is expired");
      res.render("user/otp", { otperror: "Invaild otp or time expired" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred");
  }
};

//    <<<<<<<<<---------- RESEND OTP ---------->>>>>>>>>>

const resendotp = async (req, res) => {
  try {
    const email = req.session.user.email;
    const otp = generateotp();
    console.log("Resended otp", otp);

    const currentTimestamp = Date.now();
    const expiryTimestamp = currentTimestamp + 60 * 1000;
    await otpModel.updateOne(
      { email: email },
      { otp: otp, expiry: new Date(expiryTimestamp) }
    );
    await sendmail(email, otp);
  } catch (error) {
    console.log(error);
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
    console.log("here orrrr");
    if (!user) {
      throw new Error("User not found");
    }
    console.log("reached hereee");
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
    res.status(400).send("error occured page not found" + error);
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
    res.status(400).send("error occured page not found" + error);
  }
};

const profile = async (req, res) => {
  try {
    if (req.session.isAuth) {
      const userId = req.session.userId;
      const user = await userModels.findOne({ _id: userId });
      const name = user.name;
      console.log("username:", name);
      res.render("user/profile", { name, userId });
    } else {
      req.session.signuppressed = true;
      req.session.forgotpressed = true;
      res.render("user/login");
    }
  } catch (error) {}
};

const userdetails = async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log("is it comming ", userId);
    const data = await userModels.findOne({ _id: userId });
    console.log("is it comming data", data);
    res.render("user/userdetails", { userData: data });
  } catch (error) {
    console.log("error showing user details");
    res.status(400).send("error showing userdetails");
  }
};

const newAddress = async (req, res) => {
  res.render("user/newAddress");
};

const newAddresspost = async (req, res) => {
  try {
    console.log("is post address working");
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
    console.log("gettig in body");
    const userId = req.session.userId;
    console.log("body id", userId);
    const userExisted = await userModels.findOne({ _id: userId });
    console.log("bhhhhhhhhhhhhhhhhhhh", userExisted);
    const fullnamevalid = bnameValid(fullname);
    const saveasvalid = bnameValid(saveas);
    const adnameValid = bnameValid(adname);
    const streetValid = bnameValid(street);
    const pinvalid = pincodeValid(pincode);
    const cityValid = bnameValid(city);
    const stateValid = bnameValid(state);
    const countryValid = bnameValid(country);
    const phoneValid = adphoneValid(phone);
    console.log("assiing validation");
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
        console.log("Address already exists");
        res.redirect("/newAddress");
      } else {
        console.log("userexist", userExisted);
        console.log("addressexist", addressExist);
        console.log("Before pushing address:", userExisted.address);
        console.log("Address does not exist, adding new address");
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
        console.log("Save result:", result);

        console.log("Here is the updated address", userExisted);
        res.redirect("/userdetails");
      }
    }
  } catch (error) {}
};

const editprofile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userData = await userModels.findOne({ _id: userId });
    res.render("user/editprofile", { userData });
  } catch (error) {
    console.log("error loading edit user details page");
    res.status(400).send("error loading page");
  }
};

const editprofilepost = async (req, res) => {
  try {
    const { name, phone } = req.body;
    console.log("edit post value get", name, phone);
    const userId = req.session.userId;
    console.log("user id get for edit details", userId);
    await userModels.updateOne(
      { _id: userId },
      { $set: { name: name, phonenumber: phone } }
    );
    res.redirect("/userdetails");
  } catch (error) {
    console.log("cant edit user details");
    res.status(400).send("error editing user details");
  }
};

const changepass = async (req, res) => {
  try {
    res.render("user/changepass");
  } catch (error) {
    console.log("error rendering changepass page");
    res.status(400).send("error rendering change password page");
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
    res.status(500).send("Internal Server Error");
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log("edit address", userId);
    const addressId = req.params.addressId;
    console.log("edit address id", addressId);
    const user = await userModels.findOne({ _id: userId });
    console.log("hhhhhhhhhhhhh");
    const addressToEdit = user.address.types.id(addressId);
    console.log("thiisss", addressToEdit);
    res.render("user/editaddress.ejs", { addressToEdit: addressToEdit });
  } catch (error) {}
};

const editAddresspost = async (req, res) => {
  try {
    console.log("is post address working");
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
    console.log("gettig in body");
    const userId = req.session.userId;
    console.log("body id", userId);
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
    console.log("bhhhhhhhhhhhhhhhhhhh", userExisted);
    const fullnamevalid = bnameValid(fullname);
    const saveasvalid = bnameValid(saveas);
    const adnameValid = bnameValid(adname);
    const streetValid = bnameValid(street);
    const pinvalid = pincodeValid(pincode);
    const cityValid = bnameValid(city);
    const stateValid = bnameValid(state);
    const countryValid = bnameValid(country);
    const phoneValid = adphoneValid(phone);
    console.log("assiing validation");
    if (!saveasvalid) {
      return res.redirect(`/editaddress/${addressId}`, {
        saveaserror: "Enter valid address type",
      });
    }
    if (!fullnamevalid) {
      return res.redirect(`/editaddress/${addressId}`, {
        fullnameerror: "Enter a valid fullname",
      });
    }
    if (!adnameValid) {
      return res.redirect(`/editaddress/${addressId}`, {
        adnameerror: "Enter a valid house or flat name",
      });
    }
    if (!streetValid) {
      return res.redirect(`/editaddress/${addressId}`, {
        streeterror: "Enter a valid street name",
      });
    }
    if (!pinvalid) {
      return res.redirect(`/editaddress/${addressId}`, {
        pinerror: "Enter a valid pincode",
      });
    }
    if (!cityValid) {
      return res.redirect(`/editaddress/${addressId}`, {
        cityerror: "Enter a valid city",
      });
    }
    if (!stateValid) {
      return res.redirect(`/editaddress/${addressId}`, {
        stateerror: "Enter a valid state",
      });
    }
    if (!countryValid) {
      return res.redirect(`/editaddress/${addressId}`, {
        countryerror: "Enter a valid country",
      });
    }
    if (!phoneValid) {
      return res.redirect(`/editaddress/${addressId}`, {
        phoneerror: "Enter a valid Phone number",
      });
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
    console.log("address edited");
  } catch (error) {
    console.log("update address error");
    res.status(400).send("cant edit address error!");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    const addressId = req.params.addressId;
    console.log("address id for delete", addressId);
    await userModels.updateOne(
      { _id: userId, "address.types._id": addressId },
      { $pull: { "address.types": { _id: addressId } } }
    );
    res.redirect("/userdetails");
  } catch (error) {
    console.log("delete address is not working");
    res.status(400).send("delete address is not wooking");
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
        res.status(400).send("cant show user order details error happened",error)
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
      res.status(500).json({ error: 'Internal Server Error' });
  }
};


const orderTracking = async (req,res)=>{
  try {
    const oid = req.params.id

    const  order = await orderModel.findOne({_id:oid})

    res.render('user/orderTrack',{order})
  } catch (error) {
    
  }
}


const orderHistoryShown = async(req,res)=>{
  try {
    const pid = req.params.id
    const order = await orderModel.findOne({_id:pid})
    res.render('user/orderTrack',{order:order})
  } catch (error) {
    
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
    res.status(404).send("cant add amount to wallet",error)
    console.log("cant add amount to wallet",error);
  }
}


const ordercancelling = async (req,res)=>{
  try {
    const userId = req.session.userId
    const oid = req.params.id
    await orderModel.updateOne({_id:oid},{status:"Cancelled"})
    const result = await orderModel.findOne({_id:oid})
    
    if (result.paymentMethod == 'Razorpay' || result.paymentMethod == "Wallet") {
      const user = await walletModel.findOne({userId:userId})

      const refund = result.totalPrice
      const currentWallet = user.wallet

      const newWallet = currentWallet + refund
      await walletModel.updateOne({userId:userId},{$set:{wallet:newWallet},$push:{walletTransactions:{date: new Date(),type:"Credited",amount:refund }}})
    }

    const items = result.items.map(item=>({
      productId:item.productId,
      quantity:item.quantity
    }))

    for(const item of items){
      const product = await productModel.findOne({_id:item.productId})

      product.stock += item.quantity
      await product.save()
    }
    res.redirect('/orderdetails')
    console.log("order cancelled");
  } catch (error) {
    console.log("error cancelling product",error);
    res.status(404).send('error cancelling product')
  }
}

const orderReturning = async (req,res)=>{
  try {
    const userId = req.session.userId
    const id = req.params.id
    console.log("aaa",id,"user",userId);

    const user = await walletModel.findOne({userId:userId})
    await orderModel.updateOne({_id:id},{status:"Returned"})
    const result = await orderModel.findOne({_id:id})
    const refund = result.totalPrice

    const currentWallet = user.wallet
    const newWallet = currentWallet + refund

    await walletModel.updateOne({userId:userId},{$set:{wallet:newWallet},$push:{walletTransactions:{date:new Date(),type:"Credited",amount:refund}}})

    const items = result.items.map(item=>({
      productId:item.productId,
      quantity:item.quantity
    }))

    for(const item of items){
      const product = await productModel.findOne({_id:item.productId})
      product.stock+= item.quantity
      await product.save()
      console.log("order returned success");
    }
    res.redirect('/orderdetails')
  } catch (error) {
    res.status(404).send("cant return order error",error)
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

    product.stock += singleItem.quantity;
    await product.save();
console.log("reaminging canccel working??");
    const remainingNotCancelled =  order.items.filter(
      (item) => item.status !== "cancelled"
    );
console.log("items remainging cancel",remainingNotCancelled)
    if (remainingNotCancelled.length <2) {
      order.status = "Cancelled";
      await order.save();
      console.log("its working: all items cancelled, main status updated");
    }

    res.redirect(`/singleorder/${orderId}`);
  } catch (error) {
    console.log("error cancelling single product", error);
    res.status(404).send("error cancelling single product");
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
    res.status(404).send("error returning this product",error)
  }
}

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(orderId);
    const order = await orderModel.findOne({ orderId: orderId });
    console.log("innn", order);

    const pdfBuffer = await generateInvoice(order);

    if (pdfBuffer) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
      res.send(pdfBuffer);
    } else {
      console.log("Error generating PDF");
      res.status(500).send('Error generating invoice PDF');
    }
  } catch (error) {
    console.log("cant send pdf invoice", error);
    res.status(500).send('Error generating invoice PDF');
  }
};


const generateInvoice = async (order) => {
  try {
    let totalAmount = order.totalPrice;
    console.log("from invoice", totalAmount);
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
    console.log("output here",output);
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
  console.log("wallet trasaction is woroking??");
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
    res.status(404).send("error occured during wallet transaction!!")
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

const logout = async (req, res) => {
  try {
    req.session.userId = null;
    req.session.isAuth = false;
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(404).send("error occured",error);
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
  upi
};
