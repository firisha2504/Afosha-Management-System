# 📋 Quick Reference Card - Afosha MS

## 🔑 Login
- **Username**: `admin`
- **Password**: `Admin@123`
- **URL**: `http://localhost:5173`

---

## 💰 Payment Types (SEPARATE & INDEPENDENT)

### 1️⃣ Weekly Contribution Payment
- **Amount**: 50 ETB
- **When**: Every Saturday meeting
- **Page**: Weekly Contributions > Select Week > Record Payment

### 2️⃣ Penalty Payment
- **Amount**: 50 ETB per missed week
- **When**: Created automatically Sunday 1 AM for unpaid members
- **Page**: Penalties > Select Member > Pay Penalty

### ⚠️ IMPORTANT:
- Paying weekly contribution does **NOT** pay penalty
- Paying penalty does **NOT** pay weekly contribution
- Must pay them **separately**

---

## 📅 Weekly Payment Recording

### Step-by-Step:
1. Go to **Weekly Contributions** page
2. Select the **week** (defaults to most recent week with payments)
3. Find member in list
4. Click **Record Payment** button
5. Fill in details:
   - Amount: 50 ETB
   - Payment Method: Cash/Bank Transfer/Mobile Money
   - Reference (optional)
   - Notes (optional)
6. Click **Submit**
7. Status shows as **PENDING**
8. Admin verifies → Status changes to **VERIFIED**

---

## ⚖️ Penalty Payment Recording

### Step-by-Step:
1. Go to **Penalties** page
2. Select **member** from dropdown (only shows members with unpaid penalties)
3. View all their penalties (OUTSTANDING)
4. Click **Pay** button on specific penalty
5. Fill in payment details:
   - Amount: Must equal penalty amount (50 ETB)
   - Payment Method: Cash/Bank Transfer/Mobile Money
   - Reference (optional)
   - Notes (auto-filled)
6. Click **Pay Penalty**
7. Penalty status changes to **SETTLED**
8. Member disappears from dropdown (no more unpaid penalties)

---

## 🤝 Attendance vs Payment

### Attendance (Physical Presence)
- **Present**: Member attended meeting
- **Absent**: Member did not attend

### Payment (Financial Obligation)
- **Paid**: Member paid 50 ETB
- **Not Paid**: Member has not paid yet

### Scenarios:
- ✅ Member is **PRESENT** but **NOT PAID** → Will pay later
- ✅ Member is **ABSENT** but **PAID** → Sent payment remotely
- ✅ All members must pay regardless of attendance

---

## 📊 Dashboard Cards

### Green Cards (Income)
- **Weekly Contributions**: Verified weekly payments only
- **Special Contributions**: Special contribution payments
- **Paid Penalties**: Penalties that have been SETTLED or WAIVED

### Red Cards (Outstanding)
- **Unpaid Penalties**: Penalties still OUTSTANDING (not paid yet)

### Financial Summary
- **Formula**: Weekly Contributions + Special Contributions
- **Does NOT include**: Penalties (shown separately)

---

## 🔄 Automatic Jobs (Cron)

### Saturday 6:00 AM
- Creates weekly obligations for all active members

### Sunday 1:00 AM
- Creates penalties (50 ETB) for unpaid Saturday obligations
- Only for members who didn't pay previous week

### Daily Midnight
- Marks overdue obligations

### Friday 6:00 PM
- Sends meeting reminders (1 day before Saturday)

### Saturday 7:00 AM
- Sends morning meeting reminders + payment reminders

---

## 🎯 Common Tasks

### Record Attendance Only
1. Go to **Meetings** page
2. Create/Open meeting
3. Mark members as Present/Absent
4. Save

### Record Payment Only
1. Go to **Weekly Contributions** page
2. Select week
3. Record payment for member
4. Does NOT require attendance

### Pay Past Week's Contribution
1. Go to **Weekly Contributions** page
2. Select the past week from dropdown
3. Record payment normally

### Pay Multiple Penalties
1. Go to **Penalties** page
2. Select member
3. Pay each penalty individually (one at a time)

### Waive a Penalty (Admin Only)
1. Go to **Penalties** page
2. Select member with penalty
3. Click **Waive** button
4. Enter reason
5. Penalty status changes to **WAIVED**

---

## 🔍 Finding Payment History

### All Payments Tab
- Shows all payments (contributions + penalties)

### Weekly Contributions Tab
- Shows only weekly contribution payments
- Filter: Has `obligation` or notes contain "contribution"

### Penalty Payments Tab
- Shows only penalty payments
- Filter: No `obligation` + notes contain "penalty" or "Week"

---

## ⚠️ Troubleshooting

### "Member not in dropdown" (Penalties page)
- ✅ This is correct! Dropdown only shows members with OUTSTANDING penalties
- If member paid all penalties → They disappear from list

### "Week not showing" (Weekly Contributions)
- Page defaults to most recent week with verified payments
- Use dropdown to select any week manually

### "Payment not showing in History"
- Check the correct tab (All Payments / Weekly / Penalty)
- Verify payment was submitted successfully
- Refresh the page

---

## 📱 Commands to Start System

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd web
npm run dev
```

---

**Need Help?** Check these detailed guides:
- `ATTENDANCE_VS_PAYMENTS_GUIDE.md` - Attendance/Payment separation
- `HOW_TO_PAY_PENALTIES.md` - Penalty payment workflow
- `RECORD_FIROMSA_PAYMENT.md` - Step-by-step payment recording
- `ALL_FIXES_COMPLETE.md` - Complete technical documentation
