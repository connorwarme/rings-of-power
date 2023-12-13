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
const Photo = require("./models/photo")
const axios = require("axios")

const facebook = {
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_KEY,
  // todo: based on env, change url to localhost, dev or prod
  // changing on 12/11 to try and debug cors error
  callbackURL: "https://rings-of-power.fly.dev/auth/facebook/redirect",
  // callbackURL: "http://localhost:3000/auth/facebook/redirect",
  // todo: do I need state?
  // state: true,
  // todo: don't know if I need proof - what is it? what does it do?
  // enableProof: true, // to enable secret proof
  profileFields: ['id', 'emails', 'name', 'picture.type(large)'] // scope of fields
}

const formatFB = async (profile) => {
  let photo = null
  if (profile.picture.data.url) {
    const getObject = await getUserPhoto(profile.picture.data.url)
    if (getObject.buffer && getObject.type) {
      photo = new Photo({
        photo: getObject.buffer,
        photoType: getObject.type,
      })
      await photo.save()
    }
  }
  return {
    first_name: profile.first_name,
    family_name: profile.last_name,
    email: profile.email,
    picture: profile.picture.data.url,
    fbid: profile.id,
    photo: photo ? photo._id : '65073de65f81b51fc4fc9059',
  }
}

const google = {
  clientID: process.env.G_APP_ID,
  clientSecret: process.env.G_APP_KEY,
  //todo: based on env, change url to localhost, dev or prod
  // changing on 12/11 to debug
  callbackURL: "https://rings-of-power.fly.dev/auth/google/redirect",
  // callbackURL: "http://localhost:3000/auth/google/redirect",

}
const formatG = async (profile) => {
  let photo = null
  if (profile.picture) {
    const getObject = await getUserPhoto(profile.picture.replace("=s96-c", ""))
    if (getObject.buffer && getObject.type) {
      photo = new Photo({
        photo: getObject.buffer,
        photoType: getObject.type,
      })
      await photo.save()
    }
  }
  return {
    first_name: profile.given_name,
    family_name: profile.family_name,
    email: profile.email,
    picture: profile.picture.replace("=s96-c", "") || null,
    googleid: profile.sub,
    photo: photo._id,
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
      const user = await User.findOne({ email: username })
      if (!user) {
        return done(null, false, { message: "Incorrect email!", email: true })
      }
      bcrypt.compare(password, user.loginid.hash, (err, res) => {
        if (res) {
          return done(null, user, { message: 'Login successful!' })
        } else { 
          return done(null, false, { message: "Incorrect password!", password: true })
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
      const fbUser = await formatFB(profile._json)
      console.log(fbUser)
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
            photo: fbUser.photo,
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
      const googleUser = await formatG(profile._json)
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
            photo: googleUser.photo,
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
  console.log(user)
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
        message: "You don't have proper clearance!"
      })
    }
    req.user = user
    next()
  })
}

// if oauth login profile has a url for profile picture, try to fetch arraybuffer
// then try to discover mimetype and make a buffer
// if that works, then save to db
// if it fails at any point, give the user account the stock image _id instead
// otherwise, give it the new photo _id

const getUserPhoto = async (photoUrl) => {
  const photo = await getArrayBuffer(photoUrl)
  const uint8 = new Uint8Array(photo)
  const type = getMimeTypeFromUint8Array(uint8)
  const buffer = Buffer.from(uint8)
  return ({ buffer, type })
}

const getMimeTypeFromUint8Array = (uint8arr) => {
  const len = 4
  if (uint8arr.length >= len) {
    let signatureArr = new Array(len)
    for (let i = 0; i < len; i++)
      signatureArr[i] = (uint8arr)[i].toString(16)
    const signature = signatureArr.join('').toUpperCase()
    console.log(`signature is: ${signature}`)
    switch (signature) {
      case '89504E47':
        return 'image/png'
      case '47494638':
        return 'image/gif'
      case 'FFD8FFDB':
      case 'FFD8FFE0':
        return 'image/jpeg'
      default:
        return null
    }
  }
  return null
}

const getArrayBuffer = async (url) => {
  const response = await fetch(url)
  return response.arrayBuffer()
}