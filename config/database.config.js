require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6cfx5an.mongodb.net/zapshiftDB`;

const connectDB = async()=> {
  try{
    await mongoose.connect(MONGO_URI);
    console.log(`DB is connected successfully!`);
  } catch(err){
    console.log(`Error connecting to DB: ${err}`);
    process.exit(1);
  }
}

module.exports = connectDB;