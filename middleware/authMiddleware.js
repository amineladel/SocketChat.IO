const jwt = require('jsonwebtoken');

const authMiddleware = (socket, next) => {
    if (socket.handshake.auth && socket.handshake.auth.token) {
        jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new Error('Authentication error'));
            }
            socket.user = decoded;
            next();
        });
    } else {
        next(new Error('Authentication error'));
    }
};

module.exports = authMiddleware;
