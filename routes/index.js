const express = require('express');
const router = express.Router();

const index_controller = require("../controllers/indexController")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', index_controller.login_get)
router.post('/login', index_controller.login_post)

router.get('/signup', index_controller.signup_get)
router.post('/signup', index_controller.signup_post)


module.exports = router;
