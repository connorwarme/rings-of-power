const mongoose = require("mongoose")
const Schema = mongoose.Schema
const FriendsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  list: {
    type: Array,
    default: [],
  },
  pending: {
    type: Array,
    default: [],
  },
})

module.exports = mongoose.model("Friends", FriendsSchema)