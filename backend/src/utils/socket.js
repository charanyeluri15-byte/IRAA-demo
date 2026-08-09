let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
      cors: {
        origin: '*', // Allows frontend to connect during dev
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Staff (Kitchen/Cashier) joins their restaurant's room
      socket.on('joinRestaurantRoom', (restaurantId) => {
        socket.join(restaurantId);
        console.log(`Socket ${socket.id} joined room ${restaurantId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
