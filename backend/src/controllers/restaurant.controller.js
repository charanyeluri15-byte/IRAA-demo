const Restaurant = require('../models/Restaurant');

/**
 * @desc    Get current restaurant profile
 * @route   GET /api/restaurant/profile
 * @access  Private (Owner, Staff)
 */
exports.getProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update restaurant profile
 * @route   PUT /api/restaurant/profile
 * @access  Private (Owner only)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, logo, address, phone, email, gstNumber, currency, openingHours, isActive,
      themeColor, taxSettings, receiptConfig, socialLinks
    } = req.body;
    
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Update fields
    if (name !== undefined) restaurant.name = name;
    if (logo !== undefined) restaurant.logo = logo;
    if (address !== undefined) restaurant.address = address;
    if (phone !== undefined) restaurant.phone = phone;
    if (email !== undefined) restaurant.email = email;
    if (gstNumber !== undefined) restaurant.gstNumber = gstNumber;
    if (currency !== undefined) restaurant.currency = currency;
    if (openingHours !== undefined) restaurant.openingHours = openingHours;
    if (isActive !== undefined) restaurant.isActive = isActive;
    
    // New fields
    if (themeColor !== undefined) restaurant.themeColor = themeColor;
    if (taxSettings !== undefined) restaurant.taxSettings = { ...restaurant.taxSettings, ...taxSettings };
    if (receiptConfig !== undefined) restaurant.receiptConfig = { ...restaurant.receiptConfig, ...receiptConfig };
    if (socialLinks !== undefined) restaurant.socialLinks = { ...restaurant.socialLinks, ...socialLinks };
    
    await restaurant.save();
    
    res.json(restaurant);
  } catch (error) {
    console.error('Update restaurant profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
