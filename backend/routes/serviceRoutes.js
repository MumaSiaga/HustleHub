const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authmiddleware');
const User=require('../model/User');

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
router.get('/forum',function(req,res){
    res.render('forum');
});
router.get('/feed',function(req,res){
    res.render('JobFeed');
});
router.get('/map',function(req,res){
    const MAP_KEY=process.env.MAP_KEY;
    res.render('map',{MAP_KEY});
});
module.exports = router;