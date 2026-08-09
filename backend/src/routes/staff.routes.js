const express = require('express');
const router = express.Router();
const { getActiveOrders, updateOrderStatus, getOrderHistory, cancelOrder, getStaff, createStaff, updateStaff, deleteStaff, createOrder } = require('../controllers/staff.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('OWNER', 'KITCHEN', 'CASHIER'));

router.get('/orders/active', getActiveOrders);
router.post('/orders', authorize('OWNER', 'CASHIER'), createOrder);
router.get('/orders/history', getOrderHistory);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/:id/cancel', authorize('OWNER', 'CASHIER'), cancelOrder);

// Staff Management (Owner only)
router.get('/staff', authorize('OWNER'), getStaff);
router.post('/staff', authorize('OWNER'), createStaff);
router.put('/staff/:id', authorize('OWNER'), updateStaff);
router.delete('/staff/:id', authorize('OWNER'), deleteStaff);

module.exports = router;
