/*
  # Remove Email Unique Constraint

  ## Overview
  This migration removes the unique constraint on email addresses to allow
  multiple authentication methods (email/password, Google, Apple) to use
  the same email address for different user accounts.

  ## Schema Changes

  ### 1. Drop Unique Email Constraint
  - Remove the unique index on email column in user_profiles
  - This allows the same email to be used with different authentication providers
  - Each authentication method creates a separate user account

  ### 2. Keep User ID as Primary Association
  - User profiles are linked to Supabase Auth user IDs, not emails
  - Each authentication session maintains its own user ID and profile
  - Usernames remain permanently associated with their user ID

  ## Security
  - Maintain all existing RLS policies based on user IDs
  - No changes to authentication security model
  - Each user account remains isolated by its unique user ID

  ## Notes
  - This reverts the email-based account linking behavior
  - Users can now have separate accounts for different authentication methods
  - Reconnecting with the same method will use the same user ID and profile
*/

-- Drop the unique constraint on email if it exists
DROP INDEX IF EXISTS idx_user_profiles_email_unique;

-- Drop the email lookup index as it's no longer needed for uniqueness
DROP INDEX IF EXISTS idx_user_profiles_email_lower;

-- Add a comment explaining the new behavior
COMMENT ON COLUMN user_profiles.email IS
  'Email address associated with this user profile. Multiple profiles can share the same email if using different authentication providers.';
