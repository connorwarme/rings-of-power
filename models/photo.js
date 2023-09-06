const mongoose = require("mongoose")
const Schema = mongoose.Schema
const PhotoSchema = new Schema({
  photo: {
    type: Buffer,
    required: true,
  },
  photoType: {
    type: String,
    required: true,
  },
})

PhotoSchema.virtual('photoImagePath').get(function() {
  if (this.photo != null && this.photoType != null) {
    return `data:${this.photoType};charset=utf-8;base64,${this.photo.toString('base64')}`
  }
})

module.exports = mongoose.model("Photo", PhotoSchema)