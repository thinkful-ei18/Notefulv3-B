'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Tag = require('../models/tag');
const Note = require('../models/note');

//GET
router.get('/tags', (req, res, next) => {
  Tag.find()
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

//GET ONE
router.get('/tags/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findById(id)
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

//POST
router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  const newTag = { name };

  //users can be losers
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag.create(newTag)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//PUT
router.put('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  //users can be losers
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateTag = { name };

  Tag.findByIdAndUpdate(id, updateTag, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {      
      if (err.code === 11000) {
        err = new Error('The tag name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//DELETE
router.delete('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  const tagRemovePromise = Tag.findByIdAndRemove(id);

  const noteUpdatePromise = Note.updateMany(
    { 'tags': id, },
    { '$pull': { 'tags': id } }
  );

  Promise.all([tagRemovePromise, noteUpdatePromise])
    .then(([tagResult]) => {
      if (tagResult) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(next);

});

module.exports = router;