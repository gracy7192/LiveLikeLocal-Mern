const Message = require('../models/Message');

const setupSocket = (io) => {
  // Track online users: { userId: socketId }
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
      console.log(`User ${userId} joined`);
    });

    // Join a conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    // Send message
    socket.on('sendMessage', async (data) => {
      try {
        const { senderId, receiverId, text } = data;
        const conversationId = Message.getConversationId(senderId, receiverId);

        // Save to database
        const message = await Message.create({
          conversationId,
          sender: senderId,
          receiver: receiverId,
          text,
        });

        await message.populate('sender', 'name avatar');
        await message.populate('receiver', 'name avatar');

        // Emit to the conversation room
        io.to(conversationId).emit('receiveMessage', message);

        // Also emit directly to receiver if they're online but not in the room
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessageNotification', {
            conversationId,
            message,
          });
        }
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      socket.to(data.conversationId).emit('typing', data);
    });

    socket.on('stopTyping', (data) => {
      socket.to(data.conversationId).emit('stopTyping', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      // Remove from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
      console.log('Socket disconnected:', socket.id);
    });
  });
};

module.exports = setupSocket;
