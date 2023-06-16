const express = require("express")
const router = express.Router()

const auth_controller = require("../controllers/authController")

router.get("/login", auth_controller.login)

router.get("/logout", (req, res) => {
  res.json({
    message: "logging out",
  })
})

router.get("/facebook", auth_controller.login_facebook)

router.get("/facebook/redirect", auth_controller.login_facebook_redirect)

router.get("/google", auth_controller.login_google)

router.get("/google/redirect", auth_controller.login_google_redirect)

module.exports = router