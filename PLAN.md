# Add RevenueCat Test Store Subscription Flow

**Features**
- Connect to your RevenueCat Test Store on app launch
- Display a paywall screen showing your two subscription options: $2.99/month and $29.99/year
- Allow test purchases through the RevenueCat Test Store (works in the web preview and on device)
- Restore previous purchases
- Show current subscription status (free vs. premium) in the app
- Gate premium features behind the subscription (ready for you to choose which features later)

**Design**
- Paywall presented as a full-screen modal with a clean, warm aesthetic matching your app's existing color palette
- Bold headline at top with a short value proposition
- Two plan cards side by side — monthly and yearly — with the yearly card highlighted as "Best Value" showing the savings
- A prominent "Subscribe" button that changes based on the selected plan
- A subtle "Restore Purchases" link at the bottom
- Small "Already subscribed" badge on the profile/settings area when active
- Smooth fade-in animation when the paywall appears

**Screens & Flow**
1. **Paywall Screen** — New modal screen accessible from the home tab or profile; shows the two plans and handles the purchase
2. **Profile / Settings** — Updated to show subscription status and a link to manage or view the paywall
3. **Subscription Context** — Behind the scenes, tracks whether the user is a premium subscriber so any screen can check access

**What this enables**
- You'll be able to open the app, tap to view the paywall, and complete a test purchase using RevenueCat's Test Store — no Apple or Google account needed
- Once you're happy with the flow, we'll swap in the real App Store keys for production
