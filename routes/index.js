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

router.get('/get', function(req, res, next) {
  res.json({
    message: "It worked!"
  })
})

router.get('/login', index_controller.verifyNoToken, index_controller.login_get)
router.post('/login', index_controller.login_post)

router.get('/signup', index_controller.verifyNoToken, index_controller.signup_get)
router.post('/signup', index_controller.signup_post)

router.post('/refresh', (req, res, next) => {
  // take the refresh token from user
  const refreshToken = req.body.token
  // send user is no token of if invalid
  if (!refreshToken) return res.status(401).json("You are not authenticated!")
  // if everything is okay, create new access token and refresh token and send to user.
})

router.get('/profile', index_controller.verifyToken, index_controller.profile_get)
router.get('/profile/:id', index_controller.verifyToken, index_controller.profile_detail_get)
router.get('/posts', index_controller.verifyToken, index_controller.posts_all_get)
router.get('/other-posts', index_controller.verifyToken, index_controller.posts_other_get)

router.get('/friends', index_controller.verifyToken, index_controller.friends_get)
router.get('/author/:id', index_controller.verifyToken, index_controller.comment_author_get)

router.post('/sendrequest', index_controller.verifyToken, index_controller.friends_send_request_post)
router.post('/acceptrequest', index_controller.verifyToken, index_controller.friends_accept_request_post)
router.post('/denyrequest', index_controller.verifyToken, index_controller.friends_deny_request_post)
router.post('/deletefriend', index_controller.verifyToken, index_controller.friends_delete_post)

router.get('/post/:id', index_controller.verifyToken, index_controller.post_get)
router.post('/createpost', index_controller.verifyToken, index_controller.create_post)
router.post('/editpost/:id', index_controller.verifyToken, index_controller.edit_post)
router.post('/deletepost/:id', index_controller.verifyToken, index_controller.delete_post)
router.post('/likepost/:id', index_controller.verifyToken, index_controller.like_post)
router.post('/unlikepost/:id', index_controller.verifyToken, index_controller.unlike_post)
router.post('/addcomment', index_controller.verifyToken, index_controller.add_comment_post)
router.post('/editcomment', index_controller.verifyToken, index_controller.edit_comment_post)
router.post('/deletecomment', index_controller.verifyToken, index_controller.delete_comment_post)


module.exports = router;
