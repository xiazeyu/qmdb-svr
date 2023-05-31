const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SECRET_KEY;

const invalidRefreshTokens = new Map();

function checkRefreshTokenIsInvalid(refreshToken) {
  return invalidRefreshTokens.has(refreshToken);
}

function authorizationMalform(req, res, next) {
  if (!('Authorization' in req.header)) {
    // MissingAuthHeader: Authorization header ('Bearer token') not found
    req.authorized = false;
    return next();
  }

  if (!req.header.Authorization.match(/^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/)) {
    // MalformedJWT: Authorization header is malformed
    return res.status(401).json({
      error: true,
      message: 'Authorization header is malformed',
    });
  }

  const jwtToken = req.header.Authorization.replace(/^Bearer /, '');

  try {
    const decoded = jwt.verify(jwtToken, JWT_SECRET);
    // JWT token has expired
    if (checkRefreshTokenIsInvalid(jwtToken)) {
      return res.status(401).json({
        error: true,
        message: 'JWT token has expired',
      });
    }
    // Token successfully invalidated
    req.authorized = true;
    req.username = decoded.email;
    return next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      // JWT token has expired
      return res.status(401).json({
        error: true,
        message: 'JWT token has expired',
      });
    }
    // Invalid JWT token
    return res.status(401).json({
      error: true,
      message: 'Invalid JWT token',
    });
  }
}

function authorization(req, res, next) {

}

function deregisterRefreshToken(refreshToken, refreshExp) {
  invalidRefreshTokens.set(refreshToken, refreshExp);
}

function removeExpiredDeregisteredTokens() {
  const now = Math.floor(Date.now() / 1000);

  console.log('Checking for expired refresh tokens'); // eslint-disable-line no-console
  console.log(`There are ${invalidRefreshTokens.size} refresh tokens.`); // eslint-disable-line no-console

  invalidRefreshTokens.forEach((expiration, token) => {
    if (now >= expiration) {
      invalidRefreshTokens.delete(token);
    }
  });
}

// Periodically remove expired tokens every hour, 10 seconds for development
setInterval(removeExpiredDeregisteredTokens, process.env.env === 'development' ? 10 * 1000 : 60 * 60 * 1000);

module.exports = {
  authorizationMalform,
  authorization,
  deregisterRefreshToken,
  checkRefreshTokenIsInvalid,
};
