const mongoose = require('mongoose');

const ProductReviewsSchema= new mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'PRODUCT',
        required: true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content:{
        type:String,
        required:true
    }
})
const productReviewsSchema = mongoose.model("PRODUCTREVIEWS", ProductReviewsSchema);

module.exports = productReviewsSchema;