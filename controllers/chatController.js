const { ObjectId } = require('mongodb');
const Message = require('../models/Message');
const connectToDatabase = require('../config/database');

let connectedUsers = [];

const getAllUsers = async (req, res) => {
    try {
        const db = await connectToDatabase();
        const messagesCollection = db.collection('messages');
        const users = await messagesCollection.distinct('username');
        res.send(users);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching users', error });
    }
};

const getConversations = async (req, res) => {
    const { date, before } = req.query;
    try {
        const db = await connectToDatabase();
        const messagesCollection = db.collection('messages');
        const query = {};
        if (date) {
            query.timestamp = before === 'true' ? { $lt: new Date(date) } : { $gt: new Date(date) };
        }
        const messages = await messagesCollection.find(query).toArray();
        res.send(messages);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching conversations', error });
    }
};

const getMessagesContaining = async (req, res) => {
    const { content } = req.query;
    try {
        const db = await connectToDatabase();
        const messagesCollection = db.collection('messages');
        const messages = await messagesCollection.find({ message: { $regex: content, $options: 'i' } }).toArray();
        res.send(messages);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching messages', error });
    }
};

const deleteChatHistory = async (req, res) => {
    const { userId } = req.query;
    try {
        const db = await connectToDatabase();
        const messagesCollection = db.collection('messages');
        const query = userId ? { userId: ObjectId(userId) } : {};
        await messagesCollection.deleteMany(query);
        res.send({ message: 'Chat history deleted' });
    } catch (error) {
        res.status(500).send({ message: 'Error deleting chat history', error });
    }
};

const getUserConversationsInRange = async (req, res) => {
    const { userId, startDate, endDate } = req.query;
    try {
        const db = await connectToDatabase();
        const messagesCollection = db.collection('messages');
        const query = {
            userId: ObjectId(userId),
            timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
        const messages = await messagesCollection.find(query).toArray();
        res.send(messages);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching user conversations', error });
    }
};

const handleChatConnection = (io) => {
    io.on('connection', async (socket) => {
        if (!socket.user) {
            return;
        }

        console.log(`a user connected: ${socket.user.username}`);
        connectedUsers.push({ id: socket.user.id.toString(), username: socket.user.username });

        const db = await connectToDatabase();
        const messagesCollection = db.collection('messages');
        const usersCollection = db.collection('users');

        const messages = await messagesCollection.find().toArray();
        const users = await usersCollection.find({}, { projection: { _id: 1, username: 1 } }).toArray();
        socket.emit('initialMessages', messages);
        socket.emit('initialUsers', users);

        io.emit('updateConnectedUsers', connectedUsers);

        socket.on('chatMessage', async (msg) => {
            const message = new Message(socket.user.id, socket.user.username, msg);
            await messagesCollection.insertOne(message);
            io.emit('chatMessage', message);
        });

        socket.on('disconnect', () => {
            console.log(`user disconnected: ${socket.user.username}`);
            connectedUsers = connectedUsers.filter(user => user.id !== socket.user.id.toString());
            io.emit('updateConnectedUsers', connectedUsers);
        });
    });
};

module.exports = {
    getAllUsers,
    getConversations,
    getMessagesContaining,
    deleteChatHistory,
    getUserConversationsInRange,
    handleChatConnection,
};
