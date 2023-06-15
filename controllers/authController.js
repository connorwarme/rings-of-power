require("dotenv").config()
const asyncHandler = require("express-async-handler")
const { body, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const passport = require("passport")
const jwt = require("jsonwebtoken")
const User = require("../models/user")

exports.login = asyncHandler(async (req, res, next) => {
  res.status(200).json({ title: "Login on auth!" })
})

exports.login_fb_get = (req, res, next) => {
  passport.authenticate('facebook')(req, res, next)

  // this is the local authentication that I have working... 
  // passport.authenticate("local", { session: false}, (err, user, info) => {
  //   if (err) {
  //     return res.json({ errors: err })
  //   }
  //   if (user === false) {
  //     const error = new Error("User not found!")
  //     error.status = 404
  //     return res.json({ errors: error })
  //   } else {
  //     const token = jwt.sign({ user }, process.env.JWT_KEY)
  //     return res.json({ user, token })
  //   }
  // })(req, res, next)
}

exports.login_google = (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
}

exports.login_google_redirect = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    console.log('working, i think?')
    if (err) {
      return res.json({ errors: err })
    } else {
      const token = jwt.sign({ user }, process.env.JWT_KEY)
      return res.json({ user, token })
    }
  })(req, res, next);
  // hangs, because i still need to do something with it. 
  // part of it needs to happen in the strategy (find user or create user or send back error)
  // part of it happens here -> if error, do this; if success, do this
}

