const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');

const moviesRouter = require('./routes/movies');
const peopleRouter = require('./routes/people');
const authenticationRouter = require('./routes/authentication');
const documentRouter = require('./routes/docs');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());

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
