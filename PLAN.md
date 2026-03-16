# Fix spacing, alignment, and text overlap issues across the app

After a full review of every screen, style file, and shared component, here are the issues found and the fixes planned:

---

### **1. Dashboard — Task card meta text overlap**

- The task meta row (date + appliance name) uses a small `gap: 5` with no `flexWrap`, so on narrow screens the appliance name can overlap or get cut off
- **Fix:** Add `flexWrap: 'wrap'` to the `taskMeta` style and increase gap slightly

### **2. Dashboard — Spending card amounts can collide**

- Large dollar amounts (e.g. `$12,345`) in the month/year spending card can bump into the center divider
- **Fix:** Allow the amount text to shrink with `flexShrink: 1` and add `adjustsFontSizeToFit` / `numberOfLines={1}` to prevent overlap

### **3. Dashboard — Provider cards horizontal scroll clipping**

- The `providersRow` has `paddingRight` but no `paddingLeft`, so the first card's shadow gets clipped on the left edge
- **Fix:** Add matching `paddingLeft` to `providersRow`

### **4. My Items (Appliances) — Chip row text overlap**

- The location chip and warranty chip sit in a `flexDirection: 'row'` with no `flexWrap`, so long location names push the warranty badge off-screen
- **Fix:** Add `flexWrap: 'wrap'` and a small `rowGap` to `cardChips`

### **5. My Items — Card content misalignment with chevron**

- The chevron icon on each card doesn't vertically center well when the card has extra chip rows
- **Fix:** Ensure `alignItems: 'center'` on `cardRow` and add `alignSelf: 'center'` to the chevron

### **6. To-Do (Schedule) — Task footer items overlap on small screens**

- The task footer has date, appliance name, and "Repeats" badge all in a row with `flexWrap: 'wrap'` and `gap: 6` — but the appliance name has no max width, so it can push the repeats badge to a cramped second line
- **Fix:** Add `flexShrink: 1` to `taskApplianceName` and cap it with `maxWidth: '40%'`

### **7. To-Do — Priority tag and chevron vertical spacing**

- The priority tag and chevron in `taskRight` use `justifyContent: 'space-between'`, which looks odd when there's no description (content height is short)
- **Fix:** Change to `justifyContent: 'flex-start'` with a fixed `gap` between tag and chevron, remove the inline `marginTop: 6` on the chevron

### **8. To-Do — Overdue card left border shifts content**

- `borderLeftWidth: 3` on overdue cards shifts internal content 3px right compared to normal cards, making them look misaligned
- **Fix:** Give all task cards a transparent 3px left border so the content stays in the same position regardless of overdue state

### **9. Spending (Budget) — Section title double margin**

- `sectionTitle` has `marginBottom: 12` AND `sectionHeader` also has `marginBottom: 12`, creating 24px of space between the title and content when used together, but only 12px when the title is used alone (inconsistent)
- **Fix:** Remove `marginBottom` from `sectionTitle` so spacing is controlled only by the parent `sectionHeader`

### **10. Spending — Expense row amount text can overlap description**

- The expense amount in `expenseRight` has no min-width, so short amounts look fine but `+$1,234.56` can crowd the description text
- **Fix:** Add `minWidth: 65` and `textAlign: 'right'` to `expenseAmount` to keep it consistently positioned

### **11. Spending — Pro cards horizontal scroll left clipping**

- Same as dashboard: `prosRow` has no left padding, clipping the first card's shadow
- **Fix:** Add `paddingLeft` to `prosRow` content container

### **12. Trusted Pros — Search row height mismatch**

- The search input wrap height is determined by padding (`paddingVertical: 12`), while the filter toggle button is a fixed `46px` — these can be slightly misaligned
- **Fix:** Set a matching explicit `height: 46` on the search input wrap and use `alignItems: 'center'`

### **13. Trusted Pros — Pro details left padding doesn't match avatar**

- `proDetails` uses `paddingLeft: 58` which should equal avatar width (46) + marginEnd (12) = 58, but `proTagsRow` also uses 58. When the avatar size varies across themes or DPI, this hardcoded value can drift
- **Fix:** This is currently correct but fragile — no change needed now, just noting it

### **14. Recommended Checklist — Uses static `Colors` instead of theme**

- The entire `RecommendedChecklist` component imports `Colors` directly instead of using the theme context, so it won't match when users switch color palettes or dark mode
- **Fix:** Refactor to accept theme colors or use the theme context, converting static `StyleSheet.create` to dynamic styles

### **15. Add Task — Recurring unit buttons can overflow**

- The days/weeks/months/years buttons use inline styles with no `flexWrap`, so on narrow screens they can overflow the card
- **Fix:** Add `flexWrap: 'wrap'` to the unit buttons container and use proper `StyleSheet` styles instead of inline

### **16. Screen Header — Inconsistent padding with tab content**

- `ScreenHeader` uses `paddingHorizontal: 20` while some tab screens use `Spacing.xl` (20) and others use literal `20` — functionally the same but some screens add their own search row with `paddingHorizontal: 20` that doesn't account for the header's `paddingBottom: 4`, creating a tight gap
- **Fix:** Increase `ScreenHeader` `paddingBottom` from 4 to 8 for more breathing room

### **17. Floating Action Button — Bottom position can overlap tab bar on web**

- The FAB uses `bottom: 20` which can sit too close to or behind the tab bar on web where insets differ
- **Fix:** Increase `bottom` to 28 to give more clearance on all platforms

### **18. Export Section — Grid items use `'48%'` width**

- Using percentage strings for width in a flex-wrap row with gap can cause items to not fit on the same row on certain screen sizes
- **Fix:** Calculate width using a more reliable approach or ensure the gap is accounted for

---

### Summary

- **14 actual fixes** across 10 files (style files + components)
- **Primary focus:** text overflow prevention, consistent spacing, flexWrap on rows that can overflow, and theme consistency
- No visual redesign — just precision alignment and overlap prevention

