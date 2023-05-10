const mongoose = require("mongoose")
const Schema = mongoose.Schema
const Category = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
})

CategorySchema.virtual("url").get(function() {
  return `/category/${this._id}`
})

module.exports = mongoose.model("Category", CategorySchema)