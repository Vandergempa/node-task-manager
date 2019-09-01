const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

// Supertest lets us make HTTP assertions: 
test('Should signup a new user', async () => {
  // We pass our express application to it.
  const response = await request(app).post('/users').send({
    name: 'Tomi',
    email: 'bogdan.tamascsaba@gmail.com',
    password: 'MyPass777!'
  }).expect(201)

  // Assert that the database was changed correctly:
  const user = await User.findById(response.body.user._id)
  expect(user).not.toBeNull()

  // Assertions about the response:
  expect(response.body).toMatchObject({
    user: {
      name: 'Tomi',
      email: 'bogdan.tamascsaba@gmail.com',
    },
    token: user.tokens[0].token
  })
  // Assert that the password is stored hashed.
  expect(user.password).not.toBe('MyPass777!')
})

test('Should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200)

  // Assert that the new token is changed correctly:
  const user = await User.findById(response.body.user._id)
  expect(response.body).toMatchObject({
    token: user.tokens[1].token
  })
})

test('Should not login non-existing user', async () => {
  await request(app).post('/users/login').send({
    email: 'tomika123@gmail.com',
    password: 'valamilyenrandomjelszo'
  }).expect(400)
})

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

  // Assert that the deleted user is null:
  const user = await User.findById(userOneId)
  expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

// Supertest is used to make http assertions with image sending
test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/philly.jpg')
    .expect(200)
  // Check if the binary data has been saved. Here toEqual has to be used instead of toBe,
  // as toEqual checks the property of the objects and compare those instead.
  const user = await User.findById(userOneId)
  expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'Updatedname'
    }).expect(200)

  // Check if the data is changed.
  const user = await User.findById(userOneId)
  expect(user.name).toEqual('Updatedname')
})

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: 'Fakelocation'
    }).expect(400)
})