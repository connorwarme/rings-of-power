const mongoose = require("mongoose")
const Schema = mongoose.Schema
const PostSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: Image,
    required: false,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  // Don't think I need these, as each comment/like will ref post it belongs to
  // comments: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Comments",
  //   required: true,
  // },
  // likes: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Likes",
  //   required: true,
  // }
})

PostSchema.virtual("url").get(function() {
  return `/post/${this._id}`
})

module.exports = mongoose.model("Post", PostSchema)