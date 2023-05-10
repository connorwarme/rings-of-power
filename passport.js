const passport = require("passport")
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require('./models/user')

passport.use(
  new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    session: false,
  },
  async(username, password, done) => {
    try {
      const user = await User.findOne({ email: username })
      if (!user) {
        return done(null, false, { message: "Incorrect email!" })
      }
      bcrypt.compare(password, user.hash, (err, res) => {
        if (res) {
          return done(null, user, { message: 'Login successful!' })
        } else { 
          return done(null, false, { message: "Incorrect password!" })
        }
      })
    } catch (err) {
      return done(err)
    }
  })
)

passport.serializeUser(function(user, done) {
  done(null, user.id)
})
passport.deserializeUser(async(id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) {
    return res.sendStatus(401).json({
      message: "No token found."
    })
  }
  jwt.verify(token, process.env.JWT_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "You don't have proper clearance :/"
      })
    }
    req.user = user
    next()
  })
}