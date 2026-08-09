const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
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
  order: {
    type: Number,
    default: 0
  },
  subCategories: [{
    name: { type: String, trim: true }
  }]
}, { timestamps: true });

categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
