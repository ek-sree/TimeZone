const mongoose = require('mongoose')
const Schema = mongoose.Schema

mongoose.connect("mongodb://127.0.0.1:27017/TimeZone")
    .then(console.log("Cart database connected"))
    .catch(error => console.error("Error connecting cart database", error));

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userdetails"
    },
    item: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true
            },
            stock: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            total: {
                type: Number,
                required: true
            },
        }
    ],
    total: Number
})

const cartModel = mongoose.model('carts', cartSchema)

module.exports = cartModel
