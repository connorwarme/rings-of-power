const express = require("express")
const router = express.Router()

const auth_controller = require("../controllers/authController")

router.get("/login", auth_controller.login_get)

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

router.get("/google", (req, res) => {
  res.json({
    message: "logging in with google",
  })
})
router.get("/google/redirect", (req, res) => {
  res.json({
    message: "google callback - check if user already has account in db or if need to create one",
  })
})

module.exports = router