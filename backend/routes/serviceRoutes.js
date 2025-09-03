const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authmiddleware');
const User=require('../model/User');
const ForumPost = require('../model/forum');
const Job = require('../model/Job');

router.get('/home', ensureAuth, async function(req,res){
    const user = req.user || req.session.user;
    const userData = await User.findById(user._id);
    res.render('serviceHome', { user: userData });
});
router.get('/profile', ensureAuth, async function(req,res){
    const user = req.user || req.session.user;
    const userData = await User.findById(user._id);
    res.render('serviceProfile', { user: userData });
});
router.get('/learning', ensureAuth, async function(req,res){
    try {
        const Course = require('../model/Course');
        const courses = await Course.find().sort({ createdAt: -1 });
        res.render('learningHub', { courses });
    } catch (error) {
        console.error('Error loading courses:', error);
        res.render('learningHub', { courses: [] });
    }
});

router.get('/feed', async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // current user
    const jobs = await Job.find({}).sort({ createdAt: -1 }); // newest first
    res.render('JobFeed', { user, jobs });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }


// Take quiz for a course
router.get('/quiz/:courseId', ensureAuth, async function(req,res){
    try {
        const Course = require('../model/Course');
        const Quiz = require('../model/Quiz');
        
        const course = await Course.findById(req.params.courseId);
        const quiz = await Quiz.findOne({ courseId: req.params.courseId });
        
        if (!course || !quiz) {
            return res.status(404).send('Course or quiz not found');
        }
        
        res.render('quiz', { course, quiz });
    } catch (error) {
        console.error('Error loading quiz:', error);
        res.status(500).send('Error loading quiz');
    }
});

// Submit quiz answers
router.post('/quiz/:courseId/submit', ensureAuth, async function(req,res){
    try {
        const { answers } = req.body;
        const Course = require('../model/Course');
        const Quiz = require('../model/Quiz');
        const UserProgress = require('../model/UserProgress');
        const User = require('../model/User');
        
        const course = await Course.findById(req.params.courseId);
        const quiz = await Quiz.findOne({ courseId: req.params.courseId });
        
        if (!course || !quiz) {
            return res.status(404).send('Course or quiz not found');
        }
        
        // Calculate score
        let correctAnswers = 0;
        quiz.questions.forEach((question, index) => {
            if (answers[index] && parseInt(answers[index]) === question.correctAnswer) {
                correctAnswers++;
            }
        });
        
        const score = Math.round((correctAnswers / quiz.questions.length) * 100);
        const passed = score >= quiz.passingScore;
        
        // Update user progress
        const user = req.user || req.session.user;
        let userProgress = await UserProgress.findOne({
            userId: user._id,
            courseId: req.params.courseId
        });
        
        if (!userProgress) {
            userProgress = new UserProgress({
                userId: user._id,
                courseId: req.params.courseId
            });
        }
        
        userProgress.quizCompleted = true;
        userProgress.quizScore = score;
        userProgress.passed = passed;
        userProgress.completedAt = new Date();
        
        // Award certificate if passed
        if (passed && !userProgress.certificateEarned) {
            userProgress.certificateEarned = true;
            
            // Add certificate to user profile
            await User.findByIdAndUpdate(user._id, {
                $addToSet: { certifications: `${course.title} Certificate` }
            });
        }
        
        await userProgress.save();
        
        res.json({ 
            success: true, 
            score, 
            passed, 
            certificateEarned: userProgress.certificateEarned,
            courseTitle: course.title
        });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ success: false, error: 'Error submitting quiz' });
    }
});


});
router.get('/map',function(req,res){
    const MAP_KEY=process.env.MAP_KEY;
    res.render('map',{MAP_KEY});
});


// Forum page
router.get('/forum', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Fetch posts with post author and comment authors populated
    const posts = await ForumPost.find({})
      .sort({ createdAt: -1 })
      .populate('author', 'username')            // post author
      .populate('comments.author', 'username');  // comment authors

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
    res.redirect('/service/forum');  // Redirect to correct route
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// Nearby jobs based on current coordinates
router.post('/nearby-jobs', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Coordinates required' });
        }

        // Find jobs within 15 km
        const nearbyJobs = await Job.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: 15000 // 15 km
                }
            }
        }).limit(5);

        res.json(nearbyJobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;