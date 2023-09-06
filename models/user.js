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
    required: false,
  },
  bio: {
    type: String,
    required: false,
  },
  loginid: {
    type: Object,
    default: {
      hash: {
        type: String,
        default: null,
      },
      googleid: {
        type: String,
        default: null,
      },
      fbid: {
        type: String,
        default: null,
      },
    }
  },
  picture: {
    type: String,
    required: false,
  },
  photo: {
    type: Schema.Types.ObjectId,
    ref: "Photo",
    required: false,
  },
  friend_list: {
    type: Schema.Types.ObjectId,
    ref: "Friends",
    required: true,
  }
})

UserSchema.virtual("name").get(function() {
  let fullname = ''
  if (this.first_name && this.family_name) {
    fullname = `${this.first_name} ${this.family_name}`
  }
  // does this need the opposite? (ref other node projects)
  return fullname;
})

UserSchema.virtual("url").get(function() {
  return `/user/${this._id}`
})

UserSchema.set('toJSON', { virtuals: true })
module.exports = mongoose.model("User", UserSchema)