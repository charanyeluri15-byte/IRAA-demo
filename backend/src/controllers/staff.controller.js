const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const socketUtil = require('../utils/socket');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      restaurantId: req.user.restaurantId,
      status: { $ne: 'COMPLETED' }
    }).populate('tableId', 'tableNumber').sort('createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const schema = Joi.object({
      status: Joi.string().valid('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED').optional(),
      paymentStatus: Joi.string().valid('PENDING', 'PAID').optional(),
      paymentMethod: Joi.string().valid('CASH', 'UPI', 'CARD').optional()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { $set: req.body },
      { new: true }
    ).populate('tableId', 'tableNumber');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    try {
      socketUtil.getIO().to(req.user.restaurantId.toString()).emit('orderUpdated', order);
    } catch(e) { console.log('Socket broadcast failed', e.message); }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    
    let filter = { restaurantId: req.user.restaurantId };
    
    // Add date filtering if provided
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    }
    
    // For search by customer name or table number (needs populate match or just ID match)
    // To keep it simple, search customerName
    if (search) {
      filter.customerName = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(filter)
      .populate('tableId', 'tableNumber')
      .populate('cancelledBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
      
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    
    // Ensure only Owner or Cashier can cancel (done via routes auth)
    if (req.user.role === 'KITCHEN') {
      return res.status(403).json({ message: 'Kitchen staff cannot cancel orders' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { 
        $set: { 
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: cancellationReason || 'No reason provided',
          cancelledBy: req.user.userId
        } 
      },
      { new: true }
    ).populate('tableId', 'tableNumber');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    try {
      socketUtil.getIO().to(req.user.restaurantId.toString()).emit('orderUpdated', order);
    } catch(e) { console.log('Socket broadcast failed', e.message); }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ 
      restaurantId: req.user.restaurantId, 
      role: { $in: ['WAITER', 'CASHIER', 'KITCHEN'] } 
    }).select('-passwordHash');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStaff = async (req, res) => {
  try {
    const { name, email, password, employeeId, phone, shift, role } = req.body;
    
    if (!['WAITER', 'CASHIER', 'KITCHEN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User with this email already exists' });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const staff = await User.create({
      restaurantId: req.user.restaurantId,
      name,
      email,
      passwordHash,
      role,
      employeeId,
      phone,
      shift
    });
    
    res.status(201).json({ _id: staff._id, name: staff.name, email: staff.email, role: staff.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { name, employeeId, phone, shift, isActive, role } = req.body;
    const staff = await User.findOne({ 
      _id: req.params.id, 
      restaurantId: req.user.restaurantId, 
      role: { $in: ['WAITER', 'CASHIER', 'KITCHEN'] } 
    });
    
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    if (name) staff.name = name;
    if (employeeId) staff.employeeId = employeeId;
    if (phone) staff.phone = phone;
    if (shift) staff.shift = shift;
    if (role && ['WAITER', 'CASHIER', 'KITCHEN'].includes(role)) staff.role = role;
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();
    res.json({ _id: staff._id, name: staff.name, email: staff.email, role: staff.role, isActive: staff.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId: req.user.restaurantId, 
      role: { $in: ['WAITER', 'CASHIER', 'KITCHEN'] } 
    });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { orderType, orderSource, externalOrderId, externalPlatform, tableId, items, customerName, customerPhone, paymentStatus, paymentMethod } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    if (orderType === 'DINE_IN' && !tableId) {
      return res.status(400).json({ message: 'Table ID is required for Dine-In orders' });
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
        quantity: item.quantity,
        notes: item.notes || ''
      });
    }

    const orderPayload = {
      restaurantId,
      orderType,
      orderSource,
      items: orderItems,
      totalAmount,
      subtotal: totalAmount,
      grandTotal: totalAmount,
      customerName: customerName || (orderType === 'EXTERNAL' ? externalPlatform : 'Guest'),
      customerPhone,
      paymentStatus: paymentStatus || 'PENDING',
      paymentMethod: paymentMethod || 'CASH'
    };

    if (orderType === 'DINE_IN') orderPayload.tableId = tableId;
    if (orderType === 'EXTERNAL') {
      orderPayload.externalOrderId = externalOrderId;
      orderPayload.externalPlatform = externalPlatform;
    }

    const order = await Order.create(orderPayload);
    const populatedOrder = await Order.findOne({ _id: order._id, restaurantId }).populate('tableId', 'tableNumber');

    try {
      socketUtil.getIO().to(restaurantId.toString()).emit('newOrder', populatedOrder);
    } catch(e) {
      console.log('Socket failed', e.message);
    }

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActiveOrders, updateOrderStatus, getOrderHistory, cancelOrder, getStaff, createStaff, updateStaff, deleteStaff, createOrder };
