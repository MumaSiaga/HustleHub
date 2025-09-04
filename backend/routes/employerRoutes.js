const express = require('express');
const router = express.Router();
const Job = require("../model/job");
const User=require('../model/User');
const ForumPost = require('../model/forum');
const Chat=require('../model/chat')
const getCityFromCoordinates = require('../middleware/reverseGeo');
const { ensureAuth } = require('../middleware/authmiddleware');

////////////////////////////////////////////////////////////////////////////////////
const Product = require("../model/Product");
const multer = require("multer");
const path = require("path");


const fs = require('fs');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/uploads"
    if (!fs.existsSync(uploadDir)){fs.mkdirSync(uploadDir, { recursive: true });} 
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/////////////////////////////////////////////////////////////////////////////

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
    res.redirect("/employer/marketplace");
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
    res.redirect("/employer/marketplace");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product");
  }
});

/////////////////////////////////////////////////////////////////////////////

router.get("/marketplace", ensureAuth, async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("seller", "username email")
      .sort({ createdAt: -1 });
    res.render("marketplace", { products, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading marketplace");
  }
});

// Employer Home
// Employer Home
router.get('/home', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.render('employerhome', { jobs: [], smartSuggestions: [] });
    }

    // Extract emails from user's contacts
    const contactEmails = user.contacts.map(c => c.email).filter(e => e);

    // Find employer IDs for these emails
    const employerIds = await User.find({ email: { $in: contactEmails } }).distinct('_id');

    // Find jobs posted by these employers (for smart suggestions only)
    const jobsByContacts = await Job.find({ employerid: { $in: employerIds } });

    // Fetch freelancers who were hired for jobs
    const freelancers = await User.find({ role: 'freelancer', 'appliedJobs.status': 'hired' })
                                  .populate('appliedJobs.job');

    // Filter freelancers who were hired for jobs by employers in contact list
    const smartSuggestions = freelancers.filter(f =>
      f.appliedJobs.some(a =>
        jobsByContacts.some(job => a.job && a.job._id.equals(job._id))
      )
    );

    // ✅ Fetch only this employer's jobs for stats
    const jobs = await Job.find({ employerid: req.user._id });

    res.render('employerhome', {
      jobs,
      smartSuggestions
    });
  } catch (err) {
    console.error("❌ Error loading home:", err);
    res.render('employerhome', { jobs: [], smartSuggestions: [] });
  }
});

// Messages Page
router.get('/messages',ensureAuth, (req, res) => {
    res.redirect('/chat'); // this will render messages.ejs
});



// Payments Page
router.get('/payments',ensureAuth, (req, res) => {
    res.render('payments'); // this will render payments.ejs
});




// routes/employer.js
// POST create or update job
router.post("/jobs", ensureAuth, async (req, res) => {
  try {
    const { id, title, description, salary, contact, latitude, longitude } = req.body;
    const employer = req.user._id;

    let updateData = { 
      title, 
      description, 
      salary, 
      contact, 
      employerid: employer // ✅ always save employerid
    };

    if (latitude && longitude) {
      const location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      const city = await getCityFromCoordinates(latitude, longitude);
      updateData.location = location;
      updateData.city = city;
    }

    if (id) {
      await Job.findByIdAndUpdate(id, updateData);
    } else {
      if (!latitude || !longitude) {
        return res.status(400).send("Location required for new jobs");
      }
      const location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      const city = await getCityFromCoordinates(latitude, longitude);

      const job = new Job({
        title,
        description,
        salary,
        contact,
        location,
        city,
        employerid: employer // ✅ save employerid
      });
      await job.save();
    }

    res.redirect("/employer/jobs");
  } catch (error) {
    console.error("❌ Error posting/updating job:", error);
    res.status(500).send("Error posting/updating job");
  }
});


// Hire applicant and ensure chat is properly populated
router.post("/jobs/:jobId/hire/:applicantId",ensureAuth ,async (req, res) => {
  try {


    const { jobId, applicantId } = req.params;
    const employerId = req.user._id;
 

    // 1. Find the job
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).send("Job not found");
 

    // 2. Find the applicant subdocument
    const applicant = job.applicants.id(applicantId);
    if (!applicant) return res.status(404).send("Applicant not found");
    

    // 3. Update status to "hired"
    applicant.status = "hired";
    await job.save();

  
    let chat = await Chat.findOne({
      job: job._id,
      participants: { $all: [employerId, applicant.user] }
    });

    if (!chat) {
      chat = new Chat({
        job: job._id,
        participants: [employerId, applicant.user],
        messages: []
      });
      await chat.save();
      
    } else {
     
    }

    // 5. Populate participants so EJS can read names & profileImages
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name profileImage')
      .populate('messages.sender', 'name profileImage'); // optional

    // 6. Redirect to chat page
    res.redirect(`/chat/${chat._id}`);
  } catch (error) {
    res.status(500).send("Error hiring applicant");
  }
});
// GET all jobs for logged-in employer only
router.get("/jobs", ensureAuth, async (req, res) => {

  try {
    const jobs = await Job.find({ employerid: req.user._id }); // ✅ FIXED
    res.render("jobs", { jobs });
  } catch (error) {
    console.error("❌ Error loading jobs:", error);
    res.status(500).send("Error loading jobs");
  }
});




router.get("/applicants",ensureAuth, async (req, res) => {
  try {
    const jobs=await Job.find({employerid:req.user._id});
    res.render("applicants", { jobs });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading applicants");
  }
});

// // GET single job for viewing
// router.get("/jobs/view/:id", async (req, res) => {
//   try {
//     const job = await Job.findById(req.params.id);
//     if (!job) return res.status(404).send("Job not found");

//     // Dummy applicants data
//     const applicants = [
//       { name: "Alice Smith", email: "alice@example.com", submittedAt: "2025-09-01" },
//       { name: "Bob Johnson", email: "bob@example.com", submittedAt: "2025-09-02" },
//       { name: "Charlie Lee", email: "charlie@example.com", submittedAt: "2025-09-03" }
//     ];

//     res.render("job_view", { job, applicants });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error fetching job");
//   }
// });


// DELETE job
router.post("/jobs/delete/:id",ensureAuth ,async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.redirect("/employer/jobs");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting job");
  }
});



router.get("/chat/:chatId", ensureAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate("participants", "name profileImage")
      .populate("messages.sender", "name profileImage");

    if (!chat) return res.status(404).send("Chat not found");

    res.render("employerMessages", { chat });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading chat");
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
    res.redirect(`/employer/${chat._id}`);
  } catch (err) {
    // Handle duplicate key error in case of race condition
    if (err.code === 11000) {
      // Use sellerId (already in scope) instead of product.seller
      const participants = [req.user._id.toString(), sellerId.toString()].sort();
      const chat = await Chat.findOne({
        product: req.params.productId,
        participants
      });
      return res.redirect(`/employer/${chat._id}`);
    }

    console.error(err);
    res.status(500).send("Error opening chat");
  }
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

    res.render('employer_forum', { user, posts });
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
    res.redirect('/employer/forum');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Add comment
router.post('/forum/comment/:postId',ensureAuth ,async (req, res) => {
  try {
    const { content } = req.body;
    const post = await ForumPost.findById(req.params.postId);
    post.comments.push({ content, author: req.user._id });
    await post.save();
    res.redirect('/employer/forum');  // Redirect to correct route
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// 1. List all freelancers (must be **before** the :id route)
router.get('/services',ensureAuth, async (req, res) => {
  try {
    const freelancers = await User.find({ role: 'freelancer' });
    res.render('services', { freelancers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 2. Freelancer profile page
router.get('/services/:id',ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'freelancer') {
      return res.status(404).send('Freelancer not found');
    }

    res.render('viewProfile', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// ------------------ MARKETPLACE ------------------

// Show all products
// Show all products
router.get("/marketplace", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("seller", "username"); // ✅ get seller info

    res.render("marketplace", { products, user: req.user || null }); // ✅ pass logged in user
  } catch (error) {
    console.error("❌ Error loading products:", error);
    res.render("marketplace", { products: [], user: req.user || null });
  }
});


// Add new product with image upload
// Add new product with image upload
router.post(
  "/marketplace",
  ensureAuth,
  upload.single("image"),   // ✅ FIX: attach multer here
  async (req, res) => {
    try {
      const { name, description, price, category, condition } = req.body;

      // Create a new product and attach the seller ID
      const newProduct = new Product({
        name,
        description,
        price,
        category,
        condition,
        seller: req.user._id
      });

      // Handle image if uploaded
      if (req.file) {
        newProduct.imageUrl = `/uploads/${req.file.filename}`; // ✅ save relative path
      }

      await newProduct.save();
      res.redirect("/employer/marketplace");
    } catch (error) {
      console.error("❌ Error creating product:", error);
      res.redirect("/employer/marketplace");
    }
  }
);



router.post("/marketplace/delete/:id", ensureAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    // Check if logged-in user is the creator
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).send("You are not allowed to delete this product");
    }

    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/employer/marketplace");
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).send("Error deleting product");
  }
});

// GET Edit Product Form (no user check)
router.get("/marketplace/edit/:id", ensureAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).send("You are not allowed to edit this product");
    }

    res.render("edit_product", { product });
  } catch (err) {
    console.error("❌ Error loading edit product form:", err);
    res.status(500).send("Server error");
  }
});


// POST update product (no user check)
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
    res.redirect("/employer/marketplace");
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).send("Server error");
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
    res.render('employerMessages', { chats, chat: null, currentUserId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



// GET single chat
// GET single chat
// GET single chat
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

    res.render('employerMessages', { chats, chat, currentUser, otherUser, currentUserId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post("/:id", ensureAuth, async (req, res) => {
  try {


    const user=User.findById(req.user.id);
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).send("Not authorized to delete this chat");
    }


    await Chat.findByIdAndDelete(chatId);

    res.redirect("/employer/chat");
    




  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting chat");
  }
});

module.exports = router;
