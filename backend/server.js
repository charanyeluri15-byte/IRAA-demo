const app = require('./src/app');
const http = require('http');
const connectDB = require('./src/config/db');
const socketUtil = require('./src/utils/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
socketUtil.init(server);

// Connect to Database
connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
