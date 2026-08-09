const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  unit: {
    type: String,
    required: true, // e.g. kg, liters, units
    trim: true
  },
  currentStock: {
    type: Number,
    default: 0
  },
  lowStockAlertThreshold: {
    type: Number,
    default: 10
  },
  costPerUnit: {
    type: Number,
    default: 0
  },
  supplierInfo: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
