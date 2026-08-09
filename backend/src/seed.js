const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Category = require('./models/Category');
require('dotenv').config();

const seedDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      // Connect to the running memory server using the backend's db.js if possible,
      // but since it's a separate process, we'd need the exact port.
      // We will just hit the API to register via an HTTP request.
      console.log('To seed, please hit the POST /api/auth/register endpoint instead of running this script directly if using mongodb-memory-server.');
    }
  } catch (error) {
    console.error(error);
  }
};

seedDB();
