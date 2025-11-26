// File: frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// --- 1. API CONFIGURATION ---
const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Add token to requests automatically
API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = localStorage.getItem('token');
  }
  return req;
});

// --- 2. NAVBAR COMPONENT ---
const Navbar = ({ user, logout }) => {
  return (
    <nav className="navbar">
      <h2>JobPortal</h2>
      <div className="nav-links">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <span>Hello, {user.name} ({user.role})</span>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

// --- 3. AUTH FORM COMPONENT (Login/Register) ---
const AuthForm = ({ type, setUser }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'register') {
        await API.post('/register', formData);
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        const { data } = await API.post('/login', { email: formData.email, password: formData.password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'An error occurred');
    }
  };

  return (
    <div className="auth-form" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h3>{type === 'register' ? 'Create Account' : 'Welcome Back'}</h3>
      <form onSubmit={handleSubmit}>
        {type === 'register' && (
          <div className="form-group">
            <input 
              placeholder="Full Name" 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
            />
          </div>
        )}
        <div className="form-group">
          <input 
            placeholder="Email Address" 
            type="email" 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
        </div>
        <div className="form-group">
          <input 
            placeholder="Password" 
            type="password" 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />
        </div>
        {type === 'register' && (
          <div className="form-group">
            <select onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="candidate">Candidate</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}
        <button className="btn">{type === 'register' ? 'Sign Up' : 'Sign In'}</button>
      </form>
    </div>
  );
};

// --- 4. DASHBOARD COMPONENT (Main Logic) ---
const Dashboard = ({ user }) => {
  const [jobs, setJobs] = useState([]);
  
  // State for the form
  const [formData, setFormData] = useState({ title: '', description: '', company: '' });
  const [editingId, setEditingId] = useState(null); // Tracks if we are editing a specific job

  const fetchJobs = async () => {
    try {
      const { data } = await API.get('/jobs');
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  // Handle Form Submit (Create OR Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing job
        await API.put(`/jobs/${editingId}`, formData);
        alert('Job Updated Successfully');
        setEditingId(null);
      } else {
        // Create new job
        await API.post('/jobs', formData);
        alert('Job Posted! Pending Approval.');
      }
      setFormData({ title: '', description: '', company: '' }); // Clear form
      fetchJobs();
    } catch (err) {
      alert('Error saving job');
    }
  };

  // Populate form for editing
  const startEditing = (job) => {
    setFormData({ title: job.title, description: job.description, company: job.company });
    setEditingId(job._id);
    window.scrollTo(0, 0); // Scroll to top to see form
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await API.delete(`/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      alert('Error deleting job');
    }
  };

  const handleApply = async (jobId) => {
    try {
      await API.post(`/jobs/${jobId}/apply`);
      alert('Applied successfully!');
      fetchJobs(); // Refresh to update button state
    } catch (err) {
      alert(err.response?.data?.msg || 'Error applying');
    }
  };

  const handleStatusChange = async (jobId, status) => {
    try {
      await API.put(`/admin/jobs/${jobId}`, { status });
      fetchJobs();
    } catch (err) {
      alert('Error updating status');
    }
  };

  return (
    <div className="container">
      {/* EMPLOYER FORM SECTION */}
      {user.role === 'employer' && (
        <div className="job-form">
          <h3>{editingId ? 'Edit Job' : 'Post a New Opportunity'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input 
                placeholder="Job Title" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required
              />
            </div>
            <div className="form-group">
              <input 
                placeholder="Company Name" 
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})} 
                required
              />
            </div>
            <div className="form-group">
              <textarea 
                placeholder="Job Description" 
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                required
              />
            </div>
            <button type="submit" className="btn">
              {editingId ? 'Update Job' : 'Post Job'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setFormData({title:'', company:'', description:''}); }}
                style={{ marginTop: '10px', backgroundColor: '#666', width: '100%', padding: '0.75rem', color: 'white', border: 'none' }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      )}

      {/* JOB LISTINGS SECTION */}
      <h2>Job Listings</h2>
      <div className="dashboard-grid">
        {jobs.map(job => {
          // Candidates only see approved jobs
          if (user.role === 'candidate' && job.status !== 'approved') return null;

          // Check if current logged-in employer owns this job
          // (Handles both populated object or just ID string)
          const isOwner = user.role === 'employer' && 
            (job.employerId === user.id || job.employerId?._id === user.id);

          // Check if candidate has applied
          const hasApplied = user.role === 'candidate' && job.applicants.some(app => app.candidateId === user.id);

          return (
            <div key={job._id} className="job-card">
              <div>
                <h3>{job.title}</h3>
                <p className="company">{job.company}</p>
                <p>{job.description}</p>
                <span className={`status-badge status-${job.status}`}>
                  Status: {job.status}
                </span>
              </div>

              <div style={{ marginTop: '1rem' }}>
                {/* CANDIDATE ACTIONS */}
                {user.role === 'candidate' && (
                   <button 
                     onClick={() => !hasApplied && handleApply(job._id)} 
                     className="btn"
                     disabled={hasApplied}
                     style={hasApplied ? { background: 'grey', cursor: 'not-allowed' } : {}}
                   >
                     {hasApplied ? 'Applied ✅' : 'Apply Now'}
                   </button>
                )}

                {/* ADMIN ACTIONS */}
                {user.role === 'admin' && (
                  <div className="admin-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleStatusChange(job._id, 'approved')} className="btn" style={{ background: 'green' }}>Approve</button>
                    <button onClick={() => handleStatusChange(job._id, 'rejected')} className="btn" style={{ background: 'red' }}>Reject</button>
                  </div>
                )}

                {/* EMPLOYER ACTIONS (Edit/Delete) */}
                {isOwner && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button 
                      onClick={() => startEditing(job)} 
                      style={{ flex: 1, padding: '5px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(job._id)} 
                      style={{ flex: 1, padding: '5px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && <p>No jobs available at the moment.</p>}
      </div>
    </div>
  );
};

// --- 5. APP COMPONENT (Routing) ---
const App = () => {
  const [user, setUser] = useState(null);

  // Check for logged in user on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Navbar user={user} logout={logout} />
      <Routes>
        <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/login" element={<AuthForm type="login" setUser={setUser} />} />
        <Route path="/register" element={<AuthForm type="register" />} />
      </Routes>
    </Router>
  );
};

export default App;