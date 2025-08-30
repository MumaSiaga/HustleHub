const express = require('express');
const router = express.Router();
const User=require('../model/User');

router.get('/home',async function(req,res){
    const user=await User.findById(req.user._id);
    res.render('serviceHome', { user });
});
router.get('/profile',function(req,res){
    res.render('serviceProfile');
});
router.get('/learning',function(req,res){
    res.render('learningHub');
});
router.get('/forum',function(req,res){
    res.render('forum.ejs');
})
module.exports = router;