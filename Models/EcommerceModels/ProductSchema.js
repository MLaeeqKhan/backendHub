const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    productPrice: {
        type: Number, // Change to Number
        required: true
    },
    stockQuantity: {
        type: Number, // Change to Number
        required: true
    },
    image: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    multipleImages: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    category: {
        type: String,
        required: true
    },
    startDate: {
        type: Date, 
        required: false
    },
    endDate: {
        type: Date, 
        required: false
    }
});

const Product = mongoose.model("PRODUCT", ProductSchema);

module.exports = Product;