const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    email: { type: String, required: true },
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postal: { type: String, required: true },
    payment_method: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
