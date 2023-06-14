const express = require("express")
const router = express.Router()

const auth_controller = require("../controllers/authController")

router.get("/login", auth_controller.login)

router.get("/logout", (req, res) => {
  res.json({
    message: "logging out",
  })
})

router.get("/facebook", (req, res) => {
  res.json({
    message: "logging in with facebook",
  })
})
router.get("/facebook/redirect", (req, res) => {
  res.json({
    message: "facebook callback - check if user already has account in db or if need to create one",
  })
})

router.get("/google", auth_controller.login_google)

router.get("/google/redirect", auth_controller.login_google_redirect)

module.exports = router