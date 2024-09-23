// routes/jobs.js
const express = require('express');
const multer = require('multer');
const Job = require('../models/Job');
const router = express.Router();

// Multer setup for file upload (companyLogo)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// POST route to add a new job
router.post('/add-job', upload.single('companyLogo'), async (req, res) => {
  try {
    const { companyName, jobTitle, minPrice, maxPrice, salaryType, jobLocation, postingDate, experienceLevel, employmentType, description } = req.body;

    // Create a new job instance
    const newJob = new Job({
      companyName,
      jobTitle,
      companyLogo: req.file ? req.file.path : '', // Storing the path of uploaded logo
      minPrice,
      maxPrice,
      salaryType,
      jobLocation,
      postingDate,
      experienceLevel,
      employmentType,
      description
    });

    // Save to the database
    await newJob.save();
    res.status(201).json({ message: 'Job posted successfully!', job: newJob });
  } catch (error) {
    res.status(500).json({ error: 'Error posting job', details: error.message });
  }
});

module.exports = router;
