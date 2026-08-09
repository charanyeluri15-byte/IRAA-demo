const express = require('express');
const router = express.Router();
const { getTables, placeOrder, modifyOrder, serveOrder, requestBill, getActiveOrders } = require('../controllers/waiter.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('WAITER', 'OWNER', 'CASHIER'));

router.get('/tables', getTables);
router.get('/orders/active', getActiveOrders);
router.post('/order', placeOrder);
router.put('/order/:id', modifyOrder);
router.patch('/order/:id/serve', serveOrder);
router.post('/order/:id/bill', requestBill);

module.exports = router;
