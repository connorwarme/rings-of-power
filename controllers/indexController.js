const asyncHandler = require("express-async-handler")

const User = require("../models/user")

exports.login_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: login GET")
})