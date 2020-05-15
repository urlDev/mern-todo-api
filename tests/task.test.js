const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const {
  userOne,
  userOneId,
  userTwo,
  userTwoId,
  taskOne,
  taskTwo,
  taskThree,
  taskFour,
  setupDatabase,
} = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should create task for user', async () => {
  const response = await request(app)
    .post('/')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Finish the app',
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
});

test('Should get user ones tasks', async () => {
  const response = await request(app)
    .get('/')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response.body.length).toEqual(2);
});

test('Should update task', async () => {
  await request(app)
    .patch(`/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Task One',
    })
    .expect(200);
});

test('Should not update other users task', async () => {
  await request(app)
    .patch(`/${taskTwo._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Task Two',
    })
    .expect(404);
});

test('Should not update invalid fields', async () => {
  await request(app)
    .patch(`/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      title: 'Task One',
    })
    .expect(400);
});

test('Should not delete other users tasks', async () => {
  const response = await request(app)
    .delete(`/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});
