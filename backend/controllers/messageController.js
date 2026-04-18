const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's conversations
// @route   GET /api/messages/conversations/list
exports.getConversations = async (req, res) => {
  try {
    // Find all unique conversations for this user
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$text' },
          lastMessageTime: { $first: '$createdAt' },
          sender: { $first: '$sender' },
          receiver: { $first: '$receiver' },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    // Populate user details
    const conversations = await Promise.all(
      messages.map(async (conv) => {
        const otherUserId =
          conv.sender.toString() === req.user.id ? conv.receiver : conv.sender;
        const otherUser = await User.findById(otherUserId).select('name avatar');

        // Count unread
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiver: req.user._id,
          read: false,
        });

        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount,
        };
      })
    );

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a message (REST fallback)
// @route   POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    const conversationId = Message.getConversationId(req.user.id, receiverId);

    const message = await Message.create({
      conversationId,
      sender: req.user.id,
      receiver: receiverId,
      text,
    });

    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
