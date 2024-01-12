const mongoose = require('mongoose')


mongoose.connect("mongodb://127.0.0.1:27017/TimeZone")
    .then(console.log("coupon database connected"))
    .catch(error => console.error("Error connecting cart database", error));

const couponSchema = new mongoose.Schema({
    couponCode:{
        type:String,
        required:true,
        uppercase:true
    },
    type:{
        type:String,
        required:true
    },
    minimumPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        required:true
    },
    maxRedeem:{
        type:Number,
        required:true
    },
    expiry:{
        type:Date,
        required:true
    },
    status:{
        type:Boolean,
        required:true,
        default:true
    }
})

couponSchema.index({expiry:1},{expireAfterSeconds:0})

const couponModel = new mongoose.model('coupons',couponSchema)

module.exports= couponModel