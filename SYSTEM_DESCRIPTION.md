# Rehan Constructions - System Description

## Overview

**Rehan Constructions** is a web-based construction management system designed for construction businesses to track deals, manage workers, monitor material expenses, and generate financial reports. The system helps streamline operations for construction companies by centralizing project data, payments, and analytics in one dashboard.

---

## Key Features

### 1. **Authentication**
- Username and 10-digit mobile number login
- Auto-registration for new users (creates account on first login)
- Session-based authentication (redirects to login if not authenticated)
- Logout functionality

### 2. **Dashboard**
- Overview of key metrics: ongoing deals, advance collected, remaining balance
- Worker expenses and material expenses totals
- Total profit calculation
- Recent activity timeline
- Data refresh button

### 3. **Deals & Projects**
- Add and manage construction deals/projects
- Track: venue, customer name, date & timing, square footage, rate per square foot
- Auto-calculated project estimate and balance remaining
- Filter deals by period (week, month, year, custom range)
- Edit and delete deals (deleting a deal removes associated workers and materials)

### 4. **Worker Management**
- Add workers linked to specific projects
- Track paid amount and remaining amount per worker
- Filter workers by project
- Edit and delete worker records
- Running totals for paid, remaining, and total worker expenses

### 5. **Material Management**
- Add material expenses linked to projects
- Material types: Slab Plates, Column Prox, Column Pattern, Mixer Machine, Slab Gang
- Track quantity, rate per day, lease days
- Auto-calculated total amount and balance
- Filter by project
- Edit and delete material records

### 6. **Pending Balance**
- Overview of deal balance remaining, worker payment remaining, material payment remaining
- Detailed tables for each category showing items with outstanding balances

### 7. **Reports & Summaries**
- Financial summary report with deal value, advance, balance, worker expenses, material expenses, profit
- Filter by period and project
- Export to PDF
- Export to Excel

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend / Database | Firebase Realtime Database |
| Icons | Font Awesome 6.4 |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Excel Export | SheetJS (xlsx) |

---

## Project Structure

```
rehan-constructions/
├── index.html              # Landing page (home, services, features, contact)
├── login.html              # Login page
├── dashboard.html          # Main application (all management modules)
├── SYSTEM_DESCRIPTION.md   # This file
├── database.rules.json     # Firebase database rules and indexes
│
├── css/
│   ├── style.css           # Global styles
│   ├── dashboard.css       # Dashboard layout and components
│   └── responsive.css      # Mobile responsive styles
│
└── js/
    ├── firebase-config.js  # Firebase initialization
    ├── auth.js             # Authentication logic
    ├── utils.js            # Utility functions (formatting, filters)
    ├── dashboard.js        # Dashboard data loading and stats
    ├── deals.js            # Deals/projects CRUD
    ├── workers.js          # Worker management
    ├── materials.js        # Material expense management
    └── reports.js          # Reports generation and export
```

---

## How It Works

### Authentication Flow
1. User enters username and mobile number on login page
2. System checks if user exists in Firebase `users` collection
3. If exists and mobile matches → login success
4. If new user → creates account in Firebase and logs in
5. User data stored in sessionStorage; redirects to dashboard
6. Protected routes (dashboard) redirect to login if not authenticated

### Data Flow
- All data is stored in **Firebase Realtime Database**
- Data is partitioned by `userId` (each user sees only their own data)
- On dashboard load: fetches deals, workers, materials from Firebase
- Tables and stats update from this in-memory data
- CRUD operations write directly to Firebase and refresh local data

### Firebase Database Structure
```
/deals          - Project/deal records (venue, customer, amounts, userId)
/workers        - Worker payments (projectId, workerName, amounts, userId)
/materials      - Material expenses (projectId, type, quantities, amounts, userId)
/users          - User accounts (username, mobile)
```

---

## Business Information

- **Location:** 32 Shirala, Sangli, Maharashtra 416308
- **Contact:** Rehan Naikawadi | 9699554949
- **Email:** rehannaikawadi43@gmail.com
- **Hours:** Monday–Saturday 9:00 AM – 10:00 PM, Sunday Closed

---

## Setup Requirements

1. **Firebase Project:** Configure `js/firebase-config.js` with your Firebase project credentials
2. **Database Rules:** Deploy `database.rules.json` to Firebase Console (Database → Rules)
3. **Web Server:** Run via a local server (e.g., Live Server, `python -m http.server`) for proper routing
4. **Browser:** Modern browser with JavaScript enabled

---

## Usage

1. Open `index.html` or navigate to the site
2. Click **Login** or **Get Started**
3. Enter username and 10-digit mobile number
4. Access the dashboard and use the sidebar to navigate between modules
5. Use the refresh button (↻) to reload data from Firebase
