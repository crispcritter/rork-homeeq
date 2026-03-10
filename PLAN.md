# Add Subscription Paywall with RevenueCat

## Features

- **Subscription plans**: Monthly ($2.99/mo) and Annual ($29.99/yr) options
- **Paywall screen**: A beautiful, dedicated screen that shows the two subscription plans with feature highlights
- **Restore purchases**: Button to restore existing subscriptions on a new device
- **Subscription status tracking**: The app knows whether you're a free or premium user
- **Gate premium features**: AI-powered features (photo scanning, barcode lookup, maintenance recommendations) require a subscription
- **Manage subscription**: View your current plan and subscription status from settings/profile

## Design

- **Paywall screen** with a clean, modern card-based layout — not a generic template
- Two plan cards (Monthly & Annual) with the annual plan highlighted as "Best Value" showing savings
- A prominent "Start Free Trial" or "Subscribe" button at the bottom
- Feature list showing what's included in premium (AI appliance scanning, smart maintenance recommendations, etc.)
- Subtle animations on plan selection
- Matches the existing app theme and color system

## Screens

- **Paywall screen**: Opens as a modal from anywhere in the app — shows plans, features, and subscribe/restore buttons
- **Profile updates**: Subscription status badge and "Manage Subscription" option added to the existing profile screen

## Setup Required (Before I Can Build)

RevenueCat is **not yet connected** to this project. Before implementation, the following needs to happen:

1. **Connect RevenueCat** to the project (I'll handle this automatically)
2. **Create 3 store apps** in RevenueCat: Test Store, App Store, and Play Store
3. **Set up products**: Monthly and Annual subscription products in all 3 stores
4. **Configure entitlements**: A "pro" entitlement linked to both products
5. **Set environment variables**: 3 API keys (Test, iOS, Android)

All of this will be configured as part of the implementation.
