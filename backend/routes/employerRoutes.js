const express = require('express');
const router = express.Router();

// Employer Home
router.get('/home', (req, res) => {
    res.render('employerhome');  
});

// Jobs Page
router.get('/jobs', (req, res) => {
    res.render('jobs');   // this will render jobs.ejs
});

// Messages Page
router.get('/messages', (req, res) => {
    res.render('messages'); // this will render messages.ejs
});

// Services Page
router.get('/services', (req, res) => {
    res.render('services'); // this will render services.ejs
});

// Payments Page
router.get('/payments', (req, res) => {
    res.render('payments'); // this will render payments.ejs
});

module.exports = router;
