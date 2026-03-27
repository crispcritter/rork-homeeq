# iOS App Store Submission Readiness Fixes

## Summary

Several critical gaps and issues need to be addressed before the app can pass iOS App Store review. Here's everything I found and how I'll fix it.

---

### 🔴 Critical (App Store Rejection Risks)

**1. Add Privacy Policy & Terms of Service**

- [x] Add a new "Legal" section in the Profile/Settings screen with links to Privacy Policy and Terms of Service
- [x] Create placeholder in-app screens that display basic privacy policy and terms text (you'll want to replace with real legal text before submission)
- [x] Add these links to the paywall screen as well (Apple requires them near subscription purchase buttons)

**2. Add Account Deletion**

- [x] Add a "Delete Account" button in the Profile screen under the account/cloud sync section
- [x] Show a confirmation dialog warning the user this is permanent
- [x] Add a backend endpoint to delete the user's account, sessions, and associated cloud data
- [x] After deletion, sign the user out and clear local auth tokens

**3. Add Subscription Legal Text to Paywall**

- [x] The paywall is missing links to Privacy Policy and Terms of Service (required by Apple for auto-renewing subscriptions)
- [x] Add tappable links below the existing legal disclaimer text

---

### 🟡 Important (Quality & Dark Mode Fixes)

**4. Fix Dark Mode on Profile Screen**

- [x] The profile screen (the longest screen in the app) uses hardcoded `Colors.xxx` in ~100+ style references instead of the dynamic theme colors
- [x] Convert all hardcoded color references in the stylesheet to use the theme-aware `c.xxx` pattern, matching how other screens work

**5. Make Splash Animation Theme-Aware**

- [x] The splash screen currently hardcodes light-mode colors (cream background, sage green icon)
- [x] Pass theme colors into the splash so it matches the user's selected theme on launch

**6. Fix Not Found Screen for Dark Mode**

- [x] The 404/not-found screen also uses static `Colors` import instead of theme colors

---

### 🟢 Minor (Polish & Best Practices)

**7. Add "Restore Purchases" Accessibility**

- [x] Ensure the "Restore Purchases" button on the paywall is clearly visible and accessible (it's already there, verified it meets Apple's guidelines)

**8. Add `NSCameraUsageDescription` and permission strings**

- [x] The app uses the camera (for profile photos) — added required iOS permission description strings to `app.json`

---

### Screens Affected

- **Profile screen** — Account deletion button, legal links section, dark mode color fixes
- **Paywall screen** — Privacy Policy & Terms links added
- **Splash animation** — Theme-aware colors
- **Not Found screen** — Theme-aware colors
- **New "Privacy Policy" screen** — Placeholder legal text
- **New "Terms of Service" screen** — Placeholder legal text
- **Backend** — New account deletion endpoint
