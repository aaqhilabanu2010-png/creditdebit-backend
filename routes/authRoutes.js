const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const router = express.Router();

// Frontend URL - change this to your GitHub Pages URL
const FRONTEND_URL = 'https://aaqhilabanu2010-png.github.io/creditdebit-frontend';
const BACKEND_URL = 'https://creditdebit-backend-production-abd7.up.railway.app';

// @route   GET /auth/google
// @desc    Auth with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


// @route   GET /auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/?error=login_failed` }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Return HTML that sends token to parent window and closes
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Success</title>
            </head>
            <body>
                <script>
                    // Send token to parent window
                    if (window.opener) {
                        window.opener.postMessage({ token: '${token}' }, '${FRONTEND_URL}');
                        window.close();
                    } else {
                        // Fallback: redirect with token
                        window.location.href = '${FRONTEND_URL}/dashboard?token=${token}';
                    }
                </script>
                <p>Login successful! Closing window...</p>
            </body>
            </html>
        `);
    }
);

// @route   GET /auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                photoURL: req.user.photoURL
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /auth/logout
// @desc    Logout user
// @access  Public
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

module.exports = router;