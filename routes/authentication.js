const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authorization = require('../middleware/authorization');

const JWT_SECRET = process.env.SECRET_KEY;
const router = express.Router();

const saltRounds = 10;

router.post('/register', (req, res, next) => {
  const { email } = req.body;
  const { password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: 'Request body incomplete - email and password needed',
    });
    return;
  }

  const queryUsers = req.db
    .from('users')
    .select('*')
    .where('email', '=', email);

  queryUsers
    .then((users) => {
      if (users.length > 0) {
        throw new Error('User already exists');
      }

      // Not matching users
      return bcrypt.hash(password, saltRounds);
    })
    .then((passwordHash) => req.db.from('users').insert({
      email,
      password: passwordHash,
    }))
    .then(() => {
      res.status(201).json({
        success: true,
        message: 'User created',
      });
    }).catch((e) => {
      res.status(500).json({
        success: false,
        message: e.message,
      });
    });
});

router.post('/login', (req, res, next) => {
  const { email } = req.body;
  const { password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: 'Request body incomplete - email and password needed',
    });
    return;
  }

  const queryUsers = req.db
    .from('users')
    .select('*')
    .where('email', '=', email);

  queryUsers
    .then((users) => {
      if (users.length === 0) {
        throw new Error('User does not exist');
      }

      const user = users[0];
      return bcrypt.compare(password, user.password);
    }).then((match) => {
      if (!match) {
        throw new Error('Password does not match');
      }

      // Create and return JWT token
      const expiresIn = 60 * 60 * 24;
      const exp = Math.floor(Date.now() / 1000) + expiresIn;
      const token = jwt.sign({ exp }, JWT_SECRET);
      res.status(200).json({
        token,
        token_type: 'Bearer',
        expiresIn,
      });
    });
});

router.post('/refresh', authorization, (req, res, next) => {
  res.json({
    bearerToken: {
      token: 'ajsonwebtoken',
      token_type: 'Bearer',
      expires_in: 600,
    },
    refreshToken: {
      token: 'ajsonwebtoken',
      token_type: 'Refresh',
      expires_in: 86400,
    },
  });
});

router.post('/logout', (req, res, next) => {
  res.json({
    error: false,
    message: 'Token successfully invalidated',
  });
});

router.get('/:email/profile', (req, res, next) => {
  res.json({
    email: '',
  });
});

router.put('/:email/profile', (req, res, next) => {
  res.json({
    email: '',
    message: 'Profile updated',
  });
});

module.exports = router;
