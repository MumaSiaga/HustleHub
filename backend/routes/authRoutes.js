const express = require('express');
const User = require('../model/User');
const passport = require('passport');
const { ensureAuth, redirectIfLoggedIn } = require('../middleware/authmiddleware');
const router = express.Router();


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    if (!req.user.role) {
      return res.redirect('/setup');
    }

    if (req.user.role === 'freelancer') {
      return res.redirect('/service/home');
    } else if (req.user.role === 'client') {
      return res.redirect('/freelancer/home');
    }

  }
);
router.get('/', redirectIfLoggedIn, (req, res) => {
  res.render('landing'); 
});

router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('login');
});




module.exports = router;
