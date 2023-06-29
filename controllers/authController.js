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

// todo: don't think I need this route. local login will be on initial login route, along w/ btn for google and fb login
// exports.login_local = asyncHandler(async (req, res, next) => {
//   res.render("login", { title: "Login" })
// })

exports.login_local = (req, res, next) => {
  console.log('firing local passport fn')
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      console.log(err)
      return res.json({ errors: err })
    }
    if (user === false) {
      const error = new Error("User not found!")
      error.status = 404
      console.log(error)
      return res.json({ errors: error })
    } else {
      console.log('yo, it worked!')
      const token = jwt.sign({ user }, process.env.JWT_KEY)
      return res.json({ user, token })
    }
  })(req, res, next)
}

exports.login_facebook = (req, res, next) => {
  passport.authenticate('facebook', { scope: [ 'public_profile', 'email' ] })(req, res, next)
}

exports.login_facebook_redirect = (req, res, next) => {
  passport.authenticate('facebook', (err, user, info) => {
    if (err) {
      return res.json({ errors: err })
    } else {
      const token = jwt.sign({ user }, process.env.JWT_KEY)
      return res.json({ user, token, info })
    }
  })(req, res, next);
}

exports.login_google = (req, res, next) => {
  passport.authenticate('google', { scope: [ 'profile', 'email' ] })(req, res, next)
}

exports.login_google_redirect = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    console.log('working, i think?')
    if (err) {
      return res.json({ errors: err })
    } else {
      const token = jwt.sign({ user }, process.env.JWT_KEY)
      return res.json({ user, token, info })
    }
  })(req, res, next);
}

