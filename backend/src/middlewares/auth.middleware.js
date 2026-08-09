const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      // We attach the user object minus passwordHash to the request object
      // This implicitly provides req.user.restaurantId enforcing multi-tenancy
      req.user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (!req.user || !req.user.isActive) {
         return res.status(401).json({ message: 'User is inactive or not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
