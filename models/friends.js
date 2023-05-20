const mongoose = require("mongoose")
const Schema = mongoose.Schema
const FriendsSchema = new Schema({
  // user: {
  //   type: Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  // friends list
  list: {
    type: Array,
    default: [],
  },
  // pending list -- user requested friend, awaiting confirmation
  pending: {
    type: Array,
    default: [],
  },
  // request list -- other requested user, awaiting user confirmation
  request: {
    type: Array,
    default: [],
  },
})

module.exports = mongoose.model("Friends", FriendsSchema)