const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    default: 'USD',
    trim: true
  },
  openingHours: {
    type: String,
    trim: true
  },
  themeColor: { 
    type: String, 
    default: '#3B82F6', 
    trim: true 
  },
  taxSettings: {
    gst: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 }
  },
  receiptConfig: {
    header: { type: String, trim: true },
    footer: { type: String, trim: true, default: 'Thank you for your visit!' },
    printerSize: { type: String, enum: ['58mm', '80mm'], default: '80mm' }
  },
  socialLinks: {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
