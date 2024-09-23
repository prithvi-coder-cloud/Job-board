// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  companyLogo: { type: String }, // Will store the file path or URL
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  salaryType: { type: String, required: true },
  jobLocation: { type: String, required: true },
  postingDate: { type: Date, required: true },
  experienceLevel: { type: String, required: true },
  employmentType: { type: String, required: true },
  description: { type: String, required: true }
});

module.exports = mongoose.model('Job', jobSchema);
