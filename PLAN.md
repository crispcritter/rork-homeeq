# Fix theme color inconsistencies across the entire app

## Problem
When you change the color palette (e.g. from Sage green to Ocean blue), several pages still show the old default green colors. The biggest offender is the **Add/Edit Appliance** form, but many detail pages also have colors that don't respond to palette changes.

## What will be fixed

### 1. Appliance Form (Add & Edit) — **Critical**
- The entire appliance form currently ignores your chosen palette
- All colors (buttons, inputs, labels, cards, category chips, scan cards, save button) will be updated to use your active theme
- The style file will be converted from static colors to dynamic theme-aware styles

### 2. Appliance Detail Page
- Warranty status icons, detail icons, manual search buttons, app info section, star ratings, and AI recommendation cards all use hardcoded colors
- These will be mapped to appropriate theme colors (primary, accent, warning, success, etc.)

### 3. Task Detail Page
- Calendar, reminder, and status icons use hardcoded blues/greens
- Star ratings and action buttons will use theme colors
- Note: Brand-specific colors (YouTube red, Amazon orange) will remain as-is since those represent external brands

### 4. Swipe Action Colors (All List Pages)
- Home, Schedule, Appliances, Budget, and Pros pages all have hardcoded swipe action colors
- "Complete" actions will use the theme's success color
- "Edit" actions will use the theme's primary color
- "Delete" actions already mostly use theme danger color
- "Archive" actions will use the theme's text secondary color

### 5. Provider Detail Page
- Edit and unlink swipe actions use hardcoded blue/amber
- Will be updated to use theme primary and warning colors

### 6. Home Dashboard
- Provider color dots use a hardcoded array — will derive from theme palette instead

## What stays the same
- Paywall page (uses its own branded gradient design — intentional)
- Privacy policy page (simple utility page)
- Brand-specific colors (YouTube red, Amazon orange) — these represent real brands
- Color guide page (shows all palette colors — working correctly)
