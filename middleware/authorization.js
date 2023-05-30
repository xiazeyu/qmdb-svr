const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SECRET_KEY;

module.exports = (req, res, next) => {
  if (!('Authorization' in req.header) || !req.header.Authorization.match(/^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/)) {
    res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
    return;
  }

  const jwtToken = req.header.Authorization.replace(/^Bearer /, '');

  try {
    const token = jwt.verify(jwtToken, JWT_SECRET);
    req.username = token.name;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      res.status(401).json({ error: true, message: 'JWT token has expired' });
    } else {
      res.status(401).json({ error: true, message: 'Invalid JWT token' });
    }
  }
};
