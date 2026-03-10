# RevenueCat Test Store Integration with Paywall

## What's Being Built

Full in-app purchase integration using RevenueCat's Test Store, with a beautiful paywall screen, free tier limits, and premium unlock logic throughout the app.

---

**Features**

- **Two subscription plans**: Monthly and Annual options displayed on a paywall screen
- **Free tier limits**: 3 appliances/items and 5 tasks on the free plan — encourages upgrading
- **Premium unlocks everything**: No limits on items, tasks, expenses, pros, or any feature
- **Paywall appears in two places**:
  - A dedicated "Upgrade to Pro" card in the Profile/Settings screen
  - Automatically shown when a user hits a free tier limit (e.g. trying to add a 4th appliance)
- **Restore purchases**: Button on the paywall to restore previous purchases
- **Subscription status badge**: A small "PRO" badge visible in Profile when subscribed

---

**Design — Paywall Screen**

- Opens as a full-screen modal from the bottom
- Top section with a warm gradient background and a shield/crown icon
- App name and tagline: "Unlock HomeEQ Pro"
- Feature checklist showing what premium includes (unlimited items, tasks, etc.) with checkmark icons
- Two plan cards side-by-side: Monthly and Annual, with the Annual card highlighted as "Best Value" with a savings percentage
- A prominent "Subscribe" button at the bottom
- Small "Restore Purchases" text link below
- Close button (X) in the top corner
- Colors match your current app theme (sage/ocean/slate depending on palette)

---

**Screens & Changes**

1. **New Paywall Screen** — a modal screen showing plans, features, and subscribe/restore buttons
2. **Profile Screen** — adds an "Upgrade to Pro" card in the Account section (or shows "PRO" badge if already subscribed)
3. **Add Appliance flow** — checks if at the 3-item limit; if so, shows the paywall instead
4. **Add Task flow** — checks if at the 5-task limit; if so, shows the paywall instead
5. **Subscription context** — tracks whether the user is premium, fetches offerings from RevenueCat, handles purchases and restores

