const authService = require('../services/auth.service');
const Joi = require('joi');

const registerOwner = async (req, res) => {
  try {
    const schema = Joi.object({
      restaurantName: Joi.string().required(),
      userName: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const result = await authService.registerOwner(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  // req.user is set by the protect middleware
  res.status(200).json({ user: req.user });
};

module.exports = {
  registerOwner,
  loginUser,
  getMe
};
