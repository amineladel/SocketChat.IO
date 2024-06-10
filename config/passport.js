const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { ObjectId } = require('mongodb'); 
const connectToDatabase = require('./database');
const User = require('../models/User');

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const db = await connectToDatabase();
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({ username });

            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }

            const isValid = await new User().isValidPassword.call(user, password);
            if (!isValid) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
    },
    async (token, tokenSecret, profile, done) => {
        try {
            const db = await connectToDatabase();
            const usersCollection = db.collection('users');
            const email = profile.emails[0].value;
            let user = await usersCollection.findOne({ email });

            if (!user) {
                user = new User(profile.displayName, '', profile.displayName, email);
                await usersCollection.insertOne(user);
            }

            done(null, user);
        } catch (error) {
            done(error, null);
        }
    }));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
