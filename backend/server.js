const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Job = require('./models/Job');
const { auth, checkRole } = require('./middleware/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/jobportal')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const JWT_SECRET = 'MY_SECRET_KEY'; // In a real app, use process.env.JWT_SECRET

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register User
app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// JOB ROUTES
// ==========================================

// Get All Jobs (Public/Filtered)
app.get('/api/jobs', async (req, res) => {
  try {
    // Populate shows the employer name instead of just the ID
    const jobs = await Job.find().populate('employerId', 'name');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a Job (Employer Only)
app.post('/api/jobs', auth, checkRole(['employer']), async (req, res) => {
  try {
    const job = new Job({ ...req.body, employerId: req.user.id });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW ROUTE: Edit Job (Employer Only) ---
app.put('/api/jobs/:id', auth, checkRole(['employer']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    
    // Check ownership: Ensure the user trying to edit is the one who posted it
    if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to edit this job' });
    }

    // Update fields
    job.title = req.body.title || job.title;
    job.company = req.body.company || job.company;
    job.description = req.body.description || job.description;
    
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW ROUTE: Delete Job (Employer Only) ---
app.delete('/api/jobs/:id', auth, checkRole(['employer']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    // Check ownership
    if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    res.json({ msg: 'Job removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply for Job (Candidate Only)
app.post('/api/jobs/:id/apply', auth, checkRole(['candidate']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    
    // Check if already applied
    const alreadyApplied = job.applicants.find(app => app.candidateId.toString() === req.user.id);
    if (alreadyApplied) return res.status(400).json({ msg: 'Already applied' });

    job.applicants.push({ candidateId: req.user.id });
    await job.save();
    res.json({ msg: 'Application successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// Approve or Reject Job
app.put('/api/admin/jobs/:id', auth, checkRole(['admin']), async (req, res) => {
  const { status } = req.body; // Expects 'approved' or 'rejected'
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));