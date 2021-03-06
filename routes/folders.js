'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const User = require('../models/user');
const Folder = require('../models/folder');
const Note = require('../models/note');


router.use(passport.authenticate('jwt', { session: false, failWithError: false }));
//GET ALL
router.get('/folders', (req, res, next) => {
  console.log(req.user);
  const userId = req.user.id;

  Folder.find({ userId })
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

//GET ONE
router.get('/folders/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Folder.findOne({ _id: id, userId })
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
  const userId = req.user.id;

  const newItem = { name, userId };

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
/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/folders/:id', (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
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

  const updateItem = { name, userId };

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

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/folders/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const folderRemovePromise = Folder.findOneAndRemove({ _id: id, userId });

  const noteRemovePromise = Note.updateMany({ folderId: id, userId }, { $unset: { folderId: "" } });

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
