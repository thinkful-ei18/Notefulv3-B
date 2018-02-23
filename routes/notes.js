'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Note = require('../models/note');

//GET ALL
router.get('/notes', (req, res, next) => {

  console.log("A");
  const { searchTerm, folderId, tagId } = req.query;

  const userId = req.user.id;
  let filter = { userId };
  let projection = {};
  let sort = 'created';

  //Search Filter 
  if (searchTerm) {
    filter.$text = { $search: searchTerm };
    projection.score = { $meta: 'textScore' };
    sort = projection;
  }
  // Folder filter
  if (folderId) {
    filter.folderId = folderId;
  }

  // Tag filter
  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter, projection)
    .select('title content created folderId tags')
    .populate('tags')
    .sort(sort)
    .then(results => {
      res.json(results);
      console.log("B");

    })
    .catch(next);
});

//GET ONE
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({ _id: id, userId })
    .select('title content created folderId tags')
    .populate('tags')
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
router.post('/notes', (req, res, next) => {
  console.log("C");

  const { title, content, folderId, tags } = req.body; //string
  const userId = req.user.id; //string
  //users can be losers
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }



  const newItem = { title, content, tags, userId };

  Note.create(newItem)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(next);
});

//PUT
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  //users can be losers
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateItem = { title, content, tags, userId };

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    updateItem.folderId = folderId;
  }

  const options = { new: true };

  Note.findOneAndUpdate(id, updateItem, options)
    .select('id title content folderId tags')
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

//DELETE
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id

  Note.findOneAndRemove({ _id: id, userId })
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(next);
});

module.exports = router;