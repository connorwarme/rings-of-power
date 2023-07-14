const express = require("express")
const router = express.Router()

const auth_controller = require("../controllers/authController")
const jwt = require("../jwt")

// todo: do these routes need a verifyNoToken? 

router.get("/login", auth_controller.login)

router.get("/logout", (req, res) => {
  // what does logout require? 
  // delete token from local storage
  // what else?
  req.logout()
  res.redirect('http://localhost:5173/login')
})

router.post("/local", auth_controller.login_localvs)

router.get("/facebook", auth_controller.login_facebook)

router.get("/facebook/redirect", auth_controller.login_facebook_redirect)

router.get("/google", auth_controller.login_google)

router.get("/google/redirect", auth_controller.login_google_redirect)

router.get("/login/success", jwt.verifyToken, (req, res) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      message: "login successful :D",
      user: req.user,
      // jwt could be here...
    })
  }
})

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "login failed :/"
  })
})

router.post("/logout", jwt.verifyToken, auth_controller.logout_post)

module.exports = router