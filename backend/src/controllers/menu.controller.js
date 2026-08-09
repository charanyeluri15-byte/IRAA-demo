const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Joi = require('joi');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ restaurantId: req.user.restaurantId }).sort('order name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      order: Joi.number().optional()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const category = await Category.create({
      restaurantId: req.user.restaurantId,
      ...req.body
    });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Category name already exists' });
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const itemsCount = await MenuItem.countDocuments({ categoryId: req.params.id, restaurantId: req.user.restaurantId });
    if (itemsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing menu items' });
    }

    const category = await Category.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMenuItems = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { restaurantId: req.user.restaurantId };
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    if (category) {
      filter.categoryId = category;
    }

    const items = await MenuItem.find(filter).populate('categoryId', 'name').sort('name');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const schema = Joi.object({
      categoryId: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().allow('').optional(),
      costPrice: Joi.number().min(0).required(),
      sellingPrice: Joi.number().min(0).required(),
      isAvailable: Joi.boolean().optional()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const category = await Category.findOne({ _id: req.body.categoryId, restaurantId: req.user.restaurantId });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const item = await MenuItem.create({
      restaurantId: req.user.restaurantId,
      ...req.body
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editMenuItem = async (req, res) => {
  try {
    const schema = Joi.object({
      categoryId: Joi.string().optional(),
      name: Joi.string().optional(),
      description: Joi.string().allow('').optional(),
      costPrice: Joi.number().min(0).optional(),
      sellingPrice: Joi.number().min(0).optional(),
      isAvailable: Joi.boolean().optional(),
      imageUrl: Joi.string().allow('').optional()
    });
    
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { $set: value },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories, createCategory, deleteCategory,
  getMenuItems, createMenuItem, editMenuItem, deleteMenuItem, toggleAvailability
};
