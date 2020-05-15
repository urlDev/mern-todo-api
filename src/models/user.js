const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('../models/task');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid');
      }
    },
  },
  password: {
    type: String,
    trim: true,
    required: true,
  },
  // we add tokens to db so we can track when they login and logout
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

// "tasks" can be any name
userSchema.virtual('tasks', {
  ref: 'Task',
  // localfield is for user model/db. We save tasks with users _id
  localField: '_id',
  // foreignfield is for task model/db. Users are saved there as owner(can be any name)
  foreignField: 'owner',
});

// we create a method on userSchema to show only email and name to the
// so we dont expose important data here like password
/* 
about toJSON
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON_behavior
*/
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  // we are adding new token value to tokens array and saving it to existing tokens arr
  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  // We provide same error message because we dont want to give more info
  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Unable to login');
  }

  return user;
};

/****** Hash the plain password before saving ******/
// pre is for before saving, mongoose middleware
// save is name of the event, since we will save
// we are calling next to move on, otherwise it would just hang there
userSchema.pre('save', async function (next) {
  // we are saving "this" here as user for understanding it easier
  const user = this;

  // isModified comes from mongoose
  // if its modified, we want to hash it
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// delete tasks when user is removed
userSchema.pre('remove', async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
