const express = require('express');
const router = express.Router();
const User=require('../model/User');
const ForumPost = require('../model/forum');

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
router.get('/feed',function(req,res){
    res.render('JobFeed');
});
router.get('/map',function(req,res){
    const MAP_KEY=process.env.MAP_KEY;
    res.render('map',{MAP_KEY});
});

// Forum page
router.get('/forum', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Fetch posts with author and comment authors populated
    const posts = await ForumPost.find({})
      .sort({ createdAt: -1 })
      .populate('author', 'username') // post author
      .populate('comments.author', 'username'); // comment authors

    res.render('forum', { user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Add new post
router.post('/forum/post', async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = new ForumPost({
      title,
      content,
      author: req.user._id
    });
    await post.save();
    res.redirect('/service/forum');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Add comment
router.post('/forum/comment/:postId', async (req, res) => {
  try {
    const { content } = req.body;
    const post = await ForumPost.findById(req.params.postId);
    post.comments.push({ content, author: req.user._id });
    await post.save();
    res.redirect('/forum');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;