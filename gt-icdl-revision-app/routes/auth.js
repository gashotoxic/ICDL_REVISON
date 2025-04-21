const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const saltRounds = 10;
const path = require('path');

// Configure Passport
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE googleId = ?', [profile.id], (err, row) => {
        if (err) return reject(err);
        
        if (row) {
          return resolve(row);
        }
        
        // Create new user
        db.run(
          'INSERT INTO users (googleId, email, name) VALUES (?, ?, ?)',
          [profile.id, profile.emails[0].value, profile.displayName],
          function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, googleId: profile.id, email: profile.emails[0].value });
          }
        );
      });
    });
    
    done(null, user);
  } catch (error) {
    done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// Serve login page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/login.html'));
});

// Serve registration page
router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/register.html'));
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/login' }),
  (req, res) => {
    // Successful authentication, redirect home
    res.redirect('/');
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if username already exists
    const userExists = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });

    if (userExists) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(query, [username, hashedPassword], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Registration failed' });
      }
      res.status(201).json({ id: this.lastID });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Basic authentication routes
router.post('/login', (req, res) => {
    // Implement basic login logic here
    res.json({ message: 'Login endpoint' });
});

router.post('/register', (req, res) => {
    // Implement basic registration logic here
    res.json({ message: 'Register endpoint' });
});

router.get('/logout', (req, res) => {
    // Implement logout logic here
    res.json({ message: 'Logout endpoint' });
});

module.exports = router;