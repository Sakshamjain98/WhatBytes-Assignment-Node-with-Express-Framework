const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const v = require('../validators');
const { jwtSecret, jwtExpiresIn } = require('../config');

const withToken = (user) => ({
  user,
  token: jwt.sign({ sub: String(user.id) }, jwtSecret, { expiresIn: jwtExpiresIn }),
  expiresIn: jwtExpiresIn,
});

router.post('/register', async (req, res) => {
  const data = v.register.parse(req.body);
  const user = await User.create({ ...data, password: await bcrypt.hash(data.password, 10) });
  res.status(201).json(withToken(user));
});

router.post('/login', async (req, res) => {
  const { email, password } = v.login.parse(req.body);
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json(withToken(user));
});

module.exports = router;
