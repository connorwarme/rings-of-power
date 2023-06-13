require("dotenv").config()
const asyncHandler = require("express-async-handler")
const { body, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const passport = require("passport")
const jwt = require("jsonwebtoken")
const User = require("../models/user")

exports.login_get = asyncHandler(async (req, res, next) => {
  res.status(200).json({ title: "Login on auth!" })
})