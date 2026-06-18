# 📋 Mobile App Testing Checklist

## Pre-Installation Checks

### ✅ Before You Start
- [ ] Phone connected via USB
- [ ] USB debugging enabled on phone
- [ ] Developer options enabled
- [ ] Both old ams_mobile apps **UNINSTALLED** from phone

---

## Installation Steps

### Step 1: Verify Setup
```bash
cd "c:\Users\MyPC\Desktop\Afosha MS\mobile"
flutter devices
```
✅ Should show your connected phone

### Step 2: Clean Build
```bash
flutter clean
flutter pub get
```
✅ Should complete without errors

### Step 3: Install
```bash
flutter run
```
⏱️ Takes 2-3 minutes first time
✅ Should install successfully

---

## Post-Installation Verification

### 🎯 Basic Checks
- [ ] Only **ONE** ams_mobile icon appears on phone
- [ ] App launches without crashing
- [ ] Home screen displays correctly
- [ ] Bottom navigation has 6 tabs

### 🌍 Language Toggle
- [ ] Language icon (🌐) visible in header
- [ ] Tapping icon switches language
- [ ] All text changes (English ↔ Oromiffa)
- [ ] No mixed languages appear

---

## Screen-by-Screen Testing

### 🏠 Home Screen
- [ ] Dashboard displays stats
- [ ] Quick stats row shows Member ID, Status, Attendance %
- [ ] Financial overview cards display
- [ ] Attendance card shows percentage
- [ ] Quick actions grid works
- [ ] Language toggle changes all text

### 💰 Payments Screen
- [ ] Header shows "Payments" / "Kaffaltii"
- [ ] Summary cards show Verified/Pending totals
- [ ] Payment list displays correctly
- [ ] Status badges show correct colors
- [ ] Empty state if no payments
- [ ] Pull-to-refresh works

### 💵 Savings Screen  
- [ ] Header shows "My Savings" / "Kuusaa Koo"
- [ ] Total savings displays in header
- [ ] Stats show Transactions and Balance
- [ ] Transaction cards show amount and balance
- [ ] Empty state if no savings
- [ ] Pull-to-refresh works

### 🔔 Notifications Screen
- [ ] Header shows "Notifications" / "Beeksisa"
- [ ] Unread count badge displays (if any unread)
- [ ] Unread notifications highlighted in blue
- [ ] Read notifications show normal styling
- [ ] Timestamps show relative time
- [ ] Tapping notification marks as read
- [ ] Empty state if no notifications

### ➕ More Screen
- [ ] Header shows "More" / "Biroo"
- [ ] "My Records" section header
- [ ] 4 menu items in My Records section
- [ ] "About Afosha" section header
- [ ] About menu item present
- [ ] All menu items navigate correctly
- [ ] Icons are color-coded

### 🔴 Penalties Screen
- [ ] Header shows "Penalties" / "Adabbii"
- [ ] Red gradient header
- [ ] Summary cards: Unpaid/Paid
- [ ] Penalty cards show amount and reason
- [ ] Status badges: Paid/Unpaid with colors
- [ ] Empty state if no penalties
- [ ] Pull-to-refresh works

### 🔵 Receipts Screen
- [ ] Header shows "Receipts" / "Herrega"
- [ ] Blue gradient header
- [ ] Summary card shows Total Paid
- [ ] Receipt cards display amount
- [ ] Tapping receipt opens dialog
- [ ] Dialog shows all receipt details
- [ ] Close button works in dialog
- [ ] Empty state if no receipts

### 🟢 Special Contributions Screen
- [ ] Header shows "Special Contributions" / "Gumaacha Addaa"
- [ ] Teal gradient header
- [ ] Summary cards: Pending/Paid
- [ ] Contribution cards show title and amount
- [ ] Status badges show Paid/Pending
- [ ] Empty state if no contributions
- [ ] Pull-to-refresh works

### 🟢 Attendance Screen
- [ ] Header shows "Attendance" / "Argamnaa"
- [ ] Green gradient header
- [ ] Attendance rate % displays prominently
- [ ] Progress bar shows attendance visually
- [ ] 3 summary cards: Present/Absent/Total
- [ ] Attendance cards show meeting details
- [ ] Date formatting works
- [ ] Status shows Present/Absent with icons
- [ ] Empty state if no records

### 🟣 About Afosha Screen
- [ ] Purple gradient header
- [ ] Afosha branding displays
- [ ] 4 tabs visible
- [ ] Tab 1: About Afosha content
- [ ] Tab 2: Mission & Vision split layout
- [ ] Tab 3: Rules numbered list
- [ ] Tab 4: Contact information
- [ ] All tabs switch correctly
- [ ] Content loads from API (or fallback)

### 👤 Profile Screen
- [ ] Profile displays correctly
- [ ] All existing features work
- [ ] Language toggle works here too

---

## Language-Specific Testing

### English Mode
- [ ] All headers in English
- [ ] All buttons in English
- [ ] All labels in English
- [ ] All status badges in English
- [ ] Empty states in English

### Afaan Oromoo Mode
- [ ] All headers in Oromiffa
- [ ] All buttons in Oromiffa
- [ ] All labels in Oromiffa
- [ ] All status badges in Oromiffa
- [ ] Empty states in Oromiffa

---

## Design Quality Checks

### Visual Consistency
- [ ] All headers have gradient backgrounds
- [ ] All cards have rounded corners (16px)
- [ ] All cards have subtle shadows
- [ ] Icons in colored circular containers
- [ ] Status badges have rounded borders
- [ ] Colors match theme per screen

### User Experience
- [ ] Smooth scrolling on all screens
- [ ] Pull-to-refresh smooth animation
- [ ] Tap feedback on all buttons
- [ ] No lag when switching language
- [ ] Navigation transitions smooth
- [ ] No crashes or freezes

### Empty States
- [ ] Large centered icons
- [ ] Clear title messages
- [ ] Helpful subtitle text
- [ ] Color matches screen theme
- [ ] Proper spacing

---

## Performance Checks

- [ ] App launches in < 3 seconds
- [ ] Screens load quickly
- [ ] No memory leaks
- [ ] Battery usage reasonable
- [ ] Smooth animations (60fps)

---

## Edge Cases

- [ ] Works on small screens
- [ ] Works on large screens
- [ ] Handles no internet connection
- [ ] Handles API errors gracefully
- [ ] Long text wraps properly
- [ ] Large numbers format correctly

---

## Final Verification

### Installation
✅ Only ONE app installed  
✅ Package ID: com.afosha.mobile  
✅ Version: 1.0.0+1  

### Functionality
✅ All 9+ screens work  
✅ Language toggle works everywhere  
✅ Navigation works  
✅ Data loads correctly  

### Design
✅ Modern gradient headers  
✅ Consistent card layouts  
✅ Professional appearance  
✅ Color-coded themes  

### Localization
✅ English fully supported  
✅ Afaan Oromoo fully supported  
✅ No mixed languages  
✅ All text translates  

---

## Issues Found

Document any issues here:

| Screen | Issue | Severity | Status |
|--------|-------|----------|--------|
| | | | |
| | | | |

---

## Sign-Off

**Tester:** ___________________  
**Date:** ___________________  
**Status:** ☐ Pass  ☐ Fail  
**Notes:** 

---

✅ **Ready for Production:** Yes / No

If all checks pass, the app is ready for:
- Internal testing
- Beta testing  
- Production release
- Play Store submission

🎉 **Testing Complete!**
