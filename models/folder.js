'use strict';

const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { 
    type: String},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

folderSchema.index({ name: 1, userId: 1}, { unique: true });

folderSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});


module.exports = mongoose.model('Folder', folderSchema);