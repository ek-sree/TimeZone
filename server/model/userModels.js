const mongoose = require('mongoose')
const bcyrpt = require('bcrypt')

mongoose.connect("mongodb://127.0.0.1:27017/TimeZone")
.then(console.log("user database connected"))
.catch((err)=>console.log(err))

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phonenumber:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        default:false,
        required:true
    }
   
})

const userModels = new mongoose.model("userdetails",userSchema)

module.exports = userModels