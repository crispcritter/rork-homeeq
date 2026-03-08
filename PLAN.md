# Add Subscription with Paywall (RevenueCat)

## What's Being Built

A subscription system powered by RevenueCat with a polished paywall screen that appears on first launch. Two plans: **$2.99/month** or **$29.99/year**. No free trial.

---

### **Features**

- **Subscription required to use the app** — On first launch (and if not subscribed), users see a full-screen paywall before accessing any content
- **Two pricing options** — Monthly ($2.99/mo) and Annual ($29.99/yr, saves ~17%) displayed as toggle or selectable cards
- **Premium-gated features** — Three categories locked behind the subscription:
  - **AI features**: Photo scanning, barcode lookup, AI-generated maintenance recommendations
  - **Household sharing**: Creating/joining households, inviting members, shared data
  - **Data export**: Exporting appliance, task, and budget data
- **Restore purchases** — A "Restore Purchases" link on the paywall for users who already subscribed on another device
- **Manage subscription from Profile** — A subscription status section in the Profile screen showing current plan, renewal date, and a manage/upgrade option
- **Graceful handling** — If a subscription expires, the paywall reappears. Purchase errors show clear messages with retry options.

---

### **Design**

- **Paywall screen**: Feature showcase style with the app's existing color palette
  - Top section: App logo/icon with a warm headline like "Unlock HomeEQ"
  - Middle: Three premium feature cards with icons — AI-powered tools, Household sharing, Data export — each with a short description
  - Bottom: Two pricing cards (Monthly / Annual) with the annual one highlighted as "Best Value"
  - Large "Subscribe" button at the bottom, with a smaller "Restore Purchases" link below it
  - A subtle "Continue with limited access" link if you want to allow browsing (or this is omitted since paywall is required on launch)
- **Profile screen addition**: A new "Subscription" section near the top showing plan name, status badge, and renewal info
- **Lock indicators**: Small lock icons on AI, Household, and Export features for non-subscribers (fallback if paywall is dismissed)

---

### **Screens / Changes**

1. **Paywall screen** (new) — Full-screen modal that appears before the app content on first launch or when subscription is inactive
2. **Subscription context/provider** (new) — Tracks whether the user has an active subscription, which plan they're on, and provides purchase/restore functions
3. **Profile screen** (updated) — New subscription info section with plan details and manage button
4. **RevenueCat setup** (new) — Configure three store apps (Test Store, iOS App Store, Google Play Store), create products and offerings, set environment variables
5. **Feature gates** (updated) — AI features, household sharing, and data export check subscription status before proceeding; if not subscribed, the paywall appears