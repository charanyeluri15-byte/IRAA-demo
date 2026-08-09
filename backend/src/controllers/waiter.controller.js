const Table = require('../models/Table');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const socketUtil = require('../utils/socket');

const getTables = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const tables = await Table.find({ restaurantId }).lean();
    
    // Find active orders for these tables
    const activeOrders = await Order.find({
      restaurantId,
      status: { $in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] }
    }).lean();

    // Map orders to tables to determine status
    const tablesWithStatus = tables.map(table => {
      const order = activeOrders.find(o => o.tableId.toString() === table._id.toString());
      let status = 'Available';
      
      if (order) {
        if (order.status === 'PLACED') status = 'Ordering';
        else if (order.status === 'ACCEPTED' || order.status === 'PREPARING') status = 'Preparing';
        else if (order.status === 'READY') status = 'Ready to Serve';
        else if (order.status === 'SERVED') status = 'Served';
      }
      // Note: 'Waiting for Bill' could be a specific order state or derived differently, 
      // but we will stick to basic mapping for now. Wait, if payment is pending and status is completed, it's waiting for bill.
      
      // Let's check completed but unpaid orders to see if they are waiting for bill
      return {
        ...table,
        status,
        currentOrderId: order ? order._id : null
      };
    });

    // Handle Waiting for Bill
    const unpaidCompletedOrders = await Order.find({
      restaurantId,
      status: 'COMPLETED',
      paymentStatus: 'PENDING'
    }).lean();

    unpaidCompletedOrders.forEach(order => {
      const table = tablesWithStatus.find(t => t._id.toString() === order.tableId.toString());
      if (table && table.status === 'Available') {
        table.status = 'Waiting for Bill';
        table.currentOrderId = order._id;
      }
    });

    res.json(tablesWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const placeOrder = async (req, res) => {
  try {
    const { tableId, items } = req.body;
    const restaurantId = req.user.restaurantId;
    
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
        quantity: item.quantity,
        notes: item.notes || ''
      });
    }

    const order = await Order.create({
      restaurantId,
      tableId,
      waiterId: req.user._id,
      items: orderItems,
      totalAmount
    });

    const populatedOrder = await Order.findById(order._id).populate('tableId', 'tableNumber');
    
    try {
      socketUtil.getIO().to(restaurantId.toString()).emit('newOrder', populatedOrder);
    } catch(e) {
      console.log('Socket failed', e.message);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const modifyOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const order = await Order.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.status !== 'PLACED') {
      return res.status(400).json({ message: 'Cannot modify order after kitchen has accepted it.' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findOne({ _id: item.menuItemId, restaurantId: req.user.restaurantId });
      if (!dbItem) return res.status(400).json({ message: 'Invalid item' });
      
      totalAmount += dbItem.sellingPrice * item.quantity;
      orderItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.sellingPrice,
        quantity: item.quantity,
        notes: item.notes || ''
      });
    }

    order.items = orderItems;
    order.totalAmount = totalAmount;
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate('tableId', 'tableNumber');
    
    try {
      socketUtil.getIO().to(req.user.restaurantId.toString()).emit('orderUpdated', populatedOrder);
    } catch(e) {}

    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const serveOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'READY') {
      return res.status(400).json({ message: 'Order is not ready to serve.' });
    }

    order.status = 'SERVED';
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate('tableId', 'tableNumber');
    
    try {
      socketUtil.getIO().to(req.user.restaurantId.toString()).emit('orderUpdated', populatedOrder);
    } catch(e) {}

    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestBill = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    try {
      socketUtil.getIO().to(req.user.restaurantId.toString()).emit('billRequested', {
        orderId: order._id,
        tableId: order.tableId
      });
    } catch(e) {}

    res.json({ success: true, message: 'Bill requested' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveOrders = async (req, res) => {
    try {
        const activeOrders = await Order.find({
            restaurantId: req.user.restaurantId,
            status: { $in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] }
        }).populate('tableId', 'tableNumber').sort({ createdAt: -1 });
        res.json(activeOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { getTables, placeOrder, modifyOrder, serveOrder, requestBill, getActiveOrders };
