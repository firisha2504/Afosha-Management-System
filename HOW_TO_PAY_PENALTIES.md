# How to Pay Penalties - Step by Step Guide

## 🎯 Overview

This guide shows you exactly how to use the penalty payment system with real examples and screenshots of what you'll see.

---

## 📋 Prerequisites

Before you start:
1. ✅ Backend server must be running
2. ✅ You must be logged in as ADMIN or AUDITOR
3. ✅ You need the member's ID or be logged in as a member

---

## 🚀 Step-by-Step: How It Works

### Step 1: Start the Backend Server

```bash
# Navigate to backend folder
cd "c:\Users\MyPC\Desktop\Afosha MS\backend"

# Start the server
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Database connected
```

---

### Step 2: Get Your Authentication Token

First, login to get your token:

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "abc-123",
      "username": "admin",
      "role": "ADMIN"
    }
  }
}
```

💡 **Save the token** - You'll use it in all other requests!

---

### Step 3: View a Member's Penalties

Now see what penalties a member has:

```bash
GET http://localhost:5000/api/penalties/member/MEMBER-ID-HERE
Authorization: Bearer YOUR-TOKEN-HERE
```

**Example with real data:**
```bash
GET http://localhost:5000/api/penalties/member/cm123abc456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response You'll Get:**
```json
{
  "success": true,
  "data": [
    {
      "id": "penalty-uuid-1",
      "memberId": "cm123abc456",
      "amount": "50.00",
      "reason": "Penalty for missed weekly contribution",
      "weekNumber": 24,
      "year": 2026,
      "isMonthly": false,
      "status": "OUTSTANDING",
      "paidAt": null,
      "createdAt": "2026-06-07T10:00:00.000Z"
    },
    {
      "id": "penalty-uuid-2",
      "memberId": "cm123abc456",
      "amount": "50.00",
      "reason": "Penalty for missed weekly contribution",
      "weekNumber": 25,
      "year": 2026,
      "isMonthly": false,
      "status": "OUTSTANDING",
      "paidAt": null,
      "createdAt": "2026-06-14T10:00:00.000Z"
    },
    {
      "id": "penalty-uuid-3",
      "memberId": "cm123abc456",
      "amount": "200.00",
      "reason": "Monthly penalty for 4 consecutive missed weeks",
      "weekNumber": 26,
      "year": 2026,
      "isMonthly": true,
      "status": "OUTSTANDING",
      "paidAt": null,
      "createdAt": "2026-06-21T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

**What This Tells You:**
- Member has **3 penalties**
- Week 24: 50 Birr (OUTSTANDING)
- Week 25: 50 Birr (OUTSTANDING)
- Week 26: 200 Birr - Monthly penalty (OUTSTANDING)
- Total penalties: **300 Birr**

---

### Step 4: Choose Which Penalty to Pay

Let's say the member wants to pay **Week 25 penalty only** (50 Birr).

From the response above, we need:
- **Penalty ID**: `penalty-uuid-2`
- **Amount**: `50.00`

---

### Step 5: Pay the Specific Penalty

```bash
POST http://localhost:5000/api/penalties/pay
Authorization: Bearer YOUR-TOKEN-HERE
Content-Type: application/json

{
  "penaltyId": "penalty-uuid-2",
  "amount": 50.00,
  "paymentMethod": "CASH",
  "transactionReference": "TXN20260614001",
  "notes": "Payment for Week 25 penalty"
}
```

**Real Example:**
```bash
POST http://localhost:5000/api/penalties/pay
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "penaltyId": "penalty-uuid-2",
  "amount": 50.00,
  "paymentMethod": "CASH"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment-uuid-abc",
      "paymentId": "PAY-2026-001234",
      "memberId": "cm123abc456",
      "amount": "50.00",
      "paymentMethod": "CASH",
      "transactionReference": "TXN20260614001",
      "status": "PENDING",
      "receiptNumber": "RCP-2026-001234",
      "notes": "Penalty payment for Week 25, 2026",
      "paymentDate": "2026-06-14T15:30:00.000Z",
      "member": {
        "fullName": "Ahmed Hassan",
        "memberId": "AMS-001"
      },
      "recordedBy": {
        "username": "admin"
      }
    },
    "penalty": {
      "id": "penalty-uuid-2",
      "memberId": "cm123abc456",
      "amount": "50.00",
      "reason": "Penalty for missed weekly contribution",
      "weekNumber": 25,
      "year": 2026,
      "isMonthly": false,
      "status": "SETTLED",
      "paidAt": "2026-06-14T15:30:00.000Z",
      "createdAt": "2026-06-14T10:00:00.000Z"
    }
  },
  "message": "Penalty payment recorded successfully"
}
```

✅ **What Happened:**
- Week 25 penalty is now **SETTLED**
- Receipt number generated: **RCP-2026-001234**
- Member's balance reduced by **50 Birr**
- Payment recorded in system
- Member notified via notification

---

### Step 6: Verify the Payment

Check the member's penalties again:

```bash
GET http://localhost:5000/api/penalties/member/cm123abc456
Authorization: Bearer YOUR-TOKEN-HERE
```

**Updated Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "penalty-uuid-1",
      "weekNumber": 24,
      "amount": "50.00",
      "status": "OUTSTANDING"  ⏳
    },
    {
      "id": "penalty-uuid-2",
      "weekNumber": 25,
      "amount": "50.00",
      "status": "SETTLED",  ✅
      "paidAt": "2026-06-14T15:30:00.000Z"
    },
    {
      "id": "penalty-uuid-3",
      "weekNumber": 26,
      "amount": "200.00",
      "status": "OUTSTANDING"  ⏳
    }
  ]
}
```

**Perfect!** Only Week 25 is paid. Week 24 and 26 are still outstanding.

---

## 🔄 Common Scenarios

### Scenario 1: Member Wants to Pay Multiple Penalties

**Option A: Pay them one by one**
```bash
# Pay Week 24
POST /api/penalties/pay
{ "penaltyId": "penalty-uuid-1", "amount": 50.00, "paymentMethod": "CASH" }

# Then pay Week 25
POST /api/penalties/pay
{ "penaltyId": "penalty-uuid-2", "amount": 50.00, "paymentMethod": "CASH" }
```

**Option B: Pay in any order you want**
```bash
# Pay Week 26 first (the monthly penalty)
POST /api/penalties/pay
{ "penaltyId": "penalty-uuid-3", "amount": 200.00, "paymentMethod": "BANK_TRANSFER" }

# Then pay Week 24
POST /api/penalties/pay
{ "penaltyId": "penalty-uuid-1", "amount": 50.00, "paymentMethod": "CASH" }
```

---

### Scenario 2: Member Viewing Their Own Penalties

If you're logged in as a MEMBER:

```bash
GET http://localhost:5000/api/penalties/my
Authorization: Bearer MEMBER-TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "penalty-uuid-1",
      "amount": "50.00",
      "reason": "Penalty for missed weekly contribution",
      "weekNumber": 24,
      "year": 2026,
      "status": "OUTSTANDING"
    }
  ]
}
```

💡 Members can **view** their penalties but cannot **pay** them directly. Only ADMIN/AUDITOR can record payments.

---

### Scenario 3: Admin Waives a Penalty

Sometimes you want to forgive a penalty:

```bash
PATCH http://localhost:5000/api/penalties/penalty-uuid-1/waive
Authorization: Bearer ADMIN-TOKEN
Content-Type: application/json

{
  "reason": "Member was sick during this period"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "penalty-uuid-1",
    "weekNumber": 24,
    "amount": "50.00",
    "status": "WAIVED",
    "paidAt": null
  },
  "message": "Penalty waived successfully"
}
```

✅ **What Happened:**
- Penalty marked as **WAIVED**
- Member's balance **reduced** by 50 Birr (just like payment)
- Member **notified** about the waiver
- Reason recorded in audit log

---

## 🛠️ Using Postman

### Setup

1. **Create New Request**
   - Method: `GET` or `POST`
   - URL: `http://localhost:5000/api/penalties/member/MEMBER-ID`

2. **Add Authorization Header**
   - Go to "Headers" tab
   - Add: `Authorization: Bearer YOUR-TOKEN`

3. **For POST requests, add body**
   - Go to "Body" tab
   - Select "raw" and "JSON"
   - Paste the JSON payload

### Example Postman Request

**Get Penalties:**
```
Method: GET
URL: http://localhost:5000/api/penalties/member/cm123abc456
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Pay Penalty:**
```
Method: POST
URL: http://localhost:5000/api/penalties/pay
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body (raw JSON):
{
  "penaltyId": "penalty-uuid-2",
  "amount": 50.00,
  "paymentMethod": "CASH"
}
```

---

## 🧪 Using cURL (Command Line)

### Get Penalties
```bash
curl -X GET "http://localhost:5000/api/penalties/member/cm123abc456" \
  -H "Authorization: Bearer YOUR-TOKEN"
```

### Pay Penalty
```bash
curl -X POST "http://localhost:5000/api/penalties/pay" \
  -H "Authorization: Bearer YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"penaltyId\":\"penalty-uuid-2\",\"amount\":50.00,\"paymentMethod\":\"CASH\"}"
```

### Waive Penalty
```bash
curl -X PATCH "http://localhost:5000/api/penalties/penalty-uuid-1/waive" \
  -H "Authorization: Bearer YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"reason\":\"Medical emergency\"}"
```

---

## ❌ Common Errors

### Error 1: Penalty Not Found
```json
{
  "success": false,
  "message": "Penalty not found"
}
```
**Solution:** Check the penalty ID is correct.

---

### Error 2: Already Paid
```json
{
  "success": false,
  "message": "Penalty has already been paid"
}
```
**Solution:** This penalty was already settled. Check status first.

---

### Error 3: Wrong Amount
```json
{
  "success": false,
  "message": "Payment amount exceeds penalty amount"
}
```
**Solution:** Amount must match the penalty amount exactly.

---

### Error 4: Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```
**Solution:** Check your token is valid and not expired.

---

## 📱 Mobile App / Frontend Integration

### JavaScript/TypeScript Example

```javascript
// 1. Get penalties
async function getMemberPenalties(memberId, token) {
  const response = await fetch(
    `http://localhost:5000/api/penalties/member/${memberId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const result = await response.json();
  return result.data;
}

// 2. Display penalties
const penalties = await getMemberPenalties('cm123abc456', token);
penalties.forEach(penalty => {
  console.log(`Week ${penalty.weekNumber} (${penalty.year}): ${penalty.amount} Birr - ${penalty.status}`);
});

// 3. Pay a specific penalty
async function payPenalty(penaltyId, amount, token) {
  const response = await fetch(
    'http://localhost:5000/api/penalties/pay',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        penaltyId: penaltyId,
        amount: amount,
        paymentMethod: 'CASH'
      })
    }
  );
  const result = await response.json();
  
  if (result.success) {
    console.log('Payment successful!');
    console.log('Receipt:', result.data.payment.receiptNumber);
  } else {
    console.error('Payment failed:', result.message);
  }
  
  return result;
}

// Usage
const payment = await payPenalty('penalty-uuid-2', 50.00, token);
```

### React Example

```jsx
function PenaltyList({ memberId }) {
  const [penalties, setPenalties] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`http://localhost:5000/api/penalties/member/${memberId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setPenalties(data.data));
  }, [memberId]);

  const handlePay = async (penaltyId, amount) => {
    const response = await fetch('http://localhost:5000/api/penalties/pay', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        penaltyId,
        amount,
        paymentMethod: 'CASH'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      alert(`Payment successful! Receipt: ${result.data.payment.receiptNumber}`);
      // Refresh penalties list
      window.location.reload();
    }
  };

  return (
    <div>
      <h2>Penalties</h2>
      {penalties.map(penalty => (
        <div key={penalty.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
          <p>Week {penalty.weekNumber} ({penalty.year})</p>
          <p>Amount: {penalty.amount} Birr</p>
          <p>Status: {penalty.status}</p>
          {penalty.status === 'OUTSTANDING' && (
            <button onClick={() => handlePay(penalty.id, parseFloat(penalty.amount))}>
              Pay This Penalty
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Quick Reference

### Payment Methods
- `CASH` - Cash payment
- `BANK_TRANSFER` - Bank transfer
- `MOBILE_MONEY` - Mobile money

### Penalty Status
- `OUTSTANDING` - Not yet paid
- `SETTLED` - Fully paid
- `WAIVED` - Forgiven by admin

### Required Fields for Payment
- ✅ `penaltyId` - Which penalty to pay
- ✅ `amount` - How much (must equal penalty amount)
- ✅ `paymentMethod` - CASH, BANK_TRANSFER, or MOBILE_MONEY
- ⭕ `transactionReference` - Optional reference number
- ⭕ `notes` - Optional note

---

## ✅ Checklist

Before paying a penalty:
- [ ] Backend server is running
- [ ] You have a valid authentication token
- [ ] You have the member's ID
- [ ] You retrieved the penalty list
- [ ] You have the specific penalty ID
- [ ] Amount matches the penalty amount

---

## 🆘 Need Help?

1. **Check server is running**: `http://localhost:5000/api/health`
2. **Check your token**: Make sure it's not expired
3. **Check penalty exists**: Get penalty list first
4. **Check amount**: Must equal penalty amount exactly
5. **Check permissions**: Only ADMIN/AUDITOR can pay penalties

---

## 📞 Support

For issues or questions:
- Review error messages in API response
- Check audit logs in database
- Verify token is valid
- Confirm penalty ID is correct

---

**🎉 You're ready to pay penalties! Follow the steps above and you'll be all set!**
