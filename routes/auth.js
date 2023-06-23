const express = require("express")
const router = express.Router()

const auth_controller = require("../controllers/authController")

// todo: do these routes need a verifyNoToken? 

router.get("/login", auth_controller.login)

router.get("/logout", (req, res) => {
  // what does logout require? 
  // delete token from local storage
  // what else?
  res.json({
    message: "logging out",
  })
})

router.post("/local", auth_controller.login_local)

router.get("/facebook", auth_controller.login_facebook)

router.get("/facebook/redirect", auth_controller.login_facebook_redirect)

router.get("/google", auth_controller.login_google)

router.get("/google/redirect", auth_controller.login_google_redirect)

module.exports = router