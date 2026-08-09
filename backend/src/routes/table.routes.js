const express = require('express');
const router = express.Router();
const { 
  getTables, createTable, deleteTable, 
  editTable, toggleStatus, regenerateQr 
} = require('../controllers/table.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('OWNER'));

router.route('/')
  .get(getTables)
  .post(createTable);

router.route('/:id')
  .put(editTable)
  .delete(deleteTable);

router.route('/:id/toggle-status')
  .patch(toggleStatus);

router.route('/:id/regenerate-qr')
  .post(regenerateQr);

module.exports = router;
