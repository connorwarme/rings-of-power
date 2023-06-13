const express = require("express")
const router = express.Router()

const auth_controller = require("../controllers/authController")

router.get("/", auth_controller.login_get)

// router.get("/login/federated/facebook", )

module.exports = router