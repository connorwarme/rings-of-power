require("dotenv").config()
const jwt = require("jsonwebtoken")

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  console.log(authHeader)
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) {
    // need user to sign in to access page content
    const error = new Error("No token found.")
    error.status = 401
    console.log('no token found')
    return res.json({ errors: error })
  }
  jwt.verify(token, process.env.JWT_KEY, (err, data) => {
    if (err) {
      const error = new Error("You don't have proper clearance :/")
      error.status = 403
      return res.json({ errors: error })
    }
    req.user = data.user
    req.token = token
    next()
  })
}
// todo: is this function needed? (7/13)
exports.verifyNoToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token != null) {
    req.token = token // todo: is this best practice?
    // I put the token on the req.obj so that I'd be able to run a check on the login page (see fn above)
    // But I'm not sure that I even need this function at all...
    const error = new Error("You are already a user!")
    error.status = 403
    res.json({ errors: error, token })
  }
  next()
}
