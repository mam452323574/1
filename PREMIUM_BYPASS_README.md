# Premium Limits Bypass Configuration

This document explains the temporary bypass of premium restrictions implemented in the application.

## What Was Changed

Premium scan limits have been temporarily disabled to allow unlimited access for all users during development and testing.

### Modified Files

1. **`supabase/functions/check-and-record-scan/index.ts`**
   - Added `BYPASS_PREMIUM_LIMITS = true` constant
   - Modified limit checking logic to skip enforcement when bypass is enabled
   - All scan recording functionality remains active

2. **`constants/scan.ts`**
   - Added `BYPASS_PREMIUM_LIMITS = true` export
   - All limit configurations remain intact

3. **`components/FeatureGate.tsx`**
   - Modified premium check to: `BYPASS_PREMIUM_LIMITS || userProfile?.account_tier === 'premium'`
   - All premium UI components remain unchanged

4. **`contexts/NotificationContext.tsx`**
   - Added `useCallback` wrapper around `checkForAchievements`
   - Fixed infinite re-render issue by properly memoizing the function

5. **`screens/HomeScreen.tsx`**
   - Added `checkForAchievements` to useEffect dependencies
   - Ensures proper React lifecycle management

6. **`services/api.ts`**
   - Temporarily disabled `analysis_result` column query in `getNutritionHistory`
   - Returns empty array until database migration is applied
   - Added error handling to prevent crashes

## How It Works

### Backend (Edge Function)
```typescript
const BYPASS_PREMIUM_LIMITS = true;

// In the limit checking logic:
if (!BYPASS_PREMIUM_LIMITS && validTimestamps.length >= limit.count) {
  // Return limit exceeded error
}
// Otherwise, allow the scan
```

### Frontend (FeatureGate)
```typescript
import { BYPASS_PREMIUM_LIMITS } from '@/constants/scan';

const isPremium = BYPASS_PREMIUM_LIMITS || userProfile?.account_tier === 'premium';
```

## Benefits

- ✅ All users can perform unlimited scans of all types
- ✅ Scan recording and analytics continue to work
- ✅ All premium UI remains intact and testable
- ✅ Easy to re-enable limits later
- ✅ No code deletion - everything is preserved

## Re-enabling Premium Limits

To restore premium restrictions, simply change the flag in **2 locations**:

### 1. Edge Function
**File:** `supabase/functions/check-and-record-scan/index.ts`
```typescript
const BYPASS_PREMIUM_LIMITS = false; // Change to false
```

Then redeploy the edge function.

### 2. Client Constants
**File:** `constants/scan.ts`
```typescript
export const BYPASS_PREMIUM_LIMITS = false; // Change to false
```

That's it! The entire premium system will be re-enabled.

## Current Scan Limits (When Enabled)

### Free Tier
- **Health (Face):** 1 scan per week
- **Body:** 1 scan per month
- **Nutrition:** 1 scan every 3 days

### Premium Tier
- **Health (Face):** 3 scans per day
- **Body:** 3 scans per day
- **Nutrition:** 3 scans per day

## Database Migration Status

⚠️ **Pending:** The `analysis_result` column migration has not been applied yet.

**Migration file:** `supabase/migrations/20251107000000_add_analysis_result_to_scans.sql`

This migration adds a JSONB column to store nutrition analysis results. Until applied:
- Nutrition history charts will show empty data
- All other scan functionality works normally

To apply the migration, you'll need to:
1. Access the Supabase SQL editor
2. Run the migration SQL manually
3. Or use the Supabase CLI: `supabase db push`

## Bug Fixes Applied

### 1. Infinite Re-render Loop
- **Issue:** `checkForAchievements` function was causing infinite useEffect loops
- **Fix:** Wrapped function in `useCallback` with proper dependencies
- **Files:** `contexts/NotificationContext.tsx`, `screens/HomeScreen.tsx`

### 2. Missing Column Error
- **Issue:** `getNutritionHistory` was querying non-existent `analysis_result` column
- **Fix:** Temporarily removed column from query, returns empty data
- **File:** `services/api.ts`

### 3. React Native Web Warnings
- **Status:** These are library-level warnings from react-native-svg and gesture-handler
- **Impact:** Cosmetic only, doesn't affect functionality
- **Note:** Will be resolved with library updates

## Testing Checklist

- [ ] Can create unlimited body scans
- [ ] Can create unlimited health scans
- [ ] Can create unlimited nutrition scans
- [ ] Scan history displays correctly
- [ ] Analytics page loads without errors
- [ ] No infinite re-render loops
- [ ] Premium upgrade UI still visible
- [ ] Account settings show tier correctly

## Notes

- All scan usage is still being recorded in the database
- Analytics and history features continue to work
- Premium upgrade flows remain testable
- User tiers (free/premium) are still tracked
- Easy rollback by changing 2 boolean flags
