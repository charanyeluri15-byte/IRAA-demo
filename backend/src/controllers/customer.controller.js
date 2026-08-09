const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const socketUtil = require('../utils/socket');

const getMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const categories = await Category.find({ restaurantId }).sort('order name');
    const items = await MenuItem.find({ restaurantId, isAvailable: true });
    
    const menu = categories.map(cat => {
      return {
        ...cat._doc,
        items: items.filter(item => item.categoryId.toString() === cat._id.toString())
      };
    });

    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkTable = async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.params;
    const table = await Table.findOne({ restaurantId, tableNumber });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const placeOrder = async (req, res) => {
  try {
    const { restaurantId, tableId, items, customerName } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId });
      if (!dbItem || !dbItem.isAvailable) {
        return res.status(400).json({ message: `Item ${item.name || item.menuItemId} is unavailable.` });
      }
      const itemTotal = dbItem.sellingPrice * item.quantity;
      totalAmount += itemTotal;
      orderItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.sellingPrice,
        quantity: item.quantity
      });
    }

    const order = await Order.create({
      restaurantId,
      tableId,
      customerName: customerName || 'Guest',
      items: orderItems,
      totalAmount
    });

    const populatedOrder = await Order.findById(order._id).populate('tableId', 'tableNumber');
    
    try {
      socketUtil.getIO().to(restaurantId).emit('newOrder', populatedOrder);
    } catch(e) {
      console.log('Socket failed', e.message);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('tableId', 'tableNumber');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const callWaiter = async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.params;
    try {
      socketUtil.getIO().to(restaurantId).emit('customerAssistance', { tableNumber, timestamp: new Date() });
    } catch(e) {
      console.log('Socket failed', e.message);
    }
    res.json({ message: 'Waiter called' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMenu, checkTable, placeOrder, getOrderStatus, callWaiter };
