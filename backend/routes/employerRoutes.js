const express = require('express');
const router = express.Router();
const Job = require("../model/job");
const User=require('../model/User');
const ForumPost = require('../model/forum');
const getCityFromCoordinates = require('../middleware/reverseGeo');
const Product = require("../model/Product");
const multer = require("multer");
const path = require("path");
const { ensureAuth } = require('../middleware/authmiddleware');

// Multer storage
const fs = require('fs');

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "public/uploads/";
    // Check if folder exists; if not, create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });





// Employer Home
router.get('/home', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.render('employerhome', { jobs: [], smartSuggestions: [] });
    }

    // Extract emails from user's contacts
    const contactEmails = user.contacts.map(c => c.email).filter(e => e);

    // Find employer IDs for these emails
    const employerIds = await User.find({ email: { $in: contactEmails } }).distinct('_id');

    // Find jobs posted by these employers
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

    // Fetch all jobs for stats
    const jobs = await Job.find();

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
router.get('/messages', (req, res) => {
    res.render('messages'); // this will render messages.ejs
});



// Payments Page
router.get('/payments', (req, res) => {
    res.render('payments'); // this will render payments.ejs
});




// routes/employer.js
// routes/employer.js
router.post("/jobs", async (req, res) => {
  try {
    const { id, title, description, salary, contact, latitude, longitude } = req.body;

    let updateData = { title, description, salary, contact };

    // Only if new coordinates were provided
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
      // Update existing job
      await Job.findByIdAndUpdate(id, updateData);
    } else {
      // Create new job (must have location!)
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
        city
      });
      await job.save();
    }

    res.redirect("/employer/jobs");
  } catch (error) {
    console.error("❌ Error posting/updating job:", error);
    res.status(500).send("Error posting/updating job");
  }
});




// GET all jobs
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.render("jobs", { jobs });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading jobs");
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
router.post("/jobs/delete/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.redirect("/employer/jobs");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting job");
  }
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

    res.render('employer_forum', { user, posts });
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
    res.redirect('/employer/forum');
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
    res.redirect('/employer/forum');  // Redirect to correct route
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// 1. List all freelancers (must be **before** the :id route)
router.get('/services', async (req, res) => {
  try {
    const freelancers = await User.find({ role: 'freelancer' });
    res.render('services', { freelancers });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 2. Freelancer profile page
router.get('/services/:id', async (req, res) => {
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
router.post("/marketplace", ensureAuth, async (req, res) => {
  try {
    const { name, description, price, category, condition } = req.body;

    // Create a new product and attach the seller ID
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      condition,
      seller: req.user._id // <-- This stores the current user's ID
    });

    // Handle image if uploaded
    if (req.file) {
      newProduct.imageUrl = `/uploads/${req.file.filename}`;
    }

    await newProduct.save();

    res.redirect("/employer/marketplace");
  } catch (error) {
    console.error("Error creating product:", error);
    res.redirect("/employer/marketplace");
  }
});


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


module.exports = router;
