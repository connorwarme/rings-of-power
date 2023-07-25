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

exports.user_get = (req, res) => {
  if (req.user) {
    // generate tokens
    // const accessToken = generateAccessToken(req.user)
    // const refreshToken = generateRefreshToken(req.user)
    // // add to array
    // refreshTokens.push(refreshToken)
    return res.send({
      user: req.user,
      // access: accessToken,
      // refresh: refreshToken,
    })
  } else {
    console.log('no user on request....keep debugging')
  }
}

exports.oauth = (req, res, next) => {
  // get the user 
  const user = req.user
  // make token
  const token = jwt.sign({ user }, process.env.JWT_KEY, { expiresIn: "1500m" })
  // send back user and token (and eventually refresh token)
  res.send({ accessToken: token })
}

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
            // generate tokens
            const accessToken = generateAccessToken(user)
            const refreshToken = generateRefreshToken(user)
            // add to array
            refreshTokens.push(refreshToken)
            console.log(accessToken)
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

exports.login_facebook = (req, res, next) => {
  passport.authenticate('facebook', { scope: [ 'public_profile', 'email' ] })(req, res, next)
}

exports.login_facebook_redirect = (req, res, next) => {
  passport.authenticate('facebook', {
    successRedirect: 'http://localhost:5173/',
    failureRedirect: 'http://localhost:5173/login', 
    session: true, 
  })(req, res, next)

  // old methodology...commented out on 7/15
  // passport.authenticate('facebook', (err, user, info) => {
  //   if (err) {
  //     return res.json({ errors: err })
  //   } else {
  //     const token = jwt.sign({ user }, process.env.JWT_KEY)
  //     return res.json({ user, token, info })
  //   }
  // })(req, res, next);
}

exports.login_google = (req, res, next) => {
  // not sure if this response type needs to be code. was trying to debug so I could use keep this authentication going on the backend
  passport.authenticate('google', { scope: [ 'profile', 'email' ] })(req, res, next)
}

// not sure if this is how i want to handle failure, but will follow up. going to make a simple route/fn in routes page
exports.login_google_redirect = (req, res, next) => {
  // passport.authenticate('google', { 
  //   successRedirect: 'http://localhost:5173/',
  //   failureRedirect: 'http://localhost:5173/login', 
  //   session: true, 
  passport.authenticate('google', {
    successRedirect: 'http://localhost:5173/auth/success',
    failureRedirect: 'http://localhost:5173/login',
    session: true,
  })(req, res, next)
  // (err, user, info) => {
  //   console.log('firing passport authenticate google callback fn')
  //   console.log({ err, user, info })
  //   if (err) {
  //     res.redirect("http://localhost:5173/login")
  //   } else {
  //     if (user === false) {
  //       const error = new Error()
  //       error.msg = info.message
  //       error.status = 404
  //       return res.json({ errors: [error] })
  //     } else {
  //       // generate tokens
  //       const accessToken = generateAccessToken(user)
  //       const refreshToken = generateRefreshToken(user)
  //       // add to array
  //       refreshTokens.push(refreshToken)
  //       console.log(accessToken)
  //       return res.json({ user, accessToken, refreshToken })
  //     }
  //   }




  // trying some debugging 7/15
  // passport.authenticate('google', { session: true },
  // (err, user, info) => {

  //   console.log('working, i think?')
  //   if (err) {
  //     return res.redirect("http://localhost:5173/login")
  //   } else {

  //     // generate tokens
  //     const accessToken = generateAccessToken(user)
  //     const refreshToken = generateRefreshToken(user)
  //     // add to array
  //     refreshTokens.push(refreshToken)
  //     // how to get the user and tokens to the client app?
  //     // going to come back to this, but I think the solution is to pass it thru as url parameters (7/13)
  //     // not sure if this is best practice...
  //     const url = 'http://localhost:5173'
  //     console.log(url)
  //     return res.redirect(url)
  //   }
  // })(req, res, next);
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
    console.log('fireddddd')
    req.logout()
  }
  // remove refresh token from token array
  // const refreshToken = req.body.token
  // refreshTokens = refreshTokens.filter(token => token !== refreshToken)
  return res.status(200).json("Logged out successfully!")
}