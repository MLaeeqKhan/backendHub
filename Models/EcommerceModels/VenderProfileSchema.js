const mongoose = require('mongoose');
const { Schema } = mongoose;

const vendorProfileSchema = new Schema({
  businessName: {
    type: String,
    required: true,
  },
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
},
  businessEmail: {
    type: String,
    required: true,
  },
  businessContact: {
    type: String,
    required: true,
  },
  businessType: {
    type: String,
    enum: ['IN', 'COM'], // Assuming 'IN' stands for Individual and 'COM' stands for Company
    required: true,
  },
  businessDescription: {
    type: String,
  },
  businessAddress: {
    type: String,
    required: true,
  },
  pickupAddress: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  city: {
    type: String,
    required: true,
  },
  postalCode: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true, // This will add createdAt and updatedAt timestamps
});

const VendorProfile = mongoose.model('VendorProfile', vendorProfileSchema);

module.exports = VendorProfile;
