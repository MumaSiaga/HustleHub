const express = require('express');
const router = express.Router();
const User=require('../model/User');

router.get('/home',async function(req,res){
    const user=await User.findById(req.user._id);
    res.render('serviceHome', { user });
});
router.get('/profile',async function(req,res){
    const user=await User.findById(req.user._id);
    res.render('serviceProfile', { user });
});
router.get('/learning',function(req,res){
    res.render('learningHub');
});
router.get('/forum',function(req,res){
    res.render('forum.');
});
router.get('/feed',function(req,res){
    res.render('JobFeed');
});
router.get('/map',function(req,res){
    const MAP_KEY=process.env.MAP_KEY;
    res.render('map',{MAP_KEY});
})
module.exports = router;