const express = require('express');
const { verifyAdminCredentials, redirectIfAuthenticated } = require('../middleware/auth');
const router = express.Router();

// Login route
router.post('/login', redirectIfAuthenticated, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const isValid = await verifyAdminCredentials(username, password);
    
    if (isValid) {
      req.session.authenticated = true;
      req.session.username = username;
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({ 
    authenticated: !!req.session.authenticated,
    username: req.session.username || null
  });
});

module.exports = router;