const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.status(200)
});
router.get('/privacypolicy', function(req, res, next) {
  res.status(200).json({ 
    policy: 'This app collects the following data: user name, email, and profile picture. This allows the app to create a user account to enable you to use the app. If you would like your user account and all data to be deleted, please contact me at cdwarme@hotmail.com thanks!',
  });
});

module.exports = router;
