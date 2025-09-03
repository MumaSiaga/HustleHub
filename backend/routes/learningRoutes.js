const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authmiddleware');
const Course = require('../model/Course');
const Quiz = require('../model/Quiz');
const UserProgress = require('../model/UserProgress');
const User = require('../model/User');

// Display learning hub page
router.get('/learning', ensureAuth, async (req, res) => {
  try {
    const user = req.user || req.session.user;
    const courses = await Course.find().sort({ createdAt: -1 });
    
    // Get user progress for all courses
    const userProgress = await UserProgress.find({ userId: user._id });
    
    res.render('learningHub', { 
      user, 
      courses, 
      userProgress
    });
  } catch (error) {
    console.error('Error loading learning hub:', error);
    res.status(500).send('Error loading learning hub');
  }
});

// Take quiz for a course (direct access)
router.get('/course/:courseId/quiz', ensureAuth, async (req, res) => {
  try {
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
router.post('/course/:courseId/quiz/submit', ensureAuth, async (req, res) => {
  try {
    const { answers } = req.body;
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
    let userProgress = await UserProgress.findOne({
      userId: req.user._id,
      courseId: req.params.courseId
    });
    
    if (!userProgress) {
      userProgress = new UserProgress({
        userId: req.user._id,
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
      await User.findByIdAndUpdate(req.user._id, {
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

module.exports = router;
