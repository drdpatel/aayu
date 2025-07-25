const bcrypt = require('bcryptjs');

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  // If it's an API request, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Otherwise redirect to login
  res.redirect('/login');
};

// Middleware to check if user is already authenticated
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  next();
};

// Verify admin credentials
const verifyAdminCredentials = async (username, password) => {
  const adminUsername = process.env.ADMIN_USERNAME || 'doctor';
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  
  if (!adminPasswordHash) {
    throw new Error('Admin password not configured. Please run the setup script.');
  }
  
  if (username !== adminUsername) {
    return false;
  }
  
  return await bcrypt.compare(password, adminPasswordHash);
};

module.exports = {
  ensureAuthenticated,
  redirectIfAuthenticated,
  verifyAdminCredentials
};