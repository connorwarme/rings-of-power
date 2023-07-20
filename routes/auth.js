const express = require("express")
const router = express.Router()
const passport = require("passport")

const auth_controller = require("../controllers/authController")
const jwt = require("../jwt")

// todo: do these routes need a verifyNoToken? 

router.get("/login", auth_controller.login)

router.post("/local", auth_controller.login_localvs)

router.get("/facebook", auth_controller.login_facebook)

router.get("/facebook/redirect", auth_controller.login_facebook_redirect)

// not sure if it will change anything...
router.get("/google", auth_controller.login_google)

router.get("/google/redirect", auth_controller.login_google_redirect)

// router.get("/login/success", jwt.verifyToken, (req, res) => {
//   if (req.user) {
//     res.status(200).json({
//       success: true,
//       message: "login successful :D",
//       user: req.user,
//       // jwt could be here...
//     })
//   }
// })
router.get("/user", jwt.verifyToken, auth_controller.user_get)

router.get("/oauth", (req, res, next) => {
  passport.authenticate('session', (err, user, info) => {
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
})
// notes for tommorow:
// getting an error: 404 NotFound
// it is not find the route to auth/oauth. wtf?? I don't understand, maybe my sleepy brain is missing something obvious
// not certain that I have things set up properly for sending this axios request (withCredentials)
// pretty sure that you don't explicitly attach the cookie, just use withCredentials
// passport should authenticate, but need to confirm that is set up properly too.
// idea is that they click to sign in w/ oauth, a success redirects to this page, which quickly sends the cookie back to the server, find/create the user, send back token and navigate to home page

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "login failed :/"
  })
})

// do I need to jwt.verifyToken ??
router.post("/logout", auth_controller.logout_post)

module.exports = router