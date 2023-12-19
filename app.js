require('dotenv').config()

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const session = require("express-session")
const MongoStore = require("connect-mongo")
const passport = require("passport")
const cors = require("cors")

require("./mongoConfig") 
require("./passport")

const app = express();

const corsOptions =   {
  origin: ['https://connorwarme.github.io', 'http://localhost:5173', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://www.facebook.com/v3.2/dialog/oauth', 'http://localhost:4173'],
  methods: [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', 'Accept', 'Accept-Language', 'Content-Language', 'Origin', 'Referer', 'User-Agent', 'x-client-key', 'x-client-token', 'x-client-secret', 'X-Requested-With'],
  credentials: true,
}
app.use(cors(corsOptions))
// when I was trying to debug my cors errors...I tried to manually set the headers, instead of the cors package.
// turns out an error was causing my server to restart, and throwing a wrench in the oauth handling.
// app.use((req, res, next) => {
//   const allowedOrigins = ['https://connorwarme.github.io', 'http://localhost:5173', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://www.facebook.com/v3.2/dialog/oauth', 'http://localhost:4173'];
//   const origin = req.headers.origin;
//   // if (allowedOrigins.includes(origin)) {
//   //    res.setHeader('Access-Control-Allow-Origin', origin);
//   // }
//   res.header('Access-Control-Allow-Origin', 'https://connorwarme.github.io');
//   res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT, DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.header('Access-Control-Allow-Credentials', true);
//   return next();
// })

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth')
const userRouter = require('./routes/user');

// set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// trying this 12/18 - working on cookie issue
app.set('trust proxy', 1);

app.use(logger('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({ 
    secret: process.env.SESSIONS_SECRET, 
    resave: false, 
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.SESSIONS_URL,
    }),
    // these, without the cookie options, worked in firefox. 
    // chrome balked at lack of sameSite setting and lack of secure setting
    httpOnly: true,
    secure: true,
    maxAge: 1000 * 60 * 60 * 7,
    proxy: true,
    // this cookie option messes w/ session + google oauth login
    // don't understand why, but cant be used
    // uncommented cookie option on 12/10 - trying to debug oauth login once deployed
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 20000,
    } 
  }))

app.use(passport.initialize())
app.use(passport.session())

app.use(function(req, res, next) {
  res.locals.currentUser = req.user 
  next()
})

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
