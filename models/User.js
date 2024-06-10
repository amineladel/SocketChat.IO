const bcrypt = require('bcryptjs');

class User {
    constructor(username, password, name, email) {
        this.username = username;
        this.name = name;
        this.email = email;
        this.email_verified = false;
        if (password) {
            this.setPassword(password);
        }
    }

    async setPassword(password) {
        const salt = await bcrypt.genSalt(10);
        this.hashed_password = await bcrypt.hash(password, salt);
        this.salt = salt;
    }

    async isValidPassword(password) {
        return bcrypt.compare(password, this.hashed_password);
    }

    static async createUser(username, password, name, email) {
        const user = new User(username, password, name, email);
        if (password) {
            await user.setPassword(password);
        }
        return user;
    }
}

module.exports = User;
