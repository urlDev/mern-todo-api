const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');

const User = require('../models/user');

// signup
router.post('/users/signup', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// login
router.post('/users', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

// logout
router.post('/users/me', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send;
  }
});

// logout all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

// get the logged in user
router.get('/users', auth, async (req, res) => {
  // req.user because we saved user as req.user in auth file
  res.send(req.user);
});

// update
router.patch('/users', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password'];
  const isValid = updates.every((update) => allowedUpdates.includes(update));
  if (!isValid) {
    return res.status(400).send({ Error: 'Invalid updates' });
  }

  try {
    /*********
     We changed this code because middleware in user model
     (userSchema.pre) needs updates to happen dynamically
     so it can work
     ************/

    // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });

    // we no longer need to get the user by id because user can only delete him/her self
    // which means we already have a user which is req.user coming from express middleware:auth.js
    // const user = await User.findById(req.params.id);

    const user = req.user;

    updates.forEach((update) => (user[update] = req.body[update]));

    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send();
  }
});

// delete
router.delete('/users', auth, async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.params.id);
    await req.user.remove();

    res.send(req.user);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
