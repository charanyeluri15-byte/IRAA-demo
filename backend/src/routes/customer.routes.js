const express = require('express');
const router = express.Router();
const { getMenu, checkTable, placeOrder, getOrderStatus, callWaiter } = require('../controllers/customer.controller');

router.get('/menu/:restaurantId', getMenu);
router.get('/table/:restaurantId/:tableNumber', checkTable);
router.post('/order', placeOrder);
router.get('/order/:orderId', getOrderStatus);
router.post('/call-waiter/:restaurantId/:tableNumber', callWaiter);

module.exports = router;
