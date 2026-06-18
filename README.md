# 🏢 Afosha Management System

A comprehensive member management system for weekly contributions, penalties, attendance tracking, and financial management.

---

## 🚀 Quick Start

### First Time Setup
1. **Start Backend**: 
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   cd web
   npm install
   npm run dev
   ```

3. **Access System**: 
   - URL: `http://localhost:5173`
   - Username: `admin`
   - Password: `Admin@123`

📖 **Detailed Instructions**: See [`START_HERE.md`](START_HERE.md)

---

## 📚 Documentation Index

### 🎯 For Users & Administrators
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference card for daily operations
- **[START_HERE.md](START_HERE.md)** - Getting started guide
- **[LOGIN_GUIDE.md](LOGIN_GUIDE.md)** - How to access the system
- **[ATTENDANCE_VS_PAYMENTS_GUIDE.md](ATTENDANCE_VS_PAYMENTS_GUIDE.md)** - Understanding attendance vs payments
- **[HOW_TO_PAY_PENALTIES.md](HOW_TO_PAY_PENALTIES.md)** - Penalty payment workflow
- **[PENALTY_PAYMENT_FLOWCHART.md](PENALTY_PAYMENT_FLOWCHART.md)** - Visual payment workflow
- **[RECORD_FIROMSA_PAYMENT.md](RECORD_FIROMSA_PAYMENT.md)** - Step-by-step payment recording
- **[HOW_TO_PAY_PAST_WEEKS.md](HOW_TO_PAY_PAST_WEEKS.md)** - Paying for past weeks
- **[ADMIN_DASHBOARD_PENALTIES_GUIDE.md](ADMIN_DASHBOARD_PENALTIES_GUIDE.md)** - Dashboard penalties guide

### 💻 For Developers & Technical Team
- **[ALL_FIXES_COMPLETE.md](ALL_FIXES_COMPLETE.md)** - Complete technical documentation of all fixes
- **[SESSION_SUMMARY_FINAL.md](SESSION_SUMMARY_FINAL.md)** - Final session summary
- **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** - Pre-deployment checklist
- **[ALL_FIXES_SUMMARY.md](ALL_FIXES_SUMMARY.md)** - Summary of fixes
- **[ALL_FIXES_TODAY.md](ALL_FIXES_TODAY.md)** - Today's fixes
- **[ALL_ISSUES_FIXED.md](ALL_ISSUES_FIXED.md)** - Issues resolution log

---

## 🎯 Key Features

### ✅ Payment Management
- **Weekly Contributions**: 50 ETB per member per week
- **Special Contributions**: One-time special contributions
- **Penalty Payments**: Separate 50 ETB penalties for unpaid weeks
- **Payment History**: Complete transaction tracking

### ✅ Penalty System
- **Automatic Creation**: Sunday 1 AM for unpaid Saturday obligations
- **Independent Payments**: Penalties paid separately from contributions
- **Smart Filtering**: Only shows members with outstanding penalties
- **Waive Option**: Admin can waive penalties with reason

### ✅ Dashboard & Reports
- **Unpaid Penalties**: Red card showing outstanding penalties
- **Paid Penalties**: Green card showing settled/waived penalties
- **Financial Summary**: Weekly + Special contributions (penalties separate)
- **Member Statistics**: Active/pending/rejected member counts

### ✅ Attendance Tracking
- **Independent System**: Attendance ≠ Payment
- **Meeting Management**: Saturday meetings tracked separately
- **Flexible Recording**: Can record attendance without payment and vice versa

---

## 🔑 Important Concepts

### 💡 Attendance vs Payment
**These are COMPLETELY SEPARATE:**
- **Attendance** = Physical presence at meeting (Present/Absent)
- **Payment** = Financial obligation (50 ETB weekly)

**Scenarios:**
- Member can be PRESENT but NOT PAY (will pay later)
- Member can be ABSENT but STILL PAY (sent payment remotely)
- Everyone must pay regardless of attendance

📖 **Full Explanation**: See [`ATTENDANCE_VS_PAYMENTS_GUIDE.md`](ATTENDANCE_VS_PAYMENTS_GUIDE.md)

### 💡 Payment Types (Independent)
**Two separate payment systems:**
1. **Weekly Contributions** - Regular 50 ETB weekly payments
2. **Penalties** - 50 ETB penalties for missed weeks

**Important:**
- Paying weekly contribution does NOT pay penalty
- Paying penalty does NOT pay weekly contribution
- Must be paid separately

📖 **Full Workflow**: See [`HOW_TO_PAY_PENALTIES.md`](HOW_TO_PAY_PENALTIES.md)

---

## 📅 Automatic Jobs (Cron)

| Time | Day | Job | Description |
|------|-----|-----|-------------|
| 6:00 AM | Saturday | Create Obligations | Create weekly obligations for all members |
| 7:00 AM | Saturday | Morning Reminders | Send meeting & payment reminders |
| 6:00 PM | Friday | Meeting Reminders | Send reminder 1 day before meeting |
| **1:00 AM** | **Sunday** | **Create Penalties** | Create penalties for unpaid Saturday obligations ⚠️ CRITICAL |
| 12:00 AM | Daily | Mark Overdue | Mark overdue obligations |
| 2:00 AM | Daily | Backup | Create database backup |

---

## 🗂️ Project Structure

```
Afosha MS/
├── backend/                 # Backend API (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation, upload
│   │   ├── jobs/           # Cron jobs (penalty creation)
│   │   └── config/         # Configuration
│   ├── prisma/             # Database schema & migrations
│   └── scripts/            # Admin utility scripts
│
├── web/                     # Frontend (React + TypeScript + Vite)
│   └── src/
│       ├── pages/          # Main application pages
│       ├── components/     # Reusable components
│       └── lib/            # Utilities & API client
│
└── Documentation Files      # This folder (root)
```

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Language**: TypeScript
- **Jobs**: node-cron

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router
- **HTTP Client**: Axios

---

## 📊 System Status

### Production Readiness: ✅ 100%

#### Completed Features (10/10):
1. ✅ Penalty payment system separated from weekly contributions
2. ✅ Automatic penalty creation (Sunday 1 AM job)
3. ✅ Dashboard unpaid/paid penalties separated
4. ✅ Financial summary excludes penalties
5. ✅ Weekly contributions default week selection
6. ✅ History page penalty tab detection
7. ✅ Penalties page member dropdown filtering
8. ✅ Transaction reset script
9. ✅ Comprehensive documentation
10. ✅ Production code cleanup (no debug logs)

#### Quality Assurance:
- ✅ All features tested
- ✅ Debug logs removed
- ✅ Business rules implemented
- ✅ Cron jobs scheduled
- ✅ Documentation complete

---

## 🎓 Common Tasks

### Record Weekly Payment
1. Go to **Weekly Contributions** page
2. Select week from dropdown
3. Find member, click **Record Payment**
4. Enter 50 ETB, select method, submit
5. Admin verifies payment

### Pay Penalty
1. Go to **Penalties** page
2. Select member with outstanding penalty
3. Click **Pay** button on penalty
4. Enter 50 ETB (must equal penalty amount)
5. Submit - penalty marked as SETTLED

### View Payment History
1. Go to **History** page
2. Use tabs to filter:
   - **All Payments** - Everything
   - **Weekly Contributions** - Only contribution payments
   - **Penalty Payments** - Only penalty payments

### Pay Past Week's Contribution
1. Go to **Weekly Contributions** page
2. Select past week from dropdown
3. Record payment normally (no special process)

📖 **Detailed Instructions**: See [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md)

---

## 🔧 Admin Scripts

Located in `backend/`:

### Penalty Management
```bash
# Create penalties for specific week
npx tsx create-penalties-week26.ts

# Check week 26 data
npx tsx scripts/check-week26.ts

# Apply missing penalties
npx tsx scripts/apply-missing-penalties.ts
```

### Database Management
```bash
# Reset transactions only (keep members)
npx tsx reset-transactions.ts

# Full database reset (⚠️ DESTRUCTIVE)
npx tsx reset-database.ts

# Fix amount paid issues
npx tsx scripts/fix-amount-paid.ts

# Fix balance issues
npx tsx fix-balance.ts
```

---

## 🚨 Troubleshooting

### Member not showing in Penalties dropdown
✅ **This is correct!** Dropdown only shows members with OUTSTANDING penalties.
If member paid all penalties, they disappear from list.

### Week not showing in Weekly Contributions
Page defaults to most recent week with verified payments.
Use dropdown to manually select any week.

### Payment not showing in History
- Check correct tab (All / Weekly / Penalty)
- Verify payment was submitted successfully
- Refresh the page (Ctrl + F5)

### No console errors but page blank
- Verify backend is running (port 5000)
- Verify frontend is running (port 5173)
- Check browser console for network errors

📖 **More Help**: See [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md) Troubleshooting section

---

## 📞 Support

### Documentation Questions
Check the relevant guide from the documentation index above.

### Technical Issues
See [`ALL_FIXES_COMPLETE.md`](ALL_FIXES_COMPLETE.md) for technical details.

### Deployment Help
See [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) for deployment steps.

---

## 📝 License

This project is proprietary software developed for Afosha organization.

---

## 🎉 Version History

### v1.0.0 - June 17, 2026
- ✅ All 10 tasks completed
- ✅ Production-ready release
- ✅ Complete documentation
- ✅ Clean codebase (no debug logs)

---

**Last Updated**: June 17, 2026 (Wednesday)  
**Status**: ✅ Production Ready  
**All Tasks**: 10/10 Complete
