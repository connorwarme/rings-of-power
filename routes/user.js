const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.status(500)
});
router.get('/privacypolicy', function(req, res, next) {
  res.render('privacy', { 
    title: 'Privacy Policy',
  });
});

module.exports = router;
