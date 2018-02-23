'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, index: true },
  content: { type: String, index: true },
  created: { type: Date, default: Date.now },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
});

noteSchema.index({ title: 'text', content: 'text' });

noteSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Note', noteSchema);