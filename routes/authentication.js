const express = require('express');

const router = express.Router();

router.get('/register', (req, res, next) => {
  res.json({
    message: 'User created',
  });
});

router.get('/login', (req, res, next) => {
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

router.get('/refresh', (req, res, next) => {
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

router.get('/logout', (req, res, next) => {
  res.json({
    error: false,
    message: 'Token successfully invalidated',
  });
});

module.exports = router;
