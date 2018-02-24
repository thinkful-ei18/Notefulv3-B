const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

let id;
let token;
const _id = '333333333333333333333300';
const username = 'testUser';
const password = 'testPassword';
const fullname = 'Example User';
const User = require('../models/user');
const seedUsers = require('../db/seed/users');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiSpies);

describe('Noteful API - Users', function() {

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
  beforeEach(function () {

  return User.insertMany(seedUsers)
    .then(() => User.createIndexes())
    .then(() => User.findById('333333333333333333333300'))
    .then(userResponse => {
      token = jwt.sign( {
        user: {
          username: userResponse.username,
          id: userResponse.id
        }
      },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: userResponse.username,
        expiresIn: '7d'
      }
    );
      
    });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase()
      .catch(err => console.error(err));
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /v3/users', function() {
    describe('POST', function() {
      it('Should reject users with missing username', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            password,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('Missing username or password in request body');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('username');
          });
      });
      it('Should reject users with missing password', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('Missing username or password in request body');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with non-string username', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            password,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Incorrect field type: expected string'
            );
            expect(res.body.location).to.equal('username');
          });
      });
      it('Should reject users with non-string password', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Incorrect field type: expected string'
            );
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with non-string first name', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            password,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Incorrect field type: expected string'
            );
            expect(res.body.location).to.equal('fullname');
          });
      });
     
      it('Should reject users with non-trimmed username', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username: ` ${username} `,
            password,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Cannot start or end with whitespace'
            );
            expect(res.body.location).to.equal('username');
          });
      });
      it('Should reject users with non-trimmed password', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            password: ` ${password} `,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Cannot start or end with whitespace'
            );
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with empty username', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username: '',
            password,
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Must be at least 1 characters long'
            );
            expect(res.body.location).to.equal('username');
          });
      });
      it('Should reject users with password less than eight characters', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            password: '1234567',
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Must be at least 10 characters long'
            );
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with password greater than 72 characters', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            password: new Array(73).fill('a').join(''),
          })
          .then(() =>
            expect.fail(null, null, 'Request should not succeed')
          )
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }
            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal(
              'Must be at most 72 characters long'
            );
            expect(res.body.location).to.equal('password');
          });
      });
      // it('Should reject users with duplicate username', function() {
      //   // Create an initial user
      //   return User.create({
      //     username,
      //     password,
      //     fullname,
      //   })
      //     .then(() =>
      //       // Try to create a second user with the same username
      //       chai.request(app).post('/v3/users').send({
      //         username,
      //         password,
      //         fullname,
      //       })
      //     )
      //     .then(() =>
      //       expect.fail(null, null, 'Request should not succeed')
      //     )
      //     .catch(err => {
      //       if (err instanceof chai.AssertionError) {
      //         throw err;
      //       }
      //       const res = err.response;
      //       expect(res).to.have.status(422);
      //       expect(res.body.reason).to.equal('ValidationError');
      //       expect(res.body.message).to.equal(
      //         'Username already taken'
      //       );
      //       expect(res.body.location).to.equal('username');
      //     });
      // });
      it('Should create a new user', function() {
        return chai
          .request(app)
          .post('/v3/users')
          .send({
            username,
            password,
            fullname,
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys(
              'username',
            );
            expect(res.body.username).to.equal(username);
            expect(res.body.fullname).to.equal(fullname);
            return User.findOne({
              username
            });
          })
          .then(user => {
            expect(user).to.not.be.null;
            expect(user.fullname).to.equal(fullname);
            return user.validatePassword(password);
          })
          .then(passwordIsCorrect => {
            expect(passwordIsCorrect).to.be.true;
          });
      });
      // it('Should trim fullname', function() {
      //   return chai
      //     .request(app)
      //     .post('/v3/users')
      //     .send({
      //       username,
      //       password,
      //       fullname: ` ${fullname} `,
      //     })
      //     .then(res => {
      //       expect(res).to.have.status(201);
      //       expect(res.body).to.be.an('object');
      //       expect(res.body).to.have.keys(
      //         'username',
      //         'fullname',
      //       );
      //       expect(res.body.username).to.equal(username);
      //       expect(res.body.fullname).to.equal(fullname);
      //       return User.findOne({
      //         username
      //       });
      //     })
      //     .then(user => {
      //       expect(user).to.not.be.null;
      //       expect(user.fullname).to.equal(fullname);
      //     });
      // });
    });
  });
});
