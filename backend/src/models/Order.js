const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  notes: { type: String, trim: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  orderType: { type: String, enum: ['DINE_IN', 'PARCEL', 'EXTERNAL'], default: 'DINE_IN' },
  orderSource: { type: String, enum: ['DINE_IN', 'WAITER', 'PARCEL', 'SWIGGY', 'ZOMATO'], default: 'DINE_IN' },
  externalOrderId: { type: String },
  externalPlatform: { type: String, enum: ['SWIGGY', 'ZOMATO'] },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  waiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'], 
    default: 'PLACED' 
  },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'CARD']
  },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  serviceCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  grandTotal: { type: Number, default: 0 },
  customerName: { type: String, default: 'Guest' },
  customerPhone: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
