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

module.exports = router