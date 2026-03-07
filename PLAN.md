# Phase 2: Household Sharing — Invite family members to manage your home together

## What's Being Built

Turn HomeEQ from a single-user app into a shared household app. The home owner creates a household, shares an invite link, and anyone who joins sees and can edit the same appliances, tasks, budget, trusted pros, and home profile — all in real time.

---

### **Features**

- **Create a household** — When you sign in, your account becomes the "owner" of a household. All your existing data moves into this shared household space.
- **Invite via link** — Tap "Invite Member" in the Profile tab to generate a unique invite link. Share it via text, email, or any messaging app.
- **Join a household** — When someone taps the invite link and opens the app, they sign in (or create an account) and are automatically added to the household.
- **Full shared access** — Every household member can view and edit everything: appliances, tasks, budget, trusted pros, and the home profile.
- **See who's in your household** — The Profile tab shows all members with their name, role, and status (pending or joined).
- **Remove members** — The owner can remove any member from the household.
- **Leave a household** — Members (non-owners) can choose to leave.
- **Data refreshes on app open** — When you open the app or pull to refresh, you'll see the latest changes from other household members.

---

### **Design**

- The **Cloud & Account** section in the Profile tab expands to show household info:
  - If you're the owner: member list + "Invite Member" button
  - If you're a member: household name, owner info, and "Leave Household" option
- **Invite flow**: Tapping "Invite Member" shows a share sheet with a unique link. The link opens the app directly (or the App Store if not installed).
- **Join flow**: A new "Join Household" screen appears when someone opens an invite link. Clean confirmation screen showing the household name and who invited them.
- The existing household member UI in the Profile tab gets connected to real backend data instead of just being local.

---

### **Screens / Changes**

1. **Profile tab — Cloud & Account section** (updated)
   - Shows household members pulled from the server (not just local)
   - "Invite Member" generates a real invite link and opens the share sheet
   - Owner can remove members; non-owners see "Leave Household"

2. **Join Household screen** (new)
   - Appears when someone opens an invite link
   - Shows household name and inviter
   - "Join" button adds them to the household and syncs all shared data to their device

3. **Backend — Household endpoints** (new)
   - Create household, generate invite link, join via invite, list members, remove member, leave household
   - Sync endpoints updated to read/write from the household's shared data instead of per-user data

4. **Sync logic update**
   - When a user belongs to a household, all data is stored under the household (not the individual user)
   - Pull/push operations use the household's data, so everyone sees the same appliances, tasks, budget, etc.
   - Refresh happens on app open and pull-to-refresh

5. **Deep link handling**
   - Invite links (e.g. `homeeq://join/INVITE_CODE`) are handled by the app
   - If the user isn't signed in, they go to sign-in first, then auto-join after authentication
