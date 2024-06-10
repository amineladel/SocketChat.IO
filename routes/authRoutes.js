const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Google OAuth2 routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id, username: req.user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.redirect(`/?token=${token}`);
    }
);

router.get('/session', (req, res) => {
    if (req.isAuthenticated()) {
        res.send({ authenticated: true });
    } else {
        res.send({ authenticated: false });
    }
});

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send({ message: 'Error logging out', error: err });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send({ message: 'Error destroying session', error: err });
            }
            res.send({ message: 'Logout successful' });
        });
    });
});

module.exports = router;
