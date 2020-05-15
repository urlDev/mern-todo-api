const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/task');

router.post('/', auth, async (req, res) => {
  // we were first saving tasks from the req.body
  // const task = new Task(req.body);

  // Now; we first changed task model to have an owner and owner has to have an _id(mongodb id, in database)
  // that _id comes from express middleware(auth.js), from req.user
  // So in here we first save everything in the req.body with spread operator
  // then assigning owner as req.user
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    // const tasks = await Task.find({});

    // "tasks" comes from user model virtual.
    // populate and execPopulate are mongoose functions
    // populate(), which lets you reference documents in other collections.
    // execPopulate: Explicitly executes population and returns a promise.
    await req.user.populate('tasks').execPopulate();
    res.send(req.user.tasks);
    // res.send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    // const task = await Task.findById(_id);

    // we are getting the task whose owner is auth user(req.user)
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description'];
  const isValid = updates.every((update) => allowedUpdates.includes(update));
  if (!isValid) {
    return res.status(400).send({ Error: 'Invalid update' });
  }

  try {
    // const task = await Task.findById(req.params.id);

    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    // const task = await Task.findByIdAndDelete(req.params.id);
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send({ Error: 'Task not found' });
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
