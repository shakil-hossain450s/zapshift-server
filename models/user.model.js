const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    required: true
  },
  photo: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'rider', 'admin'],
    default: 'user'
  },
  provider: {
    type: String,
    enum: ['password', 'google'],
    default: 'password',
  },
  lastLogIn: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
