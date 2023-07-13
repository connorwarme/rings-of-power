require("dotenv").config()
const asyncHandler = require("express-async-handler")
const { body, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const passport = require("passport")
const jwt = require("jsonwebtoken")
const User = require("../models/user")

// jwt 
const generateAccessToken = (user) => {
  return jwt.sign({ user }, process.env.JWT_KEY, { expiresIn: "15m" })
}
const generateRefreshToken = (user) => {
  return jwt.sign({ user }, process.env.JWT_REFRESH_KEY)
}


exports.login = asyncHandler(async (req, res, next) => {
  res.status(200).json({ title: "Login on auth!" })
})

// todo: don't think I need this route. local login will be on initial login route, along w/ btn for google and fb login
// exports.login_local = asyncHandler(async (req, res, next) => {
//   res.render("login", { title: "Login" })
// })

exports.login_localvs = [
  body("email", "Please enter your email address.")
  .trim()
  .isLength({ min: 1 })
  .isEmail()
  .escape(),
  body("password", "Please enter your password.")
  .trim()
  .isLength({ min: 6 })
  .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req)
    console.log(errors.array())
    const login = {
      email: req.body.email,
      password: '',
    }
      if (!errors.isEmpty()) {
        res.json({ errors: errors.array(), login })
        return
      } else {
        passport.authenticate("local", { session: false }, (err, user, info) => {
          if (err) {
            return res.json({ errors: err, login })
          }
          // this can actually happen for incorrect email or for incorrect password
          // todo: handle this error properly
          if (user === false) {
            const error = new Error()
            error.msg = info.message
            error.status = 404
            return res.json({ errors: [error], login })
          } else {
            const token = jwt.sign({ user }, process.env.JWT_KEY)
            return res.json({ user, token })
          }
        })(req, res, next)
      }
    })
]
// this one works, doesn't validate and sanitize data...
exports.login_local = (req, res, next) => {
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
      const token = jwt.sign({ user }, process.env.JWT_KEY, { expiresIn: "15m" })
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
// things aren't working. my client sends the request to /auth/google, gets a response back. empty but has redirect value in headers but I can't read the header...
// learning objectives:
// go through google's oauth docs to see if there's any little clues
// does CORS matter? how is it impacting this?
// maybe try to go through the entire tutorial (that I cherry-picked from) to see if that approach would work
// my browser is showing the headers...why can't I see them in logs? 

// not sure if this is how i want to handle failure, but will follow up. going to make a simple route/fn in routes page
exports.login_google_redirect = (req, res, next) => {
  passport.authenticate('google',
  (err, user, info) => {
    // not getting to this part of the authentication..?? not sure why. 
    // problem is that prior function is not returning any data... not sure why?
    console.log('working, i think?')
    if (err) {
      return res.json({ errors: err })
    } else {
      const token = jwt.sign({ user }, process.env.JWT_KEY)
      return res.json({ user, token, info })
    }
  })(req, res, next);
}

