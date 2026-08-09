require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-erp');
    const user = await User.findOne({ email: 'charanyeluri6@gmail.com' });
    if (user) {
      console.log('User found:', {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasPasswordHash: !!user.passwordHash
      });
    } else {
      console.log('User not found in database.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
  }
};

checkUser();
