const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);
chai.use(chaiSpies);

let id;
let token;
const _id = '333333333333333333333300';
const username = 'testUser';
const password = 'testPassword';
const fullname = 'Example User';
const User = require('../models/user');
const seedUsers = require('../db/seed/users');

describe('Noteful API - Endpoint', function() {
	before(function() {
		return mongoose
			.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(function() {
		return User.insertMany(seedUsers)
			.then(() => User.createIndexes())
			.then(() => User.findById('333333333333333333333300'))
			.then(userResponse => {
				token = jwt.sign(
					{
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
});

afterEach(function() {
	return mongoose.connection.db.dropDatabase().catch(err => console.error(err));
});

after(function() {
	return mongoose.disconnect();
});

describe('/protected', function() {
	it('Should reject requests with no credentials', function() {
		return chai
			.request(app)
			.get('/v3/login')
			.set('Authorization', `Bearer ${token}`)

			.then(() => expect.fail(null, null, 'Request should not succeed'))
			.catch(err => {
				if (err instanceof chai.AssertionError) {
					throw err;
				}

				const res = err.response;
				expect(res).to.have.status(401);
			});
	});

	it('Should reject requests with an invalid token', function() {
		const token = jwt.sign(
			{
				username,
				firstName
			},
			'wrongSecret',
			{
				algorithm: 'HS256',
				expiresIn: '7d'
			}
		);

		return chai
			.request(app)
			.get('/v3/login')
			.set('Authorization', `Bearer ${token}`)
			.then(() => expect.fail(null, null, 'Request should not succeed'))
			.catch(err => {
				if (err instanceof chai.AssertionError) {
					throw err;
				}

				const res = err.response;
				expect(res).to.have.status(401);
			});
	});
	it('Should reject requests with an expired token', function() {
		const token = jwt.sign(
			{
				user: {
					username,
					firstName
				},
				exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
			},
			JWT_SECRET,
			{
				algorithm: 'HS256',
				subject: username
			}
		);

		return chai
			.request(app)
			.get('/v3/login')
			.set('authorization', `Bearer ${token}`)
			.then(() => expect.fail(null, null, 'Request should not succeed'))
			.catch(err => {
				if (err instanceof chai.AssertionError) {
					throw err;
				}

				const res = err.response;
				expect(res).to.have.status(401);
			});
	});
	it('Should send protected data', function() {
		const token = jwt.sign(
			{
				user: {
					username,
					firstName
				}
			},
			JWT_SECRET,
			{
				algorithm: 'HS256',
				subject: username,
				expiresIn: '7d'
			}
		);

		return chai
			.request(app)
			.get('/v3/login')
			.set('authorization', `Bearer ${token}`)
			.then(res => {
				expect(res).to.have.status(200);
				expect(res.body).to.be.an('object');
				expect(res.body.data).to.equal('rosebud');
			});
	});
});
