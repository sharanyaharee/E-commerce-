const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profileImage: {
    type: String,
    default: '/default-profile-image.jpg', 
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number, 
    required: true,
  },
  blocked: {
    type: Boolean,
    default: false, 
  },
  wallet: {
    type: Number,
    default: 0,
},
  createdAt: {
    type: Date,
    default: Date.now,
  },

});

const User = mongoose.model('User', userSchema);

module.exports = User;
