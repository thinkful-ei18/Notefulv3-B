'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Tag = require('../models/tag');
const Note = require('../models/note');

//GET
router.get('/tags', (req, res, next) => {
  const userId = req.user.id;
  Tag.find({userId})
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

//GET ONE
router.get('/tags/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findById( {_id: id, userId} )
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
  const userId = req.user.id;
  const newTag = { name, userId };

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
  const userId = req.user.id;
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
  const tagRemovePromise = Tag.findByIdAndRemove({ _id: id, userId });
  const userId = req.user.id;

  const noteUpdatePromise = Note.updateMany(
    { 'tags': id, userId  },
    { '$pull': { 'tags': id, userId } }
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


//Folders & Tags & Users (Didn't Get To Tags in the ***BONUS***)
validateFolderId = (folderIdB, userIdB) => {
  if(!folderIdB) {
    return Promise.resolve('match');
  }
return Folder.find({_id: folderIdB, userIdA: userIdB })
.then(result => {
  if (!result.length) {
    return Promise.reject('no match');
  }
})
}

module.exports = router;