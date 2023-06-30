require("dotenv").config()

const passport = require("passport")
const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook')
const GoogleStrategy = require('passport-google-oauth20')
const passportJWT = require('passport-jwt')
const JwtStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const session = require("express-session")
const User = require('./models/user')
const Friends = require("./models/friends")

const facebook = {
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_KEY,
  //todo: based on env, change url to localhost, dev or prod
  callbackURL: "/auth/facebook/redirect",
  //todo: do I need state?
  // state: true,
  //todo: don't know if I need proof - what is it? what does it do?
  // enableProof: true, //to enable secret proof
  profileFields: ['id', 'emails', 'name', 'picture.type(large)'] //scope of fields
}
// might be able to build this into facebook strategy fn
const formatFB = (profile) => {
  return {
    first_name: profile.first_name,
    family_name: profile.last_name,
    email: profile.email,
    picture: profile.picture.data.url,
    fbid: profile.id,
  }
}

const google = {
  //todo: based on env, change url to localhost, dev or prod
  callbackURL: "/auth/google/redirect",
  clientID: process.env.G_APP_ID,
  clientSecret: process.env.G_APP_KEY,
}
const formatG = (profile) => {
  return {
    first_name: profile.given_name,
    family_name: profile.family_name,
    email: profile.email,
    picture: profile.picture.replace("=s96-c", "") || null,
    googleid: profile.sub
  }
}

// for local sign-in
passport.use(
  new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    session: false,
  },
  async(username, password, done) => {
    try {
      console.log(username)
      const user = await User.findOne({ email: username })
      if (!user) {
        return done(null, false, { message: "Incorrect email!" })
      }
      bcrypt.compare(password, user.loginid.hash, (err, res) => {
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
// for facebook oauth
passport.use(
  new FacebookStrategy(
    facebook,
    // need to set session to false? 
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile)
       const fbUser = formatFB(profile._json)
       try {
        const user = await User.findOne({ email: fbUser.email })
        if (!user) {
          const friendList = new Friends({
            list: [],
            pending: [],
            request: [],
          })
          const newUser = new User({
            first_name: fbUser.first_name,
            family_name: fbUser.family_name,
            email: fbUser.email,
            loginid: {
              hash: null,
              googleid: null,
              fbid: fbUser.fbid,
            },
            picture: fbUser.picture,
            friend_list: friendList,
          })
          await friendList.save()
          await newUser.save()
          return done(null, newUser, { message: "Welcome! User profile created" })
        }
        return done(null, user, { message: "Welcome back!" })
      } catch (err) {
        console.log(err)
        return done(err)
      }
    }
  )
)
// for google oauth
passport.use(
  new GoogleStrategy(
    // options for google oauth
    google, 
    async(accessToken, refreshToken, profile, done) => {
      console.log(profile)
      const googleUser = formatG(profile._json)
      try {
        const user = await User.findOne({ email: googleUser.email })
        if (!user) {
          console.log('user not found, creating new one')
          const friendList = new Friends({
            list: [],
            pending: [],
            request: [],
          })
          const newUser = new User({
            first_name: googleUser.first_name,
            family_name: googleUser.family_name,
            email: googleUser.email,
            loginid: {
              hash: null,
              googleid: googleUser.googleid,
              fbid: null,
            },
            picture: googleUser.picture,
            friend_list: friendList,
          })
          await friendList.save()
          await newUser.save()
          return done(null, newUser, { message: "Welcome! User profile created" })
        }
        return done(null, user, { message: "Welcome back!" })
      } catch (err) {
        console.log(err)
        return done(err)
      }
    }
  )
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