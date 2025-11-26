# 💼 Job Portal System (MERN Stack)

`A full-stack Job Portal application built using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js). This system allows Employers to post and manage jobs, Admins to approve listing, and Candidates to browse and apply for opportunities.`

## 🚀 Features

### 🔐 Authentication & Roles
*   **User Registration & Login:** Secure authentication using JWT (JSON Web Tokens) and Bcrypt for password hashing.
*   **Role-Based Access Control (RBAC):**
    *   **Admin:** Can approve or reject job postings.
    *   **Employer:** Can post, edit, and delete their own job listings.
    *   **Candidate:** Can browse approved jobs and apply.

### 👨‍💼 Employer Features
*   Post new job opportunities.
*   Edit existing job details.
*   Delete job postings.
*   View status of posted jobs (Pending/Approved/Rejected).

### 👮 Admin Features
*   Dashboard view of all posted jobs.
*   Approve or Reject job postings to control visibility to candidates.

### 👨‍💻 Candidate Features
*   Browse a list of **Approved** jobs only.
*   Apply for jobs with a single click.
*   Visual confirmation of application status ("Applied ✅").
*   Prevents duplicate applications for the same job.

---

## 🛠️ Tech Stack

*   **Frontend:** React.js, React Router DOM, Axios, CSS3.
*   **Backend:** Node.js, Express.js.
*   **Database:** MongoDB, Mongoose ODM.
*   **Authentication:** JWT, BcryptJS.

---

## 📂 Project Structure

```text
/job-portal-system
  ├── /backend           # Node.js & Express Server
  │   ├── /models        # Mongoose Database Schemas
  │   ├── /middleware    # Auth & Role Verification
  │   └── server.js      # Main Server Entry Point
  │
  └── /frontend          # React Application
      ├── /src           # Components and Pages
      └── package.json   # Frontend Dependencies

📖 Usage Guide (How to Test)
Since the system relies on Role-Based Access, follow this flow to test all features:
Step 1: Employer Action
Register a new user and select Role: Employer.
Login.
Click "Post a Job", fill in the details, and submit.
You will see the job with a Pending (Yellow) badge.
Step 2: Admin Action
Register a new user and select Role: Admin.
Login.
You will see the job the Employer just posted.
Click Approve (Green Button). The status changes to Approved.
Step 3: Candidate Action
Register a new user and select Role: Candidate.
Login.
You will see the job (since it is now Approved).
Click Apply Now.
The button changes to Applied ✅.


