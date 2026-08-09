const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  visitCount: {
    type: Number,
    default: 1
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  birthday: {
    type: Date
  },
  favouriteItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }]
}, { timestamps: true });

customerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
