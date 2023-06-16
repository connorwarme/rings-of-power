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

exports.login_facebook = (req, res, next) => {
  passport.authenticate('facebook')(req, res, next)
}

exports.login_facebook_redirect = (req, res, next) => {
  passport.authenticate('facebook', { scope: [ 'email' ] }, (err, user, info) => {
    // hanging before getting to this... need to double check settings on fb dev site
    // todo: figure out fb login
    console.log('fb redirect working!')
    if (err) {
      return res.json({ errors: err })
    } else {
      const token = jwt.sign({ user }, process.env.JWT_KEY)
      return res.json({ user, token, info })
    }
  })
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

