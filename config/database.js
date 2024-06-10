const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

let db;

const connectToDatabase = async () => {
    if (db) return db;

    const client = await MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db(dbName);
    console.log('Connected to Database');
    return db;
};

module.exports = connectToDatabase;
