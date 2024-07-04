const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderCode: { type: String, required: true },
    email: { type: String, required: true },
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postal: { type: String, required: true },
    status: { type: Boolean, default: true },
    paymentStatus: { type: Boolean, default: true },
    payment_method: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    productIdies: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'PRODUCT', required: true },
        quantity: { type: Number, required: true }
    }] }, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
