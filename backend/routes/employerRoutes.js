const express = require('express');
const router = express.Router();
const Job = require("../model/Job");

// Employer Home
router.get('/home', (req, res) => {
    res.render('employerhome');  
});



// Messages Page
router.get('/messages', (req, res) => {
    res.render('messages'); // this will render messages.ejs
});

// Services Page
router.get('/services', (req, res) => {
    res.render('services'); // this will render services.ejs
});

// Payments Page
router.get('/payments', (req, res) => {
    res.render('payments'); // this will render payments.ejs
});

//Community forum page
router.get('/forum', (req, res) => {
    res.render('employer_forum'); // this will render forum.ejs
});

// POST a new job or update existing job
router.post("/jobs", async (req, res) => {
  try {
    const { id, title, description, location, salary } = req.body;

    if (id) {
      // Update existing job
      await Job.findByIdAndUpdate(id, { title, description, location, salary });
    } else {
      // Create new job
      const job = new Job({ title, description, location, salary });
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






module.exports = router;
