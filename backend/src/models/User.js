const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['OWNER', 'MANAGER', 'KITCHEN', 'CASHIER', 'WAITER'],
    required: true,
    default: 'OWNER'
  },
  employeeId: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  shift: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
