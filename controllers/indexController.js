const asyncHandler = require("express-async-handler")

const User = require("../models/user")

exports.login_get = asyncHandler(async (req, res, next) => {
  res.render("login", { title: "Login" })
})
exports.login_post = asyncHandler(async (req, res, next) => {
  res.send("Not implemented yet: login POST")
})

exports.signup_get = asyncHandler(async (req, res, next) => {
  res.render("signup", { title: "Signup" })
})
exports.signup_post = asyncHandler(async (req, res, next) => {
  res.send("Not implemented yet: signup POST")
})