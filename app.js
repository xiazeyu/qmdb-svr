const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const knex = require('knex')(require('./knexfile'));
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SECRET_KEY;
const moviesRouter = require('./routes/movies');
const peopleRouter = require('./routes/people');
const authenticationRouter = require('./routes/authentication');
const documentRouter = require('./routes/docs');

const app = express();

app.use((req, res, next) => {
  req.db = knex;
  next();
});

const authorisation = (req, res, next) => {
  if (req.header('Authorization')) {
    const jwt = req.header('Authorization').split(' ')[1];

    try {
      const token = jwt.verify(jwt, JWT_SECRET);
      req.username = token.name;
      next();
    } catch (e) {
      res.status(401);
      res.json({
        error: true,
        message: 'Invalid JWT token',
      });
    }
  }
};

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(cors());

app.use('/movies', moviesRouter);
app.use('/people', peopleRouter);
app.use('/user', authenticationRouter);
app.use('/docs', documentRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  next(createError(err.status || 500));
});

module.exports = app;
