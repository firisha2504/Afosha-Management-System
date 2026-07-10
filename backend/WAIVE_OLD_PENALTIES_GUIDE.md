# Waive Old Attendance Penalties - Guide

## What This Script Does

Automatically **waives (forgives)** all penalties that say "Absent from meeting" in the reason. These were created by the old penalty system before we updated the rules.

## Why Waive These Penalties?

### Old Rule (Unfair) ❌
- Member absent from meeting → Gets penalty
- Even if they paid their weekly contribution
- Punished for missing meeting

### New Rule (Fair) ✅
- Member doesn't pay weekly contribution → Gets penalty
- Attendance doesn't affect penalties
- Only punished for non-payment

### Fresh Start
- Old penalties are from old (unfair) rules
- Waiving them gives members a clean slate
- Start fresh with the new fair system

## What "Waive" Means

**WAIVE = FORGIVE = CANCEL**

- Penalty status changes: OUTSTANDING → WAIVED
- Member does **NOT** pay the penalty
- Member's debt (outstanding balance) is reduced
- Organization receives **0 Birr** for waived penalties
- It's like saying: "We're canceling this debt, you don't owe it"

## What the Script Will Do

1. **Find** all penalties with:
   - Status: OUTSTANDING (not yet paid)
   - Reason: Contains "meeting" (e.g., "Absent from meeting: A3")

2. **Show** you:
   - How many penalties found
   - Member names and amounts
   - Total amount to be waived

3. **Waive** each penalty:
   - Change status to WAIVED
   - Reduce member's outstanding balance
   - Log each action

4. **Report** results:
   - Number of penalties waived
   - Total amount waived
   - Success confirmation

## Example Output

```
========================================
Waiving Old Attendance-Based Penalties
========================================

Found 2 attendance-based penalties to waive

Penalties to be waived:
─────────────────────────────────────────────────────────────
  • ABCD (9AF20263488)
    Amount: 50 Birr
    Reason: Absent from meeting: A3 (7/10/2026)
    Week: 28, Year: 2026

  • Firomsa Abdi (9AF20269879)
    Amount: 50 Birr
    Reason: Absent from meeting: A3 (7/10/2026)
    Week: 28, Year: 2026

─────────────────────────────────────────────────────────────

Total amount to be waived: 100 Birr

⚠️  WARNING: This will waive (forgive) these penalties.
Members will NOT have to pay them.
Their outstanding balances will be reduced.

✅ Waived: ABCD - 50 Birr
✅ Waived: Firomsa Abdi - 50 Birr

========================================
✅ SUCCESS!
========================================
Waived Penalties: 2
Total Amount Waived: 100 Birr
```

## How to Run the Script

### Option 1: Using Batch File (Easiest)
```cmd
cd backend
waive-old-penalties.bat
```

Press Enter when prompted to proceed.

### Option 2: Direct Command
```cmd
cd backend
npx tsx scripts/waive-attendance-penalties.ts
```

## Before Running

### Backup Recommended (Optional)
If you want to be extra safe:
```cmd
cd backend
npm run backup
```

This creates a backup of your database before making changes.

## After Running

### Check Results

1. **Penalties Page**:
   - Old "Absent from meeting" penalties should show status: WAIVED (gray/blue icon)
   - No longer outstanding

2. **Member Profiles**:
   - Outstanding balances reduced
   - Waived penalties appear in penalty history

3. **Dashboard**:
   - "Unpaid Penalties" total should be lower
   - "Waived" count should increase

## What Changes in Database

### Penalty Table
```sql
-- Before
status: 'OUTSTANDING'
reason: 'Absent from meeting: A3 (7/10/2026)'

-- After  
status: 'WAIVED'
reason: 'Absent from meeting: A3 (7/10/2026)' (unchanged)
```

### Member Table
```sql
-- Example: Member had 150 Birr outstanding, 50 Birr waived
outstandingBalance: 150 → 100
```

## Safety Features

### The Script:
- ✅ Only affects OUTSTANDING penalties (not already paid ones)
- ✅ Only affects penalties with "meeting" in reason
- ✅ Shows preview before making changes
- ✅ Uses database transactions (all-or-nothing)
- ✅ Logs each action
- ✅ Can be run multiple times safely (already waived penalties skipped)

### Will NOT Affect:
- ❌ Penalties already SETTLED (paid)
- ❌ Penalties already WAIVED
- ❌ Payment-based penalties (created by scheduler)
- ❌ Manual penalties created by admin
- ❌ Any other data (payments, contributions, etc.)

## If Something Goes Wrong

### Script Fails
If the script encounters an error:
- No changes are made (transaction rollback)
- Check the error message
- Database remains unchanged

### Need to Undo
If you waived by mistake and need to undo:
- You can manually change penalty status back to OUTSTANDING
- Or restore from backup (if you created one)

## FAQ

**Q: Will members know their penalties were waived?**
A: The system will show the penalties as WAIVED in their history. You may want to announce the policy change to members.

**Q: What about penalties created in the future?**
A: New penalties will ONLY be created for non-payment (by the scheduler), not for attendance. No attendance penalties will be created going forward.

**Q: Should I run this more than once?**
A: No need. Once is enough. If you run it again, it will find 0 penalties (already waived).

**Q: What if I want to keep some and waive others?**
A: You can manually waive individual penalties from the Penalties page using the "Waive" button. This script is for bulk waiving all at once.

**Q: Will this affect our financial totals?**
A: Yes, the "Unpaid Penalties" total will decrease since these penalties are no longer owed. This is correct - members don't owe these anymore.

**Q: Can members still see these waived penalties?**
A: Yes, they appear in penalty history as WAIVED. This is good for transparency - shows what was owed but forgiven.

## Summary

### Before Script
```
ABCD: Outstanding penalty 50 Birr (Absent from meeting)
Firomsa: Outstanding penalty 50 Birr (Absent from meeting)
Total outstanding: 100 Birr
```

### After Script
```
ABCD: WAIVED penalty 50 Birr (Absent from meeting)
Firomsa: WAIVED penalty 50 Birr (Absent from meeting)
Total outstanding: 0 Birr
Members owe: 0 Birr
```

### Going Forward
- ✅ Only payment-based penalties created
- ✅ Fair system: Don't pay = penalty
- ✅ Attendance tracked separately
- ✅ No more unfair attendance penalties

---

**Ready to run?**
```cmd
cd backend
waive-old-penalties.bat
```

**Questions?** Check the error messages or ask for help!
