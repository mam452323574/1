/*
  # Allow Duplicate Usernames

  ## Overview
  This migration removes the unique constraint on usernames to allow multiple users
  to choose the same username. Usernames now serve as display names rather than
  unique identifiers.

  ## Schema Changes

  ### 1. Drop Username Unique Constraint
  - Remove the unique index on username column in user_profiles
  - This allows multiple users to have identical usernames
  - Each user account remains uniquely identified by their user ID

  ### 2. User Identification
  - User profiles continue to be linked to Supabase Auth user IDs (primary key)
  - All data access and RLS policies are based on unique user IDs, not usernames
  - Usernames are now purely cosmetic display names

  ## Security
  - Maintain all existing RLS policies based on user IDs
  - No changes to authentication security model
  - Each user account remains isolated by its unique user ID

  ## Notes
  - Users can now freely choose any username without checking availability
  - Multiple users can have identical usernames
  - The system relies on user IDs for all data operations and user identification
  - This simplifies the signup and username setup flows
*/

-- Drop the unique constraint on username
DROP INDEX IF EXISTS idx_user_profiles_username_unique;

-- Add a comment explaining the new behavior
COMMENT ON COLUMN user_profiles.username IS
  'Display name chosen by the user. Multiple users can share the same username. User identification is always based on the unique user ID.';