# Add Swipe Gestures & Native iOS Interactions Across All Pages


After reviewing every screen in the app, here are my recommendations for embedding native iOS-style swipe gestures and quick-action interactions on each page. These follow patterns from Apple's Mail, Reminders, and Notes apps.

---

## 1. To-Do / Schedule Page (My Tasks)

**Swipe Left on a task card → Destructive actions**
- **Delete** (red) — removes the task entirely
- **Archive** (gray) — archives the task

**Swipe Right on a task card → Positive action**
- **Mark as Done** (green checkmark) — completes the task instantly without an alert dialog

*This is the highest-impact addition — users manage tasks frequently and this removes multiple taps.*

---

## 2. My Items / Appliances Page

**Swipe Left on an item card → Quick actions**
- **Delete** (red) — removes the item with confirmation
- **Edit** (blue) — navigates to the edit screen

*Items are less frequently deleted, but the swipe-to-edit shortcut saves navigating into the detail screen first.*

---

## 3. Spending / Budget Page

**Swipe Left on a recent expense row → Quick actions**
- **Delete** (red) — removes the expense
- **Edit** (blue) — navigates to the edit expense screen

*Expenses are the most "list-like" data — swipe actions feel very natural here, similar to banking apps.*

---

## 4. Trusted Pros Page

**Swipe Left on a saved pro card → Destructive action**
- **Remove** (red) — removes the pro from your saved list (replaces the current small trash icon)

**Swipe Right on a saved pro card → Quick contact**
- **Call** (green, phone icon) — instantly dials the pro if they have a phone number

*This replaces the existing small trash icon button with a more native-feeling interaction and adds a quick-call shortcut.*

---

## 5. Dashboard / Home Page

**Swipe Left on an upcoming task card → Quick actions**
- **Mark as Done** (green) — completes the task directly from the dashboard
- **Archive** (gray) — archives it

*Users often see overdue/upcoming tasks on the dashboard and want to act immediately without navigating to the task detail.*

---

## 6. Task Detail Page

**Swipe Left on individual notes → Delete**
- **Delete** (red) — removes the note (replaces the small X button)

*Notes are small list items — swipe-to-delete is more natural than the tiny X icon.*

---

## 7. Provider Detail Page

**Swipe Left on linked items → Unlink**
- **Unlink** (orange) — removes the item-to-pro association

**Swipe Left on private notes → Actions**
- **Delete** (red) — removes the note
- **Edit** (blue) — enters edit mode for that note

**Swipe Left on expense history rows → View**
- **View** (blue) — navigates to the expense detail

---

## 8. Appliance Detail Page

**Swipe Left on maintenance task rows → Quick actions**
- **Mark Done** (green) — completes the task
- **View** (blue) — navigates to the task detail

**Swipe Left on expense rows → View**
- **View** (blue) — navigates to the expense detail

---

## Design & Behavior

- Swipe actions will use a reusable **SwipeableRow** component built with React Native's PanResponder
- Actions reveal colored buttons behind the card as the user swipes (iOS Mail style)
- A subtle haptic tap fires when the action buttons are revealed
- Swipe thresholds: partial swipe reveals buttons; full swipe triggers the primary action automatically
- Works on both iOS and Android; falls back gracefully on web (buttons still accessible via tap)
- All destructive actions (delete/remove) still show a confirmation alert before executing
- Existing tap-to-navigate behavior on all cards remains unchanged

---

## Summary of Changes by Priority

| Priority | Screen | Gesture | Why |
|----------|--------|---------|-----|
| 🔴 High | To-Do | Swipe to complete/delete/archive | Most-used interaction in the app |
| 🔴 High | Spending | Swipe to delete/edit expenses | Very natural for list data |
| 🟡 Medium | Dashboard | Swipe upcoming tasks to complete | Quick action from home screen |
| 🟡 Medium | Trusted Pros | Swipe to remove/call | Replaces small icon buttons |
| 🟡 Medium | My Items | Swipe to delete/edit | Convenience shortcut |
| 🟢 Lower | Task Detail | Swipe notes to delete | Small quality-of-life improvement |
| 🟢 Lower | Provider Detail | Swipe notes/items to act | Consistency with other screens |
| 🟢 Lower | Appliance Detail | Swipe tasks/expenses to act | Consistency with other screens |
