const mongoose = require('mongoose');

const Task = mongoose.model('Task', {
  description: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // with ref, we are creating a connection between task db and user db
    ref: 'User',
  },
});

module.exports = Task;
