require("dotenv").config()

const passport = require("passport")
const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook')
const passportJWT = require('passport-jwt')
const JwtStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const session = require("express-session")
const User = require('./models/user')

const facebook = {
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_KEY,
  //todo: based on env, change url to localhost, dev or prod
  callbackURL: "http://localhost:3000/auth/login/facebook/callback",
  enableProof: true, //to enable secret proof
  profileFields: ['id', 'emails', 'name'] //scope of fields
}

// const google = {
//   clientID: process.env.G_APP_ID,
//   clientSecret: process.env.G_APP_KEY,
//   //todo: based on env, change url to localhost, dev or prod
//   callbackURL: "http://localhost:3000/auth/login/google/callback"
// }

export const initPassport = (app) => {
  app.use(
    session({
      resave: false,
      saveUninitialized: true,
      secret: process.env.SECRET,
    })
  );
  //init passport
  app.use(passport.initialize());
  app.use(passport.session());
}

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

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_KEY,
  }, 
  function(jwt_payload, done) {
    console.log(jwt_payload)
  }
  ))

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