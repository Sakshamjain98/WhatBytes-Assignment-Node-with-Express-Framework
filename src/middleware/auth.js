const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

module.exports = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.userId = Number(jwt.verify(token, jwtSecret).sub);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
