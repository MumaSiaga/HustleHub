const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authmiddleware');
const User=require('../model/User');
const ForumPost = require('../model/forum');
const Job = require('../model/job');
const Product =require('../model/Product');
const multer = require("multer");
const path = require("path");
const Chat=require('../model/chat')

// Multer storage
const fs = require('fs');

////////////////////////////////////////////////////////////////////////////////////////////



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "public/uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Show all products
router.get("/marketplace", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("seller", "username"); 
    res.render("serviceMarket", { products, user: req.user || null });
  } catch (error) {
    console.error("❌ Error loading products:", error);
    res.render("serviceMarket", { products: [], user: req.user || null });
  }
});

// Add new product with image upload
router.post("/marketplace", ensureAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, category, condition } = req.body;

    if (!name || !description || !price || !category || !condition) {
      return res.status(400).send("All fields are required");
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      condition,
      seller: req.user._id
    });

    if (req.file) {
      newProduct.imageUrl = `/uploads/${req.file.filename}`;
    }

    await newProduct.save();
    res.redirect("/service/marketplace");
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).send("Error creating product");
  }
});

// Delete product
router.post("/marketplace/delete/:id", ensureAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).send("You are not allowed to delete this product");
    }

    await Product.findByIdAndDelete(req.params.id);

    if (product.imageUrl) {
      const filePath = path.join(__dirname, "../public", product.imageUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete image:", err);
      });
    }

    res.redirect("/service/marketplace");
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).send("Error deleting product");
  }
});

// Get Edit Product Form
router.get("/marketplace/edit/:id", ensureAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).send("You are not allowed to edit this product");
    }

    res.render("edit_product", { product });
  } catch (error) {
    console.error("❌ Error loading edit product form:", error);
    res.status(500).send("Server error");
  }
});
router.post("/:productId/chat", ensureAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const buyerId = req.user._id;

    // 1. Find product
    const product = await Product.findById(productId).populate("seller", "name profileImage");
    if (!product) return res.status(404).send("Product not found");

    const sellerId = product.seller._id;

    // Prevent user from chatting with themselves
    if (buyerId.toString() === sellerId.toString()) {
      return res.status(400).send("You cannot chat with yourself");
    }

    // 2. Sort participant IDs consistently
    const participants = [buyerId.toString(), sellerId.toString()].sort();

    // 3. Try to find existing chat
    let chat = await Chat.findOne({
      product: product._id,
      participants
    });

    // 4. If no chat exists, create a new one
    if (!chat) {
      chat = new Chat({
        product: product._id,
        participants,
        messages: []
      });
      await chat.save();
    }

    // 5. Populate participants and message senders for EJS
    chat = await Chat.findById(chat._id)
      .populate("participants", "name profileImage")
      .populate("messages.sender", "name profileImage");

    // 6. Redirect to chat page
    res.redirect(`/service/${chat._id}`);
  } catch (err) {
    // Handle duplicate key error in case of race condition
    if (err.code === 11000) {
      // Use sellerId (already in scope) instead of product.seller
      const participants = [req.user._id.toString(), sellerId.toString()].sort();
      const chat = await Chat.findOne({
        product: req.params.productId,
        participants
      });
      return res.redirect(`/service/${chat._id}`);
    }

    console.error(err);
    res.status(500).send("Error opening chat");
  }
});







// Update product
router.post("/marketplace/edit/:id", ensureAuth, upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).send("You are not allowed to update this product");
    }

    const { name, description, price, category, condition } = req.body;

    product.name = name;
    product.description = description;
    product.price = price;
    product.category = category;
    product.condition = condition;

    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
    }

    await product.save();
    res.redirect("/service/marketplace");
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).send("Server error");
  }
});



///////////////////////////////////////////////////////////////////////////////




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
router.get('/chat',ensureAuth ,async (req, res) => {
  const currentUserId = req.user._id; // logged-in user ID

  try {
    // Fetch all chats for the current user
    const chats = await Chat.find({ participants: currentUserId })
      .populate('participants', 'username profileImage')  // include username
      .populate('messages.sender', 'username profileImage') // include sender username
      .sort({ updatedAt: -1 });

    // Pass `chat: null` to prevent ReferenceError in EJS
    res.render('chats', { chats, chat: null, currentUserId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


router.get('/:chatId',ensureAuth ,async (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user._id;

  try {
    // Fetch all chats for sidebar
    const chats = await Chat.find({ participants: currentUserId })
      .populate('participants', 'username profileImage')
      .populate('messages.sender', 'username profileImage')
      .sort({ updatedAt: -1 });

    // Fetch the selected chat
    const chat = await Chat.findById(chatId)
      .populate('participants', 'username profileImage')
      .populate('messages.sender', 'username profileImage');

    if (!chat) return res.status(404).send('Chat not found');

    // Find other participant
    const otherUser = chat.participants.find(p => p._id.toString() !== currentUserId.toString());

    // Fetch current user
    const currentUser = await User.findById(currentUserId);

    res.render('chats', { chats, chat, currentUser, otherUser, currentUserId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post("/:id", ensureAuth, async (req, res) => {
  try {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).send("Not authorized to delete this chat");
    }


    await Chat.findByIdAndDelete(chatId);

    res.redirect("/chat");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting chat");
  }
});

module.exports = router;
