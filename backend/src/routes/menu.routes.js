const express = require('express');
const router = express.Router();
const { 
  getCategories, createCategory, deleteCategory,
  getMenuItems, createMenuItem, editMenuItem, deleteMenuItem, toggleAvailability 
} = require('../controllers/menu.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
// We will apply authorize selectively for Menu routes

// Categories
router.route('/categories')
  .get(authorize('OWNER', 'WAITER', 'CASHIER', 'KITCHEN'), getCategories)
  .post(authorize('OWNER'), createCategory);

router.route('/categories/:id')
  .delete(authorize('OWNER'), deleteCategory);

// Menu Items
router.route('/items')
  .get(authorize('OWNER', 'WAITER', 'CASHIER', 'KITCHEN'), getMenuItems)
  .post(authorize('OWNER'), createMenuItem);

router.route('/items/:id')
  .put(authorize('OWNER'), editMenuItem)
  .delete(authorize('OWNER'), deleteMenuItem);

router.route('/items/:id/toggle')
  .patch(authorize('OWNER'), toggleAvailability);

module.exports = router;
