const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  tableNumber: {
    type: String,
    required: true,
    trim: true
  },
  qrCodeUrl: {
    type: String,
    // Will be generated based on table ID
  },
  capacity: {
    type: Number,
    required: true,
    default: 4
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'INACTIVE'],
    default: 'AVAILABLE'
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure table numbers are unique per restaurant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
