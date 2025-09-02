const express = require('express');
const router = express.Router();
const Job = require("../model/job");
const User=require('../model/User');
const ForumPost = require('../model/forum');



// Employer Home
router.get('/home', async (req, res) => {
    try {
        // Fetch all jobs
        const jobs = await Job.find();

        // Render employerhome.ejs and pass jobs
        res.render('employerhome', { jobs });
    } catch (error) {
        console.error("❌ Error loading employer home:", error);
        res.render('employerhome', { jobs: [] }); // fallback
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


// POST a new job or update existing job
router.post("/jobs", async (req, res) => {
  try {
    const { id, title, description, location, salary, contact } = req.body;

    if (id) {
      // Update existing job
      await Job.findByIdAndUpdate(id, { title, description, location, salary, contact });
    } else {
      // Create new job
      const job = new Job({ title, description, location, salary, contact });
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

// GET single job for viewing
router.get("/jobs/view/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).send("Job not found");

    // Dummy applicants data
    const applicants = [
      { name: "Alice Smith", email: "alice@example.com", submittedAt: "2025-09-01" },
      { name: "Bob Johnson", email: "bob@example.com", submittedAt: "2025-09-02" },
      { name: "Charlie Lee", email: "charlie@example.com", submittedAt: "2025-09-03" }
    ];

    res.render("job_view", { job, applicants });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching job");
  }
});


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


module.exports = router;
