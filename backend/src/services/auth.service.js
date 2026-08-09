const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async registerOwner({ restaurantName, userName, email, password }) {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error('User with this email already exists');
    }

    // 2. Create Restaurant Tenant
    const restaurant = await Restaurant.create({ name: restaurantName });

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create Owner User
    const user = await User.create({
      restaurantId: restaurant._id,
      name: userName,
      email,
      passwordHash,
      role: 'OWNER'
    });

    // 5. Generate Token
    const token = generateToken(user._id, restaurant._id, user.role);

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId
      },
      restaurant
    };
  }

  async loginUser({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    const token = generateToken(user._id, user.restaurantId, user.role);

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId
      }
    };
  }
}

module.exports = new AuthService();
