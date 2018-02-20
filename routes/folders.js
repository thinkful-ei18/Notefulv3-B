'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Folder = require('../models/folder');
const Note = require('../models/note');

//GET ALL
router.get('/folders', (req, res, next) => {
  Folder.find()
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

//GET ONE
router.get('/folders/:id', (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findById(id)
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
router.post('/folders', (req, res, next) => {
  const { name } = req.body;

  const newItem = { name };

  //users can be losers
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Folder.create(newItem)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//PUT
router.put('/folders/:id', (req, res, next) => {
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

  const updateItem = { name };

  Folder.findByIdAndUpdate(id, updateItem, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//DELETE
router.delete('/folders/:id', (req, res, next) => {
  const { id } = req.params;

  const folderRemovePromise = Folder.findByIdAndRemove(id); 

  const noteRemovePromise = Note.updateMany(
    { 'tags': id, },
    { '$pull': { 'tags': id } }
  );

  Promise.all([folderRemovePromise, noteRemovePromise])
    .then(resultsArray => {
      const folderResult = resultsArray[0];

      if (folderResult) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(next);
});

module.exports = router;
