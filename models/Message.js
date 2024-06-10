class Message {
    constructor(userId, username, message) {
        this.userId = userId;
        this.username = username;
        this.message = message;
        this.timestamp = new Date();
    }
}

module.exports = Message;
