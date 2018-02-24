'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders');


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

describe('Noteful API - Folders', function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Folder.insertMany(seedFolders)
    .then(() => Folder.createIndexes())
    .then(() => User.insertMany(seedUsers))
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
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /v3/folders', function () {

    it('should return the correct number of folders', function () {
      const apiPromise = chai.request(app).get('/v3/folders')
      .set('Authorization', `Bearer ${token}`);
      
      const dbPromise = Folder.find();

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list with the correct right fields', function () {
      const apiPromise = chai.request(app).get('/v3/folders')
        .set('Authorization', `Bearer ${token}`);
        

      console.log('A')
      const dbPromise = Folder.find();
       
        console.log('B')

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          console.log('C')
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.have.keys('id', 'userId', 'name');
          });
        });
    });

  });



    describe('GET /v3/folders/:id', function () {

      it('should return correct folders by id', function () {
        let data;
        return Folder.findOne().select('id name')
          .then(_data => {
            data = _data;
            return chai
              .request(app)
              .get(`/v3/Folders/${data.id}`)
              .set('Authorization', `Bearer ${token}`);
          })
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
  
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'name', 'userId');
  
            expect(res.body.id).to.equal(data.id);
            expect(res.body.name).to.equal(data.name);
          });
      });
  
      it('should return a message and error status 400 if id does not match mongoId', function () {
        return chai
          .request(app)
          .get('/v3/folders/333333333333333333333300')
          .set('Authorization', `Bearer ${token}`)
          .catch(err => {
            const res = err.response; 
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('333333333333333333333300 is not a valid ID');
          });
      });
  
      it('should return a 404 error is id is not valid', function () {
        return chai
          .request(app)
          .get('/v3/folders/333333333333333333333300')
          .set('Authorization', `Bearer ${token}`)
          .catch(err => {
            const res = err.response;
            expect(res).to.have.status(404);
            expect(res.body.message).to.equal('333333333333333333333300 is not a valid ID');
          });
      });
    });
  
    describe('POST /v3/folders', function () {
      it('should create and return a new folder when provided with valid data', function () {
        const newItem = {
          'name': 'The best article about cats ever!',
        };
        let body;

        return chai.request(app)
          .post('/v3/folders')
          .send(newItem)
          .set('Authorization', `Bearer ${token}`)
          .then(function (res) {
            body = res.body;
            expect(res).to.have.status(201);
            expect(res).to.have.header('location');
            expect(res).to.be.json;
            expect(body).to.be.a('object');
            expect(body).to.include.keys('id', 'name');
          
            return Folder.findById(body.id);
          })

          .then(data => {
            expect(body.title).to.equal(data.title);
            expect(body.content).to.equal(data.content);
          });
      });
  
      it('should return an error when missing "name" field', function () {
        const newItem = {
          'named': 'bar'
        };
        const spy = chai.spy();
        return chai.request(app)
          .post('/v3/folders')
          .send(newItem)
          .set('Authorization', `Bearer ${token}`)
          .then(spy)
          .then(() => {
            expect(spy).to.not.have.been.called();
          })
          .catch((err) => {
            const res = err.response;
            expect(res).to.have.status(400);
            expect(res.body).to.be.a('object');
            expect(res.body.message).to.equal('Missing `name` in request body');
          });
      });
  
      it('should return an error when "name" field is not unique', function () {
        const newItem = {
          'name': 'Tests'
        };
        const spy = chai.spy();
        return chai.request(app)
          .post('/v3/folders')
          .send(newItem)
          .set('Authorization', `Bearer ${token}`)
          .then(spy)
          .then(() => {
            expect(spy).to.not.have.been.called();
          })
          .catch((err) => {
            const res = err.response;
            expect(res).to.have.status(400);
            expect(res.body).to.be.a('object');
            expect(res.body.message).to.equal('The folder name already exists');
          });
      });
  
    });
  
    describe('PUT /v3/Folders/:id', function () {
      it('should update the folder name', function () {
        let body;
        const updateItem = {
          'id': '333333333333333333333300',
          'name': 'test'
        };
        return chai.request(app)
          .put('/v3/Folders/333333333333333333333300')
          .send(updateItem)
          .set('Authorization', `Bearer ${token}`)
          .then(function (res) {
            body = res.body;
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.include.keys('id', 'name');
            return Folder.findById(body.id);
          })
          .then(data => {
            expect(body.title).to.equal(data.title);
            expect(body.content).to.equal(data.content);
            expect(body.id).to.equal(data.id);
          });
      });
  
      it('should return an error when not provided with a matching id', function () {
        const updateItem = {
          'id': '333333333333333333333300',
          'name': 'testName'
        };
        const id = '13333333333333333333333001';
        return chai.request(app)
          .put(`/v3/Folders/${id}`)
          .send(updateItem)
          .set('Authorization', `Bearer ${token}`)
          .catch(function (err) {
            const res = err.response;
            expect(res).to.have.status(400);
            expect(res.body).to.be.a('object');
            expect(res.body.message).to.equal('13333333333333333333333001 is not a valid ID');
          });
      });
  
      it('should return an error when ids are not matching', function () {
        const updateItem = {
          'id': '111111111111111111111102',
          'name': 'Something'
        };
        const id = '1333333333333333333333300';
        return chai.request(app)
          .put(`/v3/Folders/${id}`)
          .send(updateItem)
          .set('Authorization', `Bearer ${token}`)
          .catch(function (err) {
            const res = err.response;
            expect(res).to.have.status(400);
            expect(res.body).to.be.a('object');
            expect(res.body.message).to.equal('Params id and body id must match');
          });
      });
  
      it('should return an error when name is missing', function () {
        const updateItem = {
          'id': '1333333333333333333333300',
        };
        const id = '1333333333333333333333300';
        return chai.request(app)
          .put(`/v3/Folders/${id}`)
          .send(updateItem)
          .set('Authorization', `Bearer ${token}`)
          .catch(function (err) {
            const res = err.response;
            expect(res).to.have.status(400);
            expect(res.body).to.be.a('object');
            expect(res.body.message).to.equal('Name must be present in body');
          });
      });
  
      it('should return an error when name is missing', function () {
        const updateItem = {
          'id': '1333333333333333333333300',
          'name': 'Archive'
        };
        const id = '1333333333333333333333300';
        return chai.request(app)
          .put(`/v3/Folders/${id}`)
          .send(updateItem)
          .set('Authorization', `Bearer ${token}`)
          .catch(function (err) {
            const res = err.response;
            expect(res).to.have.status(400);
            expect(res.body).to.be.a('object');
            expect(res.body.message).to.equal('The folder name already exists');
          });
      });
  
    });
   
    describe('DELETE /v3/Folders', function () {
      it('should permanently delete an item', function () {
        return chai.request(app)
          .delete('/v3/Folders/1333333333333333333333300')
          .set('Authorization', `Bearer ${token}`)
          .then(function (res) {
            expect(res).to.have.status(204);
            return Folder.findById('1333333333333333333333300');
          })
          .then(data => {
            expect(data).to.be.null;
          });
      });
    });
  
  });
  
  
  
  
  