// middleware/auth.js
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded; // { user_id, role, email, name }
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: 'Not authorized - invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized - no token' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden - insufficient role' });
    }
    next();
  };
};

module.exports = { protect, restrictTo };