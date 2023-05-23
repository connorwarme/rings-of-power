const express = require('express');
const router = express.Router();
require("../passport")

const index_controller = require("../controllers/indexController")

/* GET home page. */
router.get('/', index_controller.verifyToken, function(req, res, next) {
  console.log(req.user)
  res.render('index', { 
    title: 'Home',
    user: req.user.user, 
    token: req.token,
  });
  // res.json({ 
  //   user: req.user, 
  //   token: req.token,
  //   title: "Home"
  // })
});

router.get('/login', index_controller.verifyNoToken, index_controller.login_get)
router.post('/login', index_controller.login_post)

router.get('/signup', index_controller.verifyNoToken, index_controller.signup_get)
router.post('/signup', index_controller.signup_post)

router.get('/profile', index_controller.verifyToken, index_controller.profile_get)

router.get('/friends', index_controller.verifyToken, index_controller.friends_get)

router.post('/sendrequest', index_controller.verifyToken, index_controller.friends_send_request_post)
router.post('/acceptrequest', index_controller.verifyToken, index_controller.friends_accept_request_post)
router.post('/denyrequest', index_controller.verifyToken, index_controller.friends_deny_request_post)


module.exports = router;
