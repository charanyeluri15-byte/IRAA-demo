const Table = require('../models/Table');
const Joi = require('joi');

const getTables = async (req, res) => {
  try {
    const tables = await Table.find({ restaurantId: req.user.restaurantId }).sort('tableNumber');
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTable = async (req, res) => {
  try {
    const schema = Joi.object({
      tableNumber: Joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const qrCodeUrl = `${process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/menu/${req.user.restaurantId}/table/${req.body.tableNumber}`;

    const table = await Table.create({
      restaurantId: req.user.restaurantId,
      tableNumber: req.body.tableNumber,
      qrCodeUrl
    });
    res.status(201).json(table);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Table number already exists' });
    res.status(500).json({ message: error.message });
  }
};

const deleteTable = async (req, res) => {
  try {
    const table = await Table.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editTable = async (req, res) => {
  try {
    const schema = Joi.object({
      tableNumber: Joi.string().required(),
      isActive: Joi.boolean().optional()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { $set: req.body },
      { new: true }
    );
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json(table);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Table number already exists' });
    res.status(500).json({ message: error.message });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const table = await Table.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    
    table.isActive = !table.isActive;
    await table.save();
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const regenerateQr = async (req, res) => {
  try {
    const table = await Table.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    
    // In a real app, we might add a unique hash to invalidate old QRs, but for now we just regenerate the URL
    // Maybe with a timestamp param to force refresh or a short UUID
    const randomHash = Math.random().toString(36).substring(2, 8);
    table.qrCodeUrl = `${process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/menu/${req.user.restaurantId}/table/${table.tableNumber}?v=${randomHash}`;
    
    await table.save();
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTables, createTable, deleteTable, editTable, toggleStatus, regenerateQr };
