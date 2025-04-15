# Payroll System - Backend

This is the backend of the Payroll System built with **Node.js**, **Express**, and **MySQL**. It handles user authentication, attendance tracking, leave management, payslip generation, and calendar event scheduling.

## 📁 Project Structure

├── config/ 
    # Database and environment config
├── controller/
    # Route handlers
├── middleware/
    # JWT auth and role-based access control
├── models/
    # Sequelize models  
├── routes/ 
    # API routes
├── services/
    # Business logic layer
├── utils/
    # Utility functions
├── app.js
    # Express app setup
└── server.js #


## 🔐 Authentication

- JWT-based login and session management
- Email verification
- Password reset
- Role-based access control (`admin`, `employee`)
- Two-phase sign-up with address fields (`Country`, `City/State`, `Postal Code`)

## 👥 Employees

- Create, read, update, and delete employee accounts
- View and edit employee meta, address, and info cards
- Admins can view all users; employees can only view their own info

## 🕒 Attendance Management

Supports four employment types:
- Regular
- Part-time
- Open shift
- Apprenticeship

Features:
- Single table design with employment type reference
- Records both time-in and time-out for the same day
- Logs actions for each shift (viewable in frontend)
- Remarks and status updates with modals and confirmation prompts

## 📅 Leave Management

- Submit leave requests with:
  - Type (sick, vacation, etc.)
  - Action (file, cancel)
  - Units, Date filed, Reason, Status
- Admin view to manage all employee leaves
- Editable remarks and status highlights

## 💰 Payslip

- Generate payslips based on attendance and other metrics
- View payslip history per employee
- UI styled similar to Open Shifts frontend

## 📆 Calendar Events

- FullCalendar integration
- API to add, edit, delete events
- Events include: title, color, start & end dates
- Notification dropdown displays upcoming events

## 📦 API Endpoints (Summary)

- `/api/auth` – Register, login, verify, reset password
- `/api/employees` – Manage employee records
- `/api/attendance` – Record and update attendance logs
- `/api/leaves` – Submit and update leave requests
- `/api/payslips` – Fetch and generate payslips
- `/api/calendar` – Manage calendar events

## 🛠️ Tech Stack

- Node.js + Express
- MySQL (via Sequelize ORM)
- JWT Authentication
- Nodemailer (email notifications)
- RESTful API design

## 🚀 Setup Instructions

```bash
# Install dependencies
npm install

# Start the server
npm run start:dev
