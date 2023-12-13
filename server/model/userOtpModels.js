const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/TimeZone')
.then(console.log("otp database connected"))
.catch((err)=>console.log(err))

const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        require:true,
        Unique:true
    },
    otp:{
        type:Number,
        require:true
    },
    expiry:{
        type:Date,
        require:true
    }
})

const otpModel = new mongoose.model("otp_details", otpSchema)

module.exports=otpModel