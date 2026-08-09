const jwt = require('jsonwebtoken');

const generateToken = (userId, restaurantId, role) => {
  return jwt.sign(
    { userId, restaurantId, role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
};

module.exports = { generateToken, verifyToken };
