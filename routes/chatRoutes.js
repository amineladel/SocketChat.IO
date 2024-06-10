const express = require('express');
const {
    getAllUsers,
    getConversations,
    getMessagesContaining,
    deleteChatHistory,
    getUserConversationsInRange,
} = require('../controllers/chatController');

const router = express.Router();

router.get('/users', getAllUsers);
router.get('/conversations', getConversations);
router.get('/messages', getMessagesContaining);
router.delete('/history', deleteChatHistory);
router.get('/user-conversations', getUserConversationsInRange);

module.exports = router;
