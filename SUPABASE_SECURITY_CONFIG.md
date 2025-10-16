# Supabase Security Configuration

This document outlines manual security configurations that must be enabled in the Supabase dashboard.

## Critical Security Settings

### 1. Leaked Password Protection

**Status:** ⚠️ Requires Manual Configuration

**Description:**
Supabase Auth can prevent users from using compromised passwords by checking against the HaveIBeenPwned.org database. This is a critical security feature that helps protect user accounts.

**How to Enable:**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to the **Security** section
4. Find the setting **"Enable leaked password protection"**
5. Toggle it **ON**
6. Click **Save** to apply changes

**What it does:**
- When enabled, Supabase checks new passwords and password changes against the HaveIBeenPwned database
- If a password appears in known data breaches, the user will be required to choose a different password
- This happens automatically without storing or transmitting the actual password

**Recommendation:**
✅ **Enable this immediately** for production environments

---

## Additional Recommended Settings

### 2. Email Confirmations

**Location:** Authentication → Settings → Email Auth

Consider enabling:
- **Confirm email** - Requires users to verify their email before accessing the app
- **Secure email change** - Requires confirmation when changing email addresses

### 3. Rate Limiting

**Location:** Authentication → Rate Limits

Review and adjust rate limits for:
- **Sign up attempts** - Prevent spam registrations
- **Sign in attempts** - Prevent brute force attacks
- **Password reset requests** - Prevent abuse

### 4. Session Management

**Location:** Authentication → Settings

Configure:
- **JWT expiry** - How long access tokens remain valid (default: 1 hour)
- **Refresh token rotation** - Enable for enhanced security
- **Session timeout** - Automatically log out inactive users

---

## Database Security - Already Configured ✅

The following security measures have been implemented via migrations:

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Optimized RLS policies using `(select auth.uid())`
- ✅ Immutable search paths on all database functions
- ✅ Proper indexes for performance
- ✅ Secure function definitions with SECURITY DEFINER

---

## Verification

After enabling leaked password protection, verify it's working by:

1. Attempting to sign up with a known weak password (e.g., "password123")
2. The system should reject it and prompt for a stronger password
3. Check the Supabase logs to confirm the password check is occurring

---

## Support

For questions about these security settings:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/security-best-practices)
- [HaveIBeenPwned Integration](https://supabase.com/docs/guides/auth/passwords#password-security)
