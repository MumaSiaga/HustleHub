const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authmiddleware');
const User=require('../model/User');
const ForumPost = require('../model/forum');
const Job = require('../model/job');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../model/Product");
// const marketplace = require('./backend/routes/marketRoute');


/////////////////////////////////////////////////////////////////////////////////////////


// --- Multer storage ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/uploads/"
    if (!fs.existsSync(uploadDir)){fs.mkdirSync(uploadDir, { recursive: true });}
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// --- Post new product ---
router.post("/marketplace", ensureAuth, upload.single("image"), async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      condition: req.body.condition,
      seller: req.user._id,
    });

    if(req.file){
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    await product.save();
    res.redirect("/employer/marketplace");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error posting product");
  }
});

// --- Edit product (only owner) ---
router.post("/marketplace/edit/:id", ensureAuth, upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).send("Product not found");
    if (product.seller.toString() !== req.user._id.toString())
      return res.status(403).send("Not authorized");

    // Update fields
    product.name = req.body.name;
    product.description = req.body.description;
    product.price = req.body.price;
    product.category = req.body.category;
    product.condition = req.body.condition;

    if (req.file) {
      product.imageUrl = `/uploads/products/${req.file.filename}`;
    }

    await product.save();
    res.redirect("/service/marketplace");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error editing product");
  }
});

// --- Delete product (only owner) ---
router.post("/marketplace/delete/:id", ensureAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).send("Product not found");
    
    if (product.seller.toString() !== req.user._id.toString())
      return res.status(403).send("Not authorized");


        // ✅ Delete image from disk if it exists and isn't a placeholder
    if (product.imageUrl && !product.imageUrl.startsWith("http")) {
      // Build the full path
      const imagePath = path.join(__dirname, "..", product.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // delete file
      }
    }


    await product.deleteOne();
    res.redirect("/service/marketplace");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product");
  }
});



/////////////////////////////////////////////////////////////////////////////////////////


// Service Home
router.get('/home', ensureAuth, async function(req, res) {
    try {
        const user = req.user || req.session.user;

        // Populate applied jobs so they are available in EJS
        const userData = await User.findById(user._id)
  .populate('appliedJobs.job') // populate the job inside each appliedJobs object
  .exec();



        res.render('serviceHome', { user: userData });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading service home");
    }
});
router.get("/marketplace", ensureAuth, async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("seller", "username email")
      .sort({ createdAt: -1 });
    res.render("serviceMarket", { products, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading marketplace");
  }
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

router.get('/feed',ensureAuth, async (req, res) => {
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
router.get('/map',ensureAuth,function(req,res){
    const MAP_KEY=process.env.MAP_KEY;
    res.render('map',{MAP_KEY});
});


// Forum page
router.get('/forum',ensureAuth, async (req, res) => {
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
router.post('/forum/post',ensureAuth, async (req, res) => {
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
router.post('/forum/comment/:postId',ensureAuth, async (req, res) => {
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
router.post('/nearby-jobs',ensureAuth, async (req, res) => {
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


router.post('/jobs/apply/:jobId', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const jobId = req.params.jobId;
    console.log(jobId);
    const alreadyApplied = user.appliedJobs.some(a => a.job.toString() === jobId);
    console.log(alreadyApplied);
    if (!alreadyApplied) {
       const job = await Job.findById(jobId);
const applicant = {
  user: user._id, 
  name: user.username,
  email: user.email,
  skills: user.skills,
  location: user.location,
  status: "pending"
};
    job.applicants.push(applicant);
    await job.save();

      user.appliedJobs.push({ job: jobId, status: 'pending' }); // add with status
      await user.save();
    }

    res.redirect('/service/home');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error applying for job");
  }
});


module.exports = router;
