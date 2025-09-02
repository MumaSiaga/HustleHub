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