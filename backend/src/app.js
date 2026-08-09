const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/restaurant', require('./routes/restaurant.routes'));
app.use('/api/tables', require('./routes/table.routes'));
app.use('/api/menu', require('./routes/menu.routes'));
app.use('/api/customer', require('./routes/customer.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/waiter', require('./routes/waiter.routes'));
app.use('/api/reports', require('./routes/report.routes'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = app;
