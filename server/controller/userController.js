const userModels = require("../model/userModels")
const otpModel = require('../model/userOtpModels')
const otpgenerator = require('otp-generator')
const bcrypt = require('bcrypt')
const {Email,pass} = require('../../.env')
const nodemailer = require('nodemailer')
const {nameValid,emailValid,phoneValid,passwordValid,confirmPasswordValid}=require("../../utils/validators/signupValidators")



//    <<<<<<<<<---------- RENDERING HOMEPAGE ---------->>>>>>>>>>
const home=async(req,res)=>{
    try {
        req.session.loginpressed=true
    res.render('user/index')
    } catch (error) {
      console.log(error);
      res.status(400).send('error page not found')  
    }
}





//    <<<<<<<<<---------- RENDERING SIGNUP PAGE ---------->>>>>>>>>>
const signup=async(req,res)=>{
    try {
        req.session.otppressed=true
        res.render('user/signup')
    } catch (error) {
        console.log(error);
    }
}


//    <<<<<<<<<---------- OTP SEND MAIL  ---------->>>>>>>>>>
const sendmail = async(email,otp)=>{
    try {
        var transporter = nodemailer.createTransport({
            service:'gmail',
            auth:{
                user:Email,
                pass:pass
            }
        })
        
        var mailOptions={
            from:"TimeZone <timezoneofficial09@gmail.com>",
            to:email,
            subject:'Email Verification',
            text:'Your OTP is:'+otp
        }

        transporter.sendMail(mailOptions)
        console.log("Email sent successfully");

    } catch (error) {
        console.log("cant send message",error);
    }
}


//    <<<<<<<<<----------  OTP GENERATING---------->>>>>>>>>>
const generateotp=()=>{
    const otp = otpgenerator.generate(6,{upperCaseAlphabets: false, lowerCaseAlphabets:false, specialChars:false, digits:true})
    console.log("Generated otp",otp);
    return otp
}


//    <<<<<<<<<---------- SIGNUP VALIDATION ---------->>>>>>>>>>

const signuppost = async(req,res)=>{
    try {
        const username = req.body.username
        const email = req.body.email
        const phone = req.body.phoneNumber
        const password = req.body.password
        const conformPass = req.body.conform-password
        console.log("reached signup");

        const isNameValid = nameValid(username)
        const isEmailValid = emailValid(email)
        const isPhoneValid = phoneValid(phone)
        const ispasswordValid = passwordValid(password)
        // const IsConformPassValid = confirmpasswordValid(conformPass,password)
        // const isConformPassValid = confirmPasswordValid(conformPass, password);
        const isConformPassValid = confirmPasswordValid(req.body['conform-password'], req.body.password);

        console.log("reached validate");

        const emailExist = await userModels.findOne({ email: email })
        if (emailExist) {
            res.render('user/signup', { emailerror: "E-mail already exits" })
        }
        else if (!isEmailValid) {
            res.render('user/signup', { emailerror: "Enter a valid E-mail" })
        }
        else if (!isNameValid) {
            res.render('user/signup', { nameerror: "Enter a valid Name" })
        }
        else if (!isPhoneValid) {
            res.render('user/signup', { phoneerror: "Enter a valid Phone Number" })
        }
        else if (!ispasswordValid) {
            res.render('user/signup', { passworderror: "Password should contain one uppercase,one lowercase,one number,one special charecter" })
        }
        else if (!isConformPassValid) {
            res.render('user/signup', { cpassworderror: "Password and Confirm password should be match" })
        }
        else{
            const hashedpassword = await bcrypt.hash(password,10)
            const user = new userModels({name:username, email:email, phonenumber:phone, password:hashedpassword })
            req.session.user=user
            req.session.signup=true
            req.session.forgot=false
            
            
           

            // req.session.user={
            //     username:username,
            //     email:email,
            //     phonenumber:phone,
            //     password:hashedpassword,
            //     name:username
            // }
            
console.log("reached here");
            const otp = generateotp()
            const currentTimestamp = Date.now()
            const expiryTimestamp = currentTimestamp + 30 *1000;
            const filter = { email: email}
            const update = {
                $set:{
                    email:email,
                    otp:otp,
                    expiry: new Date(expiryTimestamp)
                }
            }

            const option = { upsert : true}
            await otpModel.updateOne(filter, update, option)

            await sendmail(email, otp)
            res.redirect('/otp')
        }
    } catch (error) {
        console.log("Error",error);
        res.send('error')
    }
}
console.log("signup finish");

//    <<<<<<<<<---------- RENDERING OTP PAGE---------->>>>>>>>>>
const otp = (req,res)=>{
    try {
        
        res.render('user/otp')
    } catch (error) {
        res.status(200).send("error occured")
    }
}

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
                        const userdata = await userModels.findOne({email:email})
                        req.session.userId = userdata._id
                        req.session.isAuth = true
                        
                        console.log('User created successfully');
                        res.redirect('/login');
                    } else if (req.session.forgot) {
                        req.session.newpasspressed = true
                        console.log('Redirecting to newpassword page');
                        res.redirect('/newpassword');
                    }
                } catch (error) {
                    console.log(error);
                    res.status(500).send('Error occurred while saving user data');
                }
            } else {
                console.log('Name field is missing in req.session.user');
                res.status(400).send('Name field is missing in req.session.user');
            }
        } else {
            console.log('Wrong OTP or time is expired');
           res.render('user/otp',{otperror:"Invaild otp or time expired"})
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Error occurred');
    }
};


//    <<<<<<<<<---------- RESEND OTP ---------->>>>>>>>>>

const resendotp=async(req, res)=>{
    try {
        const email = req.session.user.email
        const otp = generateotp()
        console.log("Resended otp",otp);

        const currentTimestamp = Date.now()
        const expiryTimestamp = currentTimestamp + 60 * 1000
        await otpModel.updateOne({ email: email},{otp:otp, expiry:new Date(expiryTimestamp)})
        await sendmail(email,otp)
    } catch (error) {
        console.log(error);
    }
}


        //    <<<<<<<<<----------LOGIN RENDER PAGE---------->>>>>>>>>>

const login = (req, res)=>{
    req.session.signuppressed=true
    req.session.forgotpressed=true
    res.render('user/login')
}

     //    <<<<<<<<<----------LOGIN ACTION---------->>>>>>>>>>

const loginaction = async(req, res)=>{
    try {
        const email = req.body.email
        const user = await userModels.findOne({email:email})
console.log("here orrrr")
        if(!user){
            throw new Error('User not found')
        }
console.log("reached hereee");
        const passwordmatch = await bcrypt.compare(req.body.password,user.password)

        if(passwordmatch && user.status){
            req.session.userId = user._id
            req.session.username = user.username
            req.session.isAuth = true
            res.redirect('/')
        }
        else{
            res.render('user/login',{passworderror:"Invaild password or Your accound is blocked"})
        }

    } catch (error) {
        console.error(error)
        res.render('user/login',{emailerror: "Invaild email"})
    }
}

   //    <<<<<<<<<----------Forgot page avtion---------->>>>>>>>>>

const forgot = (req,res)=>{
    
    req.session.otppresssed = true
    res.render('user/forgotpass')
 }


   //    <<<<<<<<<----------Forgot pass  ACTION---------->>>>>>>>>>

   const forgotpasspost = async(req,res)=>{
    try {
        const email = req.body.email
        const emailExist = await userModels.findOne({email:email})
        if(emailExist){
            req.session.forgot = true
            req.session.signup = false
            req.session.user = {email:email}
             const otp = generateotp()
             const currentTimestamp = Date.now()
             const expiryTimestamp = currentTimestamp + 30 * 1000
             const filter = {email:email}
             const update ={
                $set:{
                    email:email,
                    otp:otp,
                    expiry:new Date(expiryTimestamp)
                }
             }
             const options = {upsert:true}
             await otpModel.updateOne(filter,update,options) 

             await sendmail(email,otp)
             req.session.forgotpressed=false
             req.session.otppressed=true
             res.render('user/otp')
        }
        else{
            res.render('user/forgotpass',{emailerror:"Invaild email"})
        }
    } catch (error) {
        console.log(error,"error in forgotpass checking");
        res.status(400).send("error occured page not found"+error)
    }
   }


 //    <<<<<<<<<----------NEW PASSWORD RENDERING PAGE---------->>>>>>>>>>

 const newpassword = (req,res)=>{
    res.render('user/newpassword')
 }


 //    <<<<<<<<<----------NEW PASSWORD RENDERING PAGE---------->>>>>>>>>>
 const newpasswordpost = async(req,res)=>{
    try {
        req.session.otppressed=false
        const password = req.body.password
        // const conformPass = req.body.conform-password
        const conformPass = req.body['conform-password'];

        const ispasswordValid = passwordValid(password)
        const isConformPassValid = confirmPasswordValid(conformPass,password)
        
        if(!ispasswordValid){
            res.redirect('/newpassword',{passworderror:"Password should contain one uppercase,one lowercase,one number,one special charecter"})
        }
        else if(!isConformPassValid){
            res.redirect('/newpassword',{cpassworderror:"password and conform password should match"})
        }
        else{
            const hashedpassword = await bcrypt.hash(password,10)
            const email = req.session.user.email
            await userModels.updateOne({email:email},{password:hashedpassword})
            req.session.newpasspressed= false
            res.redirect('/profile');
        }

    } catch (error) {
        res.status(400).send('error occured page not found'+error)
    }
 }

 const profile= async(req,res)=>{
    try {
        if(req.session.isAuth){
            const userId= req.session.userId
        const user = await userModels.findOne({_id:userId})
    const name = user.name
    console.log("username:",name);
    res.render('user/profile',{name})
        }
        else{
            req.session.signuppressed=true
            req.session.forgotpressed=true
            res.render('user/login')
        }
    } catch (error) {
        
    }
 }

 const logout = async(req,res)=>{
    try {
    req.session.userId=null
    req.session.isAuth=false
    req.session.destroy()
    res.redirect('/')
    } catch (error) {
        console.log(error);
        res.status(400).send("error occured")
    }
 }

 const shop = (req,res)=>{
    try {
        res.render('user/shop')
    } catch (error) {
        
    }
 }

module.exports = { home, signup, signuppost, generateotp, otp, verifyotp, resendotp ,login ,loginaction ,forgot ,forgotpasspost ,newpassword ,newpasswordpost ,profile ,logout, shop};
