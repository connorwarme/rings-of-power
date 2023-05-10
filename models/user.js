const mongoose = require("mongoose")
const Schema = mongoose.Schema
const UserSchema = new Schema({
  first_name: {
    type: String,
    maxLength: 60,
    required: true,
  },
  family_name: {
    type: String,
    maxLength: 60,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    required: false,
  },
  // not sure what type to put for image...
  // image: {
  //   type: Image,
  //   required: false,
  // },
  friend_list: {
    type: Schema.Types.ObjectId,
    ref: "FriendsList",
    required: true,
  }
})