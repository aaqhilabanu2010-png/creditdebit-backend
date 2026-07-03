const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const router = express.Router();

// Frontend URL
const FRONTEND_URL = 'https://aaqhilabanu2010-png.github.io';

// @route   GET /auth/google
// @desc    Auth with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


// @route   GET /auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/creditdebit-frontend/?error=login_failed` }),
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
                    (function() {
                        const token = '${token}';
                        const frontendUrl = '${FRONTEND_URL}';
                        
                        // Try to send message to parent window
                        if (window.opener) {
                            window.opener.postMessage({ token: token }, frontendUrl);
                            // Also try with wildcard
                            window.opener.postMessage({ token: token }, '*');
                            setTimeout(function() {
                                window.close();
                            }, 500);
                        } else {
                            // Fallback: redirect directly
                            window.location.href = frontendUrl + '/creditdebit-frontend/dashboard?token=' + token;
                        }
                    })();
                </script>
                <p style="text-align: center; font-family: Arial; margin-top: 50px;">
                    Login successful! Closing window...
                </p>
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