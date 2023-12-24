require("dotenv").config()
const asyncHandler = require("express-async-handler")
const { body, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const passport = require("passport")
const jwt = require("jsonwebtoken")
const User = require("../models/user")

// jwt 
// todo: change expiration length
// and implement refresh tokens
const generateAccessToken = (user) => {
  return jwt.sign({ user }, process.env.JWT_KEY, { expiresIn: "1500m" })
}
const generateRefreshToken = (user) => {
  return jwt.sign({ user }, process.env.JWT_REFRESH_KEY)
}
// how to properly handle this (storage of refresh tokens)..?
let refreshTokens = []


exports.login = asyncHandler(async (req, res, next) => {
  res.status(200).json({ title: "Login on auth!" })
})

exports.user_get = async (req, res) => {
  if (req.user && req.user.user) {
    // generate tokens
    // const accessToken = generateAccessToken(req.user)
    // const refreshToken = generateRefreshToken(req.user)
    // add to array
    // refreshTokens.push(refreshToken)
    const user = await User.findById(req.user.user._id).populate("friend_list").populate("photo").exec()
    const photo = user.photo ? user.photo.photoImagePath : null
    return res.send({
      user: user,
      photo: photo,
      // access: accessToken,
      // refresh: refreshToken,
    })
  } else {
    console.log('no user on request....keep debugging')
    return res.send({ error: "There was an error, likely in finding the user on the request" })
  }
}

exports.oauth = (req, res, next) => {
  // need to use the cookie to find the user
  // get the user 
  const user = req.user
  // make token
  const token = jwt.sign({ user }, process.env.JWT_KEY, { expiresIn: "1500m" })
  // send back user and token (and eventually refresh token)
  res.send({ accessToken: token })
}

exports.login_localvs = [
  body("email", "Please enter your email address.")
  .trim()
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
            // generate tokens
            const accessToken = generateAccessToken(user)
            const refreshToken = generateRefreshToken(user)
            // add to array
            refreshTokens.push(refreshToken)
            return res.json({ user, accessToken, refreshToken })
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

// works, but now FB requires business account (and verification) to utilize their oauth login

exports.login_facebook = (req, res, next) => {
  passport.authenticate('facebook', { scope: [ 'public_profile', 'email' ] })(req, res, next)
}

// old method. works.
// exports.login_facebook_redirect = (req, res, next) => {
//   passport.authenticate('facebook', {
//     successRedirect: 'https://connorwarme.github.io/rop-lair/auth/success',
//     failureRedirect: 'https://connorwarme.github.io/rop-lair/login', 
//     session: true, 
//   })(req, res, next)
// }
// new method: trying to send a successful redirect, but after I figure out how to deal with req.user & get it to persist. works.
// but see note above - FB login requires business account now. no longer using on app. 
exports.login_facebook_redirect = [
  passport.authenticate('facebook', {
    failureRedirect: 'https://connorwarme.github.io/rop-lair/login', 
    session: true, 
  }),
  async (req, res, next) => {
    req.session.user = req.user._id
    try {
      await req.session.save()
      return res.redirect('https://connorwarme.github.io/rop-lair/auth/success') 
    } catch (err) {
      console.error('Error saving to session storage: ', err);
      return next(new Error('Error creating user'));
    }
  }
] 

exports.login_google = (req, res, next) => {
  // not sure if this response type needs to be code. was trying to debug so I could use keep this authentication going on the backend
  passport.authenticate('google', { scope: [ 'profile', 'email' ] })(req, res, next)
}

// not sure if this is how i want to handle failure, but will follow up. going to make a simple route/fn in routes page
// changed this on 12/12
exports.login_google_redirect = (req, res, next) => {
  passport.authenticate('google', {
    // changing on 12/11 to try and debug
    successRedirect: 'https://connorwarme.github.io/rop-lair/auth/success',
    failureRedirect: 'https://connorwarme.github.io/rop-lair/login',
    // successRedirect: 'http://localhost:5173/rop-lair/auth/success',
    // failureRedirect: 'http://localhost:5173/rop-lair/login',
    session: true,
  })(req, res, next)
}
exports.login_guest = (req, res, next) => {
  req.body.email = process.env.GUEST_ID
  req.body.password = process.env.GUEST_KEY
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      console.log(err)
      return res.json({ errors: err })
    }
    if (user === false) {
      const error = new Error("Guest user account not found!")
      error.status = 404
      console.log(error)
      return res.json({ errors: error })
    } else {
      // generate token
      const accessToken = generateAccessToken(user)
      return res.json({ user, accessToken })
    }
  })(req, res, next)
}

exports.refresh_token_post = (req, res, next) => {
  // take the fresh token from the user
  const refreshToken = req.body.token
  // send error if no token or if invalid
  if (!refreshToken) return res.status(401).json("You are not authenticated!")
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid!")
  }
  // create new access and refresh tokens and send to user
  jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
    if (err) return res.json({ errors: err })
    // invalidate old refresh token (by removing it from array)
    refreshTokens = refreshTokens.filter(token => token !== refreshToken)
    // generate new access and refresh tokens
    const newAccessToken = generateAccessToken(user)
    const newRefreshToken = generateRefreshToken(user)
    // add newRefreshToken to array
    refreshTokens.push(newRefreshToken)

    return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken })

  })
}

// have to provide accessToken as authorization header && refreshToken in body as "token"
// right now, it deletes token from state (client side)
// and this logs out the session (if they signed in via oauth)

exports.logout_post = (req, res, next) => {
  // if user logged in via oauth, passport created a session -> need to logout
  // need to run a check for session, then only run req.logout() for truthy
  // this check (req.session.user) doesn't work.
  if (req.session.user) {
    req.session.destroy((err) => console.log(err))
    req.logout()
  }
  // remove refresh token from token array
  // const refreshToken = req.body.token
  // refreshTokens = refreshTokens.filter(token => token !== refreshToken)
  return res.status(200).clearCookie("connect.sid").json("Logged out successfully!")
}