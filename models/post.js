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
    type: String,
    required: false,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // category: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Category",
  //   required: true,
  // },
  date: {
    type: Date,
    default: Date.now(),
  },
  // Don't know. Include comments and likes in post schema?
  // or have each comment/like ref post it belongs to?
  comments: [
    {
      author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now(),
      }
    }
  ],
  likes: [
    {
      author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      }
    }
  ]
})

PostSchema.virtual("url").get(function() {
  return `/post/${this._id}`
})

module.exports = mongoose.model("Post", PostSchema)