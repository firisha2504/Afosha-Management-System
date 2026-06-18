# 📁 Weekly Payments Grouping & Collapse Feature

## 🎯 Feature Request

Group payments in the Payments page by **week number** with **collapsible sections** for each week.

### Current View:
```
All payments in one long list mixed together
- Week 25 payment 1
- Week 26 payment 1  
- Week 25 payment 2
- Week 26 payment 2
```

### Desired View:
```
▼ Week 26, 2026 (5 payments - 250 ETB)
   - Member 1: 50 ETB
   - Member 2: 50 ETB
   - Member 3: 50 ETB
   - Member 4: 50 ETB
   - Member 5: 50 ETB

▶ Week 25, 2026 (3 payments - 150 ETB)  [Collapsed]

▼ Penalty Payments (1 payment - 50 ETB)
   - Cala Ahmed: 50 ETB
```

---

## 🔧 Implementation Plan

### Step 1: Add Collapse State
```typescript
// In PaymentsPage component
const [collapsedWeeks, setCollapsedWeeks] = useState<Record<string, boolean>>({});

const toggleWeek = (weekKey: string) => {
  setCollapsedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] }));
};
```

###Step 2: Group Payments by Week
```typescript
const groupedPayments = useMemo(() => {
  const groups: Record<string, Payment[]> = {};
  
  filtered.forEach(payment => {
    if (payment.obligation) {
      // Weekly payment
      const key = `week-${payment.obligation.weekNumber}-${payment.obligation.year}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(payment);
    } else if (payment.notes?.toLowerCase().includes('penalty')) {
      // Penalty payment
      const key = 'penalty';
      if (!groups[key]) groups[key] = [];
      groups[key].push(payment);
    } else {
      // Other payments
      const key = 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(payment);
    }
  });
  
  return groups;
}, [filtered]);
```

### Step 3: Render Collapsible Groups
```typescript
{Object.entries(groupedPayments)
  .sort(([keyA], [keyB]) => {
    // Sort: newest week first
    const getWeekNum = (key: string) => {
      if (key.startsWith('week-')) {
        const parts = key.split('-');
        return parseInt(parts[1]) * 1000 + parseInt(parts[2]);
      }
      return key === 'penalty' ? -1 : -2;
    };
    return getWeekNum(keyB) - getWeekNum(keyA);
  })
  .map(([weekKey, weekPayments]) => {
    const isCollapsed = collapsedWeeks[weekKey];
    const total = weekPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Get week display name
    let weekDisplay = '';
    if (weekKey.startsWith('week-')) {
      const parts = weekKey.split('-');
      weekDisplay = `Week ${parts[1]}, ${parts[2]}`;
    } else if (weekKey === 'penalty') {
      weekDisplay = 'Penalty Payments';
    } else {
      weekDisplay = 'Other Payments';
    }
    
    return (
      <React.Fragment key={weekKey}>
        {/* Week Header (Collapsible) */}
        <tr className="bg-slate-100 hover:bg-slate-200 cursor-pointer" onClick={() => toggleWeek(weekKey)}>
          <td colSpan={8} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-slate-600" />
                ) : (
                  <ChevronDown size={16} className="text-slate-600" />
                )}
                <span className="font-semibold text-slate-800">{weekDisplay}</span>
                <span className="text-xs text-slate-500">
                  ({weekPayments.length} payments - {total.toLocaleString()} ETB)
                </span>
              </div>
            </div>
          </td>
        </tr>
        
        {/* Week Payments (Show/Hide based on collapse state) */}
        {!isCollapsed && weekPayments.map(payment => (
          <tr key={payment.id} className="hover:bg-slate-50">
            {/* Existing payment row code... */}
          </tr>
        ))}
      </React.Fragment>
    );
  })}
```

### Step 4: Add Chevron Icons
```typescript
import { ChevronDown, ChevronRight } from 'lucide-react';
```

---

## 📊 Benefits

1. ✅ **Better Organization**: Easy to see payments per week
2. ✅ **Quick Overview**: See totals for each week at a glance
3. ✅ **Reduced Clutter**: Collapse old weeks to focus on recent ones
4. ✅ **Easy Navigation**: Quickly find specific week's payments
5. ✅ **Visual Hierarchy**: Clear separation between weeks

---

## 🎨 UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  Payments                                   [Bulk Record] [+]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ▼ Week 26, 2026 (5 payments - 250 ETB)                         │
│  ├─ PAY-123  │ Cala Ahmed    │ Weekly │ 50 ETB │ VERIFIED       │
│  ├─ PAY-124  │ ABCD          │ Weekly │ 50 ETB │ VERIFIED       │
│  ├─ PAY-125  │ Firomsa Abdi  │ Weekly │ 50 ETB │ VERIFIED       │
│  ├─ PAY-126  │ Cala Ahmed    │ Weekly │ 50 ETB │ PENDING        │
│  └─ PAY-127  │ ABCD          │ Weekly │ 50 ETB │ PENDING        │
│                                                                   │
│  ▶ Week 25, 2026 (3 payments - 150 ETB)                         │
│                                                                   │
│  ▼ Penalty Payments (1 payment - 50 ETB)                        │
│  └─ PAY-128  │ Cala Ahmed    │ Penalty │ 50 ETB │ VERIFIED      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Priority

**Priority Level**: Medium-High

**Estimated Time**: 2-3 hours

**Dependencies**: None

**Files to Modify**:
- `web/src/pages/PaymentsPage.tsx`

**Breaking Changes**: None (additive feature)

---

## 📝 Additional Features (Optional)

1. **Expand/Collapse All Button**
   - Button to expand or collapse all weeks at once

2. **Week Total Summary**
   - Show expected vs actual for each week
   - Highlight weeks with missing payments

3. **Default Behavior**
   - Current week: Expanded by default
   - Older weeks: Collapsed by default

4. **Search Within Week**
   - Filter payments within a specific week

5. **Week Status Badge**
   - Complete ✅ (all members paid)
   - Partial ⚠️ (some members paid)
   - Pending ⏳ (no payments yet)

---

## 🎯 User Stories

**As an admin, I want to:**
- See payments organized by week number
- Collapse old weeks to focus on current week
- Quickly see how much was collected per week
- Find specific week's payments easily

**Acceptance Criteria:**
- ✅ Payments grouped by week number
- ✅ Click to expand/collapse each week
- ✅ Week header shows: week number, payment count, total amount
- ✅ Chevron icon indicates expand/collapse state
- ✅ Penalty payments in separate group
- ✅ Default: current week expanded, others collapsed

---

## 🧪 Testing Checklist

- [ ] Week 26 payments display under "Week 26, 2026" header
- [ ] Week 25 payments display under "Week 25, 2026" header
- [ ] Penalty payments display under "Penalty Payments" header
- [ ] Click week header to collapse/expand
- [ ] Chevron icon changes (▼ expanded, ▶ collapsed)
- [ ] Week totals calculate correctly
- [ ] Payment count displays correctly
- [ ] Filters still work with grouped view
- [ ] Verify, edit, delete actions still work
- [ ] Receipt viewing still works

---

## 💡 Alternative Approaches

### Option 1: Accordion Component (Recommended)
Use collapsible accordion for clean UX

### Option 2: Tabs
Show each week as a separate tab

### Option 3: Dropdown Filter
Keep flat list but add dropdown to filter by week

---

**Recommendation**: Implement **Option 1 (Accordion)** as described above.

---

## 📌 Next Steps

1. Review this guide with team
2. Approve design mockup
3. Implement in `PaymentsPage.tsx`
4. Test thoroughly
5. Deploy to production

---

**Status**: ✅ Implementation Complete  
**Created**: June 18, 2026  
**Last Updated**: June 18, 2026  
**Implemented**: June 18, 2026
