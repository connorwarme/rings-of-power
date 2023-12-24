const express = require("express")
const router = express.Router()
const passportConfig = require("../passport")
const auth_controller = require("../controllers/authController")

// todo: do these routes need a verifyNoToken? 

router.get("/login", auth_controller.login)

router.post("/local", auth_controller.login_localvs)

router.get("/facebook", auth_controller.login_facebook)

router.get("/facebook/redirect", auth_controller.login_facebook_redirect)

// not sure if it will change anything...
router.get("/google", auth_controller.login_google)

router.get("/google/redirect", auth_controller.login_google_redirect)

router.post("/guest", auth_controller.login_guest)

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
// not sure why this wasn't working
// tried a rewrite and things worked..?
// I think that the old token had expired and by logging in anew things worked
// router.get("/user", jwt.verifyToken, auth_controller.user_get)
router.get("/user", passportConfig.authenticateToken, auth_controller.user_get)

router.get("/oauth", auth_controller.oauth)
// // this version works
// router.get("/oauth", (req, res, next) => {
//   // get the user 
//   const user = req.user
//   // make token
//   const token = jwt.sign({ user }, process.env.JWT_KEY, { expiresIn: "15m" })
//   // send back user and token (and eventually refresh token)
//   res.send({ accessToken: token })
// })

// idea is that they click to sign in w/ oauth, a success redirects to this page, which quickly sends the cookie back to the server, send back token and navigate to home page

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "login failed :/"
  })
})

// do I need to jwt.verifyToken ??
router.post("/logout", auth_controller.logout_post)

module.exports = router