const cookieParser = require('cookie-parser');
const cors = require('cors');
const createError = require('http-errors');
const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
require('dotenv').config();

const moviesRouter = require('./routes/movies');
const peopleRouter = require('./routes/people');
const authenticationRouter = require('./routes/authentication');
const documentRouter = require('./routes/docs');

const database = require('./middleware/database');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(database);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(cors());

// Routes
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
