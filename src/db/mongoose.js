const mongoose = require('mongoose');

mongoose.connect(
  process.env.MONGODB_URL,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  },
  (error, connection) => {
    if (error) {
      return console.log('Unable to connect');
    }
  }
);
