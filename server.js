const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport'); 
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { handleChatConnection } = require('./controllers/chatController');
const authMiddleware = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false 
}));

app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/chat', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'views/index.html'));
    } else {
        res.redirect('/');
    }
});

// Socket.io middleware
io.use(authMiddleware);

// Socket.io connection
handleChatConnection(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
