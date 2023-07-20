require('dotenv').config()

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require("express-session")
const passport = require("passport")
const cors = require("cors")

require("./mongoConfig") 
require("./passport")

const app = express();

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth')
const userRouter = require('./routes/user');

// set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({ 
    secret: "midnight", 
    resave: false, 
    saveUninitialized: true,
    // this cookie option messes w/ session + google oauth login
    // don't understand why, but cant be used
    // cookie: {
    //   sameSite: "none",
    //   secure: true,
    //   maxAge: 1000*60*24,
    // } 
  }))

app.use(passport.initialize())
app.use(passport.session())

// app.use(function(req, res, next) {
//   res.locals.currentUser = req.user 
//   next()
// })

app.use(cors(
  {
    origin: [ 'http://localhost:5173', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://www.facebook.com/v3.2/dialog/oauth' ],
    methods: [ "GET", "POST", "PUT", "DELETE" ],
    credentials: true,
  }
))

// set up routes
app.use('/', indexRouter);
app.use('/auth', authRouter)
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
