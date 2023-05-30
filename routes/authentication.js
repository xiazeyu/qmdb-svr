const express = require('express');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SECRET_KEY;
const router = express.Router();

const saltRounds = 10;

router.post('/register', (req, res, next) => {
  const queryUsers = req.db
    .from('users')
    .select('*')
    .where('email', '=', email);

  queryUsers
    .then((users) => {
      if (users.length > 0) {
        console.log('User exists');
        return;
      }

      const hash = bcrypt.hashSync(password, saltRounds);
      return req.db.from('users').insert({ email, hash });
    });

  res.json({
    message: 'User created',
  });
});

router.post('/login', (req, res, next) => {
  const expires_in = 60 * 60 * 24;
  const exp = Math.floor(Date.now() / 1000) + expires_in;
  const token = jwt.sign({ exp }, JWT_SECRET);
  res.status(200).json({
    token,
    token_type: 'Bearer',
    expires_in,
  });
});

router.post('/refresh', (req, res, next) => {
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
