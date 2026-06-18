# 🔐 Login Guide - Admin & Auditor

## 📋 Default Admin Account

When you first set up the system, a default admin account is automatically created:

### **Default Admin Credentials:**
```
Username: admin
Password: Admin@123
Email: admin@afosha.org
Phone: +251900000000
Role: ADMIN
```

⚠️ **IMPORTANT:** The system requires you to **change the password** after first login for security!

---

## 🚀 How to Login

### Method 1: Using Postman (Recommended for Testing)

**Step 1: Open Postman**

**Step 2: Create New Request**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`

**Step 3: Add Request Body**
- Go to "Body" tab
- Select "raw" and "JSON"
- Enter:

```json
{
  "identifier": "admin",
  "password": "Admin@123"
}
```

**Step 4: Send Request**

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYmMxMjMiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTg0MDAwMDAsImV4cCI6MTcxODQ4NjQwMH0.xyz789...",
    "user": {
      "userId": "uuid-here",
      "username": "admin",
      "role": "ADMIN",
      "isActive": true,
      "preferredLanguage": "om",
      "mustChangePassword": true
    }
  },
  "message": "Login successful"
}
```

**Step 5: Save the Token**
Copy the `token` value - you'll need it for all other API requests!

---

### Method 2: Using cURL (Command Line)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"admin\",\"password\":\"Admin@123\"}"
```

---

### Method 3: Using JavaScript/Frontend

```javascript
async function login(identifier, password) {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier: identifier,
      password: password
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Save token for future requests
    localStorage.setItem('token', result.data.token);
    localStorage.setItem('user', JSON.stringify(result.data.user));
    
    console.log('Login successful!');
    console.log('Role:', result.data.user.role);
    return result.data;
  } else {
    console.error('Login failed:', result.message);
    throw new Error(result.message);
  }
}

// Usage
login('admin', 'Admin@123')
  .then(data => {
    console.log('Logged in as:', data.user.username);
    console.log('Token:', data.token);
  })
  .catch(error => {
    console.error('Login error:', error);
  });
```

---

## 👥 Who Can Login?

### 1. **ADMIN** (Full Access)
- Username: `admin`
- Password: `Admin@123` (default)
- **Can do:**
  - ✅ Manage all members
  - ✅ Record payments
  - ✅ Pay penalties
  - ✅ Waive penalties
  - ✅ Create auditors
  - ✅ View all reports
  - ✅ Change system settings
  - ✅ Everything!

---

### 2. **AUDITOR** (Limited Admin Access)
- Must be created by ADMIN first
- **Can do:**
  - ✅ View all members
  - ✅ Record payments
  - ✅ Pay penalties
  - ✅ View reports
  - ❌ Cannot waive penalties
  - ❌ Cannot create other auditors
  - ❌ Cannot change system settings

---

### 3. **MEMBER** (User Access)
- Created when registered
- **Can do:**
  - ✅ View own profile
  - ✅ View own payments
  - ✅ View own penalties
  - ✅ View notifications
  - ❌ Cannot pay own penalties
  - ❌ Cannot access admin features

---

## 🔧 How to Create an Auditor

After logging in as admin, create an auditor:

### Using Postman:

```
POST http://localhost:5000/api/members/auditor
Authorization: Bearer YOUR-ADMIN-TOKEN
Content-Type: application/json

{
  "username": "auditor1",
  "phone": "+251911223344",
  "email": "auditor1@afosha.org",
  "password": "Auditor@123",
  "fullName": "Abebe Kebede"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "new-uuid",
      "username": "auditor1",
      "role": "AUDITOR",
      "isActive": true
    }
  },
  "message": "Auditor created successfully"
}
```

**Now the auditor can login:**
```json
{
  "identifier": "auditor1",
  "password": "Auditor@123"
}
```

---

## 🔑 How to Use the Token

After login, use the token in all subsequent requests:

### Example: Get Member's Penalties

```
GET http://localhost:5000/api/penalties/member/MEMBER-ID
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example: Pay Penalty

```
POST http://localhost:5000/api/penalties/pay
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "penaltyId": "penalty-uuid",
  "amount": 50.00,
  "paymentMethod": "CASH"
}
```

---

## 🔄 Complete Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Start Backend Server                                │
│  cd backend && npm run dev                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Login with Default Admin                            │
│  POST /api/auth/login                                        │
│  { "identifier": "admin", "password": "Admin@123" }          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Get Token from Response                             │
│  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Use Token in All Requests                           │
│  Authorization: Bearer {token}                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Access Admin Features                               │
│  - View penalties                                             │
│  - Pay penalties                                              │
│  - Manage members                                             │
│  - View reports                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Password Requirements

When creating accounts or changing passwords:

- **Minimum length:** 8 characters
- **Recommended:** Include uppercase, lowercase, numbers, and special characters
- **Examples:**
  - ✅ `Admin@123`
  - ✅ `Auditor@2026`
  - ✅ `SecurePass!99`
  - ❌ `password` (too weak)
  - ❌ `123456` (too weak)

---

## 🔄 Change Password After First Login

If `mustChangePassword: true` in the login response, change the password:

```
POST http://localhost:5000/api/auth/change-password
Authorization: Bearer YOUR-TOKEN
Content-Type: application/json

{
  "currentPassword": "Admin@123",
  "newPassword": "NewSecurePassword@2026"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## ❌ Common Login Errors

### Error 1: Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```
**Solution:** Check username and password are correct.

---

### Error 2: Account Locked
```json
{
  "success": false,
  "message": "Account is locked. Try again later."
}
```
**Solution:** Wait 30 minutes or contact system admin to unlock.

---

### Error 3: Account Inactive
```json
{
  "success": false,
  "message": "Account is inactive"
}
```
**Solution:** Contact admin to activate your account.

---

### Error 4: Cannot Connect to Server
```
Error: Failed to fetch
```
**Solution:** Make sure backend server is running on port 5000.

---

## 🔍 Check Who You're Logged In As

After login, you can verify your identity:

```
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR-TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-here",
    "username": "admin",
    "role": "ADMIN",
    "phone": "+251900000000",
    "email": "admin@afosha.org",
    "isActive": true,
    "preferredLanguage": "om"
  }
}
```

---

## 📝 Login with Different Identifiers

You can login using **username**, **phone**, or **email**:

### Option 1: Login with Username
```json
{
  "identifier": "admin",
  "password": "Admin@123"
}
```

### Option 2: Login with Phone
```json
{
  "identifier": "+251900000000",
  "password": "Admin@123"
}
```

### Option 3: Login with Email
```json
{
  "identifier": "admin@afosha.org",
  "password": "Admin@123"
}
```

All three work with the same password!

---

## 🛡️ Security Best Practices

1. **Change Default Password**
   - Never use `Admin@123` in production
   - Change immediately after first login

2. **Keep Token Secure**
   - Don't share your token
   - Don't commit tokens to Git
   - Store securely (localStorage for web, secure storage for mobile)

3. **Token Expiry**
   - Tokens expire after 24 hours
   - Login again when token expires

4. **Logout**
   - Clear token from storage when logging out
   - Don't leave tokens in memory

5. **Failed Login Attempts**
   - After 5 failed attempts, account locks for 30 minutes
   - Prevents brute force attacks

---

## 📱 Frontend Login Form Example (React)

```jsx
import React, { useState } from 'react';

function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: identifier,
          password: password
        })
      });

      const result = await response.json();

      if (result.success) {
        // Save token
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        // Redirect based on role
        if (result.data.user.role === 'ADMIN' || result.data.user.role === 'AUDITOR') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/member/dashboard';
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Login to Afosha MS</h2>
      
      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', marginBottom: '15px' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label>Username, Phone, or Email:</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="admin"
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Default Admin:</p>
        <p>Username: <strong>admin</strong></p>
        <p>Password: <strong>Admin@123</strong></p>
      </div>
    </div>
  );
}

export default LoginForm;
```

---

## 🗂️ Testing All User Roles

### 1. Test as Admin
```bash
# Login as admin
POST /api/auth/login
{ "identifier": "admin", "password": "Admin@123" }

# Use token to pay penalty (should work)
POST /api/penalties/pay
Authorization: Bearer {admin-token}
{ "penaltyId": "...", "amount": 50, "paymentMethod": "CASH" }

# Waive penalty (should work)
PATCH /api/penalties/{id}/waive
Authorization: Bearer {admin-token}
{ "reason": "Testing admin privileges" }
```

### 2. Test as Auditor
```bash
# Login as auditor (create one first)
POST /api/auth/login
{ "identifier": "auditor1", "password": "Auditor@123" }

# Use token to pay penalty (should work)
POST /api/penalties/pay
Authorization: Bearer {auditor-token}
{ "penaltyId": "...", "amount": 50, "paymentMethod": "CASH" }

# Try to waive penalty (should FAIL - auditors can't waive)
PATCH /api/penalties/{id}/waive
Authorization: Bearer {auditor-token}
{ "reason": "Testing" }
# Expected: 403 Forbidden
```

### 3. Test as Member
```bash
# Login as member (create one first)
POST /api/auth/login
{ "identifier": "member-phone", "password": "member-password" }

# View own penalties (should work)
GET /api/penalties/my
Authorization: Bearer {member-token}

# Try to pay penalty (should FAIL - members can't pay)
POST /api/penalties/pay
Authorization: Bearer {member-token}
{ "penaltyId": "...", "amount": 50, "paymentMethod": "CASH" }
# Expected: 403 Forbidden
```

---

## 📋 Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│                   LOGIN QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔐 Default Admin:                                           │
│     Username: admin                                          │
│     Password: Admin@123                                      │
│                                                              │
│  📡 Login Endpoint:                                          │
│     POST /api/auth/login                                     │
│                                                              │
│  📝 Request Body:                                            │
│     { "identifier": "admin", "password": "Admin@123" }       │
│                                                              │
│  ✅ Success Response:                                        │
│     { "success": true, "data": { "token": "..." } }          │
│                                                              │
│  🎫 Use Token:                                               │
│     Authorization: Bearer {token}                            │
│                                                              │
│  👥 Roles:                                                   │
│     ADMIN    - Full access                                   │
│     AUDITOR  - Limited admin access                          │
│     MEMBER   - User access                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist: First Time Setup

- [ ] Backend server is running (`npm run dev`)
- [ ] Database is seeded (run `npm run seed` if needed)
- [ ] Default admin account exists
- [ ] Can access `http://localhost:5000/api/health`
- [ ] Login with `admin / Admin@123` works
- [ ] Token is received in response
- [ ] Can use token to access admin endpoints
- [ ] Change default password for security

---

**Now you're ready to login and use the penalty payment system! 🎉**

**Next Step:** After logging in, open `HOW_TO_PAY_PENALTIES.md` to learn how to pay penalties!
