const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  userId: {
    type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  servicePrice: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: false
  },
  endDate: {
    type: Date,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  status: {
    type: Boolean,
    default: true
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
  }]
});

const Service = mongoose.model("Service", ServiceSchema);

module.exports = Service;
