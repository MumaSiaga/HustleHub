const path = require('path');
const express = require('express');
const router = express.Router();
const { ensureAuth, redirectIfLoggedIn,redirectIfNotAdmin } = require('../middleware/authmiddleware');
const User = require('../model/User');
const Job = require("../model/job");

const bcrypt = require('bcrypt');
// const adminController = require('../controllers/adminController');

router.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(err => {
      if (err) console.error('Session destruction error:', err);
      res.redirect('/');
    });
  });
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).send('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Incorrect password');

    if (user.role !== 'admin') return res.status(403).send('Access denied: not an admin');

    req.session.user = user;
    res.status(200).send('Login successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


router.get('/setup', ensureAuth, (req, res) => {
  const user = req.user || req.session.user;

 if(user.role=='freelancer'){
   return res.redirect('/service/home');
 }

  res.render('setup', { username: user.username });
});
router.post('/setup', ensureAuth, async (req, res) => {
  const { role } = req.body;
  const user = req.user || req.session.user;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { role },
      { new: true }
    );
    return res.render('finish-profile',{role: updatedUser.role});
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).send('Error updating profile');
  }
});
router.post('/profile/complete',ensureAuth,async(req,res)=>{
  const user = req.user || req.session.user;
  const {location, skills, bio} = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { location, skills, about: bio },
      { new: true }
    );
    console.log(updatedUser);
    if (updatedUser.role=='freelancer') {
      return res.render('serviceHome', { user: updatedUser });
    }
    else if (updatedUser.role=='client') {
      const jobs = await Job.find({}); // Fetch all jobs for clients
      return res.render('employerhome', { user: updatedUser, jobs, smartSuggestions: []});
    }
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).send('Error updating profile');
  }

});




 

router.use('/', require('./authRoutes'));

module.exports = router;












