# 🔍 How PARTIAL Payment Works - System Logic

## 🎯 How System Determines Payment Status

The system automatically calculates the payment status based on **how much was paid** compared to **how much is owed**.

---

## 💻 System Logic (Automatic)

```typescript
Total Due = 50 ETB (weekly obligation)
Amount Paid = member's payment

IF Amount Paid >= Total Due (50 ETB)
   → Status = PAID ✅

ELSE IF Amount Paid > 0 AND Amount Paid < Total Due
   → Status = PARTIAL 🔵

ELSE IF Amount Paid = 0
   → Status = PENDING ⏳
```

---

## 📊 Real Examples

### Example 1: Full Payment (PAID)
```
Week obligation: 50 ETB
Member pays: 50 ETB
System calculates: 50 >= 50 → TRUE
Status: PAID ✅
```

### Example 2: Partial Payment (PARTIAL)
```
Week obligation: 50 ETB
Member pays: 30 ETB
System calculates: 30 < 50 AND 30 > 0 → TRUE
Status: PARTIAL 🔵
Remaining: 20 ETB
```

### Example 3: Another Partial Payment (PARTIAL)
```
Week obligation: 50 ETB
Member pays: 10 ETB
System calculates: 10 < 50 AND 10 > 0 → TRUE
Status: PARTIAL 🔵
Remaining: 40 ETB
```

### Example 4: No Payment (PENDING)
```
Week obligation: 50 ETB
Member pays: 0 ETB
System calculates: 0 = 0 → TRUE
Status: PENDING ⏳
```

### Example 5: Overpayment (PAID)
```
Week obligation: 50 ETB
Member pays: 70 ETB
System calculates: 70 >= 50 → TRUE
Status: PAID ✅
Extra 20 ETB may go to next week or special contribution
```

---

## 🔄 How Admin Records Partial Payment

### Step-by-Step Process:

1. **Admin goes to Weekly Contributions page**
2. **Finds member with PENDING obligation** (50 ETB due)
3. **Clicks "Record Payment" button**
4. **Enters the actual amount member paid** (e.g., 30 ETB)
5. **Selects payment method** (Cash/Bank/Mobile)
6. **Submits payment**

### What Happens Automatically:

```
System receives: 30 ETB payment
System checks obligation: 50 ETB total due

Calculation:
- Amount paid so far: 0 ETB (first payment)
- New total paid: 0 + 30 = 30 ETB
- Total due: 50 ETB
- Remaining: 50 - 30 = 20 ETB

Status Logic:
- Is 30 >= 50? NO
- Is 30 > 0? YES
- Therefore: Status = PARTIAL 🔵
```

---

## 🎯 Multiple Partial Payments

Member can pay in multiple installments!

### Scenario:
**Week 25 Obligation: 50 ETB**

#### Payment 1 (Monday):
```
Amount paid: 20 ETB
Total paid so far: 0 + 20 = 20 ETB
Status: PARTIAL (20/50 paid)
Remaining: 30 ETB
```

#### Payment 2 (Wednesday):
```
Amount paid: 15 ETB
Total paid so far: 20 + 15 = 35 ETB
Status: PARTIAL (35/50 paid)
Remaining: 15 ETB
```

#### Payment 3 (Friday):
```
Amount paid: 15 ETB
Total paid so far: 35 + 15 = 50 ETB
Status: PAID ✅ (50/50 paid)
Remaining: 0 ETB
```

---

## 📱 How to Check Current Status

### In Weekly Contributions Page:

Each member row shows:
- **Contribution**: 50 ETB (what they owe)
- **Paid**: 30 ETB (what they paid so far)
- **Status**: PARTIAL (automatic calculation)
- **Outstanding**: 20 ETB (remaining balance)

---

## 🔍 Database Tracking

### What System Stores:

```javascript
WeeklyObligation {
  amount: 50,           // Total due
  amountPaid: 30,       // Amount paid so far
  status: "PARTIAL",    // Auto-calculated
  totalDue: 50          // Total including penalties if any
}
```

### How Status is Calculated:

```typescript
const newPaid = currentAmountPaid + newPayment;
const totalDue = obligation.totalDue;

if (newPaid >= totalDue) {
  status = "PAID";           // Full payment
} else if (newPaid > 0) {
  status = "PARTIAL";        // Partial payment
} else {
  status = "PENDING";        // No payment yet
}
```

---

## ⚠️ Important Notes

### 1️⃣ **Status is AUTOMATIC**
- Admin does NOT manually select "PARTIAL"
- Admin only enters the **amount** member paid
- System automatically calculates the status

### 2️⃣ **Any Amount Between 1 and 49 ETB = PARTIAL**
- Payment of 1 ETB → PARTIAL
- Payment of 25 ETB → PARTIAL
- Payment of 49 ETB → PARTIAL
- Payment of 50 ETB → PAID

### 3️⃣ **Multiple Payments Add Up**
- First payment: 20 ETB → PARTIAL (20/50)
- Second payment: 20 ETB → PARTIAL (40/50)
- Third payment: 10 ETB → PAID (50/50)

### 4️⃣ **Outstanding Balance Tracks Remaining**
- Member's outstanding balance shows ALL unpaid amounts
- Includes partial payments from all weeks
- Updates automatically with each payment

---

## 📋 Admin Workflow Example

### Real-World Scenario:

**Saturday Meeting:**
- **Firomsa Abdi** owes 50 ETB for Week 26
- He only brought 35 ETB today

**Admin Steps:**

1. Opens **Weekly Contributions** page
2. Selects **Week 26, 2026**
3. Finds **Firomsa Abdi** in list (status: PENDING)
4. Clicks **"Record Payment"** button
5. Enters:
   - Amount: **35** (not 50!)
   - Method: Cash
   - Notes: "Partial payment, will pay remaining 15 ETB next week"
6. Clicks **Submit**

**System Updates Automatically:**
```
Before:
- Contribution: 50 ETB
- Paid: 0 ETB
- Status: PENDING
- Outstanding: 50 ETB

After:
- Contribution: 50 ETB
- Paid: 35 ETB
- Status: PARTIAL ✅ (automatically changed!)
- Outstanding: 15 ETB
```

**Next Week:**
- Firomsa pays remaining 15 ETB
- Admin records: 15 ETB payment
- System updates: Status → PAID ✅

---

## 🎯 Summary

### How System Knows It's PARTIAL:

1. ✅ Admin enters amount member actually paid (e.g., 30 ETB)
2. ✅ System compares to total due (50 ETB)
3. ✅ System sees: 30 < 50 AND 30 > 0
4. ✅ System automatically sets status to PARTIAL
5. ✅ System tracks remaining: 50 - 30 = 20 ETB

**No manual selection needed!** The system is smart enough to calculate the status based on the payment amount. 🎉

---

## 💡 Key Takeaway

**Admin's Job:**
- Enter the **actual amount** member paid (honest recording)

**System's Job:**
- Calculate if it's PAID, PARTIAL, or PENDING (automatic)
- Track remaining balance (automatic)
- Update outstanding balance (automatic)

**The admin NEVER manually selects "PARTIAL"** - the system determines it automatically based on the math! 🧮

---

**Last Updated**: June 18, 2026  
**Status Calculation**: Fully Automatic ✅
