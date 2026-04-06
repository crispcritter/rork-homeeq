# Codebase Refinement — Clean Up Inconsistencies & Inefficiencies


After reviewing all critical files, here are the issues found and the plan to fix them — grouped by priority. None of these changes will alter functionality or user experience.

---

## 1. Duplicate Profile Button Code
The Home tab layout (`(home)/_layout.tsx`) has its own profile button + avatar styles, duplicating what `TabStackLayout` already provides. The other 4 tabs all use `TabStackLayout` correctly. The Home tab should use it too (passing the dynamic nickname as the title), eliminating ~40 lines of duplicate code.

## 2. Duplicate Cloud Sync Logic
Both `HomeContext` and `AuthContext` contain nearly identical `pushToCloud` code — the same block that gathers all query data and calls `trpcClient.sync.push.mutate(...)`. This should be extracted into a single shared helper (e.g., `utils/cloudSync.ts`) that both contexts call, so changes only need to happen in one place.

## 3. Redundant `as const` in Style Objects
Several style files include `as const` on literal style values (e.g., `justifyContent: 'center' as const`). Inside `StyleSheet.create()` these casts are unnecessary. Removing them tidies the code without any behavior change.

## 4. `useMemo` Overuse on Simple Primitives
In `HomeContext`, values like `monthlyBudget` and `sectionsDefaultOpen` are wrapped in `useMemo` unnecessarily — they're just pulling a single value from query data with a fallback. Simple variable assignments are sufficient and clearer.

## 5. Unused `exportAnim` in ExportSection
`ExportSection` creates an `Animated.Value` (`exportAnim`) and animates it on toggle, but the animated value is never connected to any style or interpolation — it runs in the background doing nothing. It should either be removed or actually wired up to animate the expand/collapse.

## 6. `any` Type Usage in SubscriptionContext
`SubscriptionContext` uses `any` in two catch blocks (`e: any`) and on the `onError` handler. These should use proper error typing (`unknown` or the RevenueCat error type) for type safety.

## 7. Inconsistent `Date.now()` vs `generateId()` for IDs
`addProPrivateNote` uses `` `note-${Date.now()}` `` for generating note IDs, while the rest of the app uses `generateId()` (which uses crypto). This should be unified to use `generateId('note')` for consistency.

## 8. `duplicateRecommendedItem` uses `Date.now()` for IDs
Same issue — `` `rec-custom-${Date.now()}` `` should be `generateId('rec')`.

## 9. Hardcoded Colors in ExportSection
The export grid icons use hardcoded colors (e.g., `#4F46E5`, `#DC2626`, `#EA580C`, `#16A34A`) instead of using the theme's color scheme. These should reference theme colors so they adapt to the selected palette and dark mode.

## 10. Missing `staleTime` on HomeContext Queries
All queries in `HomeContext` (appliances, tasks, budget, etc.) lack `staleTime`, meaning every re-render can trigger an unnecessary refetch from AsyncStorage. Adding a reasonable `staleTime` (e.g., 5 minutes) prevents redundant reads.

## 11. `Colors` Default Export is Unused
`constants/colors.ts` exports a default `Colors` object (line 245–246) which is the raw `defaultLight` scheme. No file in the codebase imports it — everything correctly uses the theme context. This dead export should be removed.

---

**Summary**: 11 targeted fixes — mostly deduplication, type cleanup, and small consistency improvements. No screens change, no features are added or removed, no visual changes except export icons respecting the theme.
