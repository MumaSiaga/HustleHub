const express = require('express');
const router = express.Router();

router.get('/home',function(req,res){
    res.render('serviceHome');
});
router.get('/profile',function(req,res){
    res.render('serviceProfile');
});
router.get('/learning',function(req,res){
    res.render('learningHub');
});
module.exports = router;