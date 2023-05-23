require("dotenv").config()
const asyncHandler = require("express-async-handler")
const { body, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const passport = require("passport")
const jwt = require("jsonwebtoken")
const User = require("../models/user")
const Friends = require("../models/friends")

exports.login_get = asyncHandler(async (req, res, next) => {
  res.render("login", { title: "Login" })
})
exports.login_post = (req, res, next) => {
  passport.authenticate("local", { session: false}, (err, user, info) => {
    if (err) {
      return res.render("error", { error: err })
    }
    if (user === false) {
      const error = new Error("User not found!")
      error.status = 401
      return res.render("error", { error: error })
    } else {
      const token = jwt.sign({ user }, process.env.JWT_KEY)
      return res.json({ user, token })
    }
  })(req, res, next)
}

exports.signup_get = asyncHandler(async (req, res, next) => {
  res.render("signup", { title: "Signup" })
})
exports.signup_post = [
  body("first_name", "Please add your first name.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("family_name", "Please add your family name.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("email", "Please add your email address.")
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .withMessage("Must be a valid email address!")
    .escape(),
  body("password", "Password required, must be at least 6 characters.")
    .trim()
    .isLength({ min: 6 })
    .escape(),
  body("confirm_password", "Passwords did not match.")
    .trim()
    .custom((value, { req }) => {
      return value === req.body.password
    })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req)
    const salt = 12
    bcrypt.hash(req.body.password, salt, async(err, hashedPassword) => {
      if (err) {
        return next(err)
      }
      const friendlist = new Friends({
        list: [],
        pending: [],
        request: [],
      })
      const user = new User({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        email: req.body.email,
        hash: hashedPassword,
        friend_list: friendlist._id,
      })
      if (!errors.isEmpty()) {
        res.render("signup", {
          title: "Sign Up",
          user,
          errors: errors.array(),
        })
        return
      } else {
        const emailExists = await User.findOne({ email: req.body.email }).exec()
        if (emailExists) {
          const error = new Error("Email address already associated with an account!")
          error.status = 404 
          console.log(error.message)
          res.render("signup", {
            title: "Sign Up",
            user,
            error: error,
          })
        } else {
          await friendlist.save()
          await user.save()
          res.json({
            title: "User Profile",
            user,
          })
        }
      }
    })
  })
]

exports.profile_get = (req, res, next) => {
  return res.json({ user: req.user.user })
}

exports.friends_get = asyncHandler(async(req, res, next) => {
  const friends = await Friends.findById(req.user.user.friend_list).exec()
  console.log(friends)
  return res.json({ user: req.user.user, friends_list: friends.list, friends_pending: friends.pending, friends_request: friends.request })
})

// these next 3 functions could be refactored...a lot of repeated code
exports.friends_send_request_post = asyncHandler(async(req, res, next) => {
  // get user's friend list
  console.log(req.user.user)
  const user_list = await Friends.findById(req.user.user.friend_list)
  // create new friend list, but use same _id
  const user_newlist = new Friends({
    list: user_list.list,
    pending: user_list.pending,
    request: user_list.request,
    _id: user_list._id,
  })
  // get other user
  const other_user = await User.findById(req.body.userid)
  console.log(other_user)
  // get other user's friend list
  const other_list = await Friends.findById(other_user.friend_list)
  // create new friend list, but use same _id
  const other_newlist = new Friends({
    list: other_list.list,
    pending: other_list.pending,
    request: other_list.request,
    _id: other_list._id,
  })
  // add "friend" to user friend list: pending
  user_newlist.pending.push(other_user._id)
  // add "user" to other's friend list: request
  other_newlist.request.push(req.user.user._id)

  // update both lists on database
  // !!! is this the proper way to do this?!
  const friend_list = await Friends.findByIdAndUpdate(req.user.user.friend_list, user_newlist, { new: true })
  const other_friend_list = await Friends.findByIdAndUpdate(other_user.friend_list, other_newlist, { new: true })
 
  res.json({ user: req.user.user, friend_list, other_friend_list })
})
exports.friends_accept_request_post = asyncHandler(async(req, res, next) => {
  // get user's friend list
  const user_list = await Friends.findById(req.user.user.friend_list)
  const user_newlist = new Friends({
    list: user_list.list,
    pending: user_list.pending,
    request: user_list.request,
    _id: user_list._id,
  })
  // get other user's friend list
  const other_user = await User.findById(req.body.userid)
  const other_list = await Friends.findById(other_user.friend_list)
  const other_newlist = new Friends({
    list: other_list.list,
    pending: other_list.pending,
    request: other_list.request,
    _id: other_list._id,
  })

  // add friend to user list, remove from request list
  user_newlist.list.push(other_user._id.toString())
  user_newlist.request = user_list.request.filter(id => id != other_user._id.toString())
  // add friend to other list, remove from pending list
  other_newlist.list.push(req.user.user._id)
  other_newlist.pending = other_list.pending.filter(id => id != req.user.user._id)
  // update both lists on the database
  const [userList, otherList] = await Promise.all([
    Friends.findByIdAndUpdate(req.user.user.friend_list, user_newlist, { new: true }),
    Friends.findByIdAndUpdate(other_user.friend_list, other_newlist, { new: true }),
  ])

  // not complete, needs to be thoroughly checked. 

  res.json({ user: req.user.user, userList, otherList })
})

exports.friends_deny_request_post = asyncHandler(async(req, res, next) => {
    // get user's friend list
    const user_list = await Friends.findById(req.user.user.friend_list)
    const user_newlist = new Friends({
      list: user_list.list,
      pending: user_list.pending,
      request: user_list.request,
      _id: user_list._id,
    })
    // get other user's friend list
    const other_user = await User.findById(req.body.userid)
    const other_list = await Friends.findById(other_user.friend_list)
    const other_newlist = new Friends({
      list: other_list.list,
      pending: other_list.pending,
      request: other_list.request,
      _id: other_list._id,
    })
  
    // remove id from user's request list
    user_newlist.request = user_list.request.filter(id => id != other_user._id.toString())
    // remove id from other's pending list
    other_newlist.pending = other_list.pending.filter(id => id != req.user.user._id)
    // update both lists on the database
    const [userList, otherList] = await Promise.all([
      Friends.findByIdAndUpdate(req.user.user.friend_list, user_newlist, { new: true }),
      Friends.findByIdAndUpdate(other_user.friend_list, other_newlist, { new: true }),
    ]) 
  
    res.json({ user: req.user.user, userList, otherList })
})

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) {
    // !!! need user to sign in to access page content
    const error = new Error("No token found.")
    error.status = 401
    return res.render("error", { error: error })
  }
  jwt.verify(token, process.env.JWT_KEY, (err, user) => {
    if (err) {
      const error = new Error("You don't have proper clearance :/")
      error.status = 402
      return res.render("error", { error: error })
    }
    req.user = user
    req.token = token
    next()
  })
}
exports.verifyNoToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token != null) {
    res.json({ message: "You are already a user!"})
  }
  next()
}
