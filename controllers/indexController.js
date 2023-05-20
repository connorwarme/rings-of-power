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

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) {
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
