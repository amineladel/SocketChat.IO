const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const connectToDatabase = require('../config/database');

const register = async (req, res) => {
    const { username, password, name, email } = req.body;
    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        const user = await User.createUser(username, password, name, email);
        const result = await usersCollection.insertOne(user);
        res.status(201).send({ message: 'User registered successfully', userId: result.insertedId });
    } catch (error) {
        res.status(500).send({ message: 'Error registering user', error });
    }
};

const login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).send({ message: 'Error logging in', error: err });
        }
        if (!user) {
            return res.status(400).send({ message: 'Invalid username or password' });
        }
        req.login(user, (err) => {
            if (err) {
                return res.status(500).send({ message: 'Error logging in', error: err });
            }
            const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.send({ message: 'Login successful', token });
        });
    })(req, res, next);
};

module.exports = { register, login };
