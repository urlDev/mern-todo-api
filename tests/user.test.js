const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setupDatabase } = require('./fixtures/db');

// before each test case, users will be deleted
// so that tests wont fail
beforeEach(setupDatabase);

test('Should signup a new user', async () => {
  const response = await request(app)
    .post('/users/signup')
    .send({
      name: 'John',
      email: 'john@test.com',
      password: 'abc123',
    })
    .expect(201);

  // assert that db was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    //   user and token here comes from user router, res.send
    user: {
      name: 'John',
    },
    token: user.tokens[0].token,
  });

  expect(user.password).not.toBe('abc123');
});

test('Should signin existing user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  const lastToken = user.tokens.pop();
  expect(response.body.token).toBe(lastToken.token);
});

test('Should not sign in non-existing user', async () => {
  await request(app)
    .post('/users')
    .send({
      email: 'mikey@example.com',
      password: 'secretabc',
    })
    .expect(400);
});

test('Should get profile for user', async () => {
  await request(app)
    .get('/users')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
  await request(app).get('/users').send().expect(401);
});

test('Should delete account for user', async () => {
  await request(app)
    .delete('/users')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // finding the user with id
  // user should be null
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should not delete user for unauthenticated user', async () => {
  await request(app).delete('/users').send().expect(401);
});

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'Johnny',
    })
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.name).toEqual('Johnny');
});

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: 'Earth',
    })
    .expect(400);
});
