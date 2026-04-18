const express = require('express');
const router = express.Router();
const { getMessages, getConversations, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/conversations/list', protect, getConversations);
router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;
