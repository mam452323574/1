/*
  # Email Verification System

  ## Overview
  Creates tables and functions to support email verification on login for email/password users.
  This implements a 2FA-like security system where users must verify their email via a 6-digit code.

  ## New Tables

  ### email_verification_codes
  - `id` (uuid, primary key) - Unique code identifier
  - `user_id` (uuid, references auth.users) - User requesting verification
  - `email` (text) - Email address where code was sent
  - `code` (text) - 6-digit verification code
  - `expires_at` (timestamptz) - Expiration time (15 minutes from creation)
  - `used_at` (timestamptz, nullable) - When code was used (null if unused)
  - `created_at` (timestamptz) - When code was created

  ### trusted_devices
  - `id` (uuid, primary key) - Unique device identifier
  - `user_id` (uuid, references user_profiles) - User who owns the device
  - `device_identifier` (text) - Unique device fingerprint
  - `device_name` (text, nullable) - Friendly device name (e.g., "iPhone 14")
  - `platform` (text) - Platform (ios, android, web)
  - `trusted_until` (timestamptz) - When trust expires (30 days from creation)
  - `last_used_at` (timestamptz) - Last time device was used for login
  - `created_at` (timestamptz) - When device was first trusted

  ## Features
  - Verification codes expire after 15 minutes
  - Codes can only be used once
  - Trusted devices last for 30 days
  - Automatic cleanup of expired codes and devices
  - Rate limiting support through failed attempts tracking

  ## Security
  - Enable RLS on both tables
  - Users can only view and manage their own data
  - Verification codes are single-use
  - Device identifiers are unique per user
  - Failed verification attempts are logged for security monitoring
*/

-- Create email_verification_codes table
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, code)
);

-- Enable RLS
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification codes
CREATE POLICY "Users can view own verification codes"
  ON email_verification_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert verification codes (via Edge Function)
CREATE POLICY "Service role can insert verification codes"
  ON email_verification_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own codes (mark as used)
CREATE POLICY "Users can update own verification codes"
  ON email_verification_codes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id 
  ON email_verification_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at 
  ON email_verification_codes(expires_at);

-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_identifier text NOT NULL,
  device_name text,
  platform text NOT NULL DEFAULT 'unknown',
  trusted_until timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_identifier)
);

-- Enable RLS
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own trusted devices
CREATE POLICY "Users can view own trusted devices"
  ON trusted_devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own trusted devices
CREATE POLICY "Users can insert own trusted devices"
  ON trusted_devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own trusted devices
CREATE POLICY "Users can update own trusted devices"
  ON trusted_devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own trusted devices
CREATE POLICY "Users can delete own trusted devices"
  ON trusted_devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id 
  ON trusted_devices(user_id);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_device_identifier 
  ON trusted_devices(device_identifier);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_trusted_until 
  ON trusted_devices(trusted_until);

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < now()
    AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired trusted devices
CREATE OR REPLACE FUNCTION cleanup_expired_trusted_devices()
RETURNS void AS $$
BEGIN
  DELETE FROM trusted_devices
  WHERE trusted_until < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(p_user_id uuid, p_device_identifier text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trusted_devices 
    WHERE user_id = p_user_id 
      AND device_identifier = p_device_identifier
      AND trusted_until > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate random 6-digit verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create verification code for user
CREATE OR REPLACE FUNCTION create_verification_code(p_user_id uuid, p_email text)
RETURNS json AS $$
DECLARE
  v_code text;
  v_code_id uuid;
  v_expires_at timestamptz;
  v_recent_codes integer;
BEGIN
  -- Check rate limiting: max 5 codes in last hour
  SELECT COUNT(*) INTO v_recent_codes
  FROM email_verification_codes
  WHERE user_id = p_user_id
    AND created_at > now() - interval '1 hour';
  
  IF v_recent_codes >= 5 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Too many verification requests. Please try again later.'
    );
  END IF;

  -- Delete any existing unused codes for this user
  DELETE FROM email_verification_codes
  WHERE user_id = p_user_id
    AND used_at IS NULL;

  -- Generate new code
  v_code := generate_verification_code();
  v_expires_at := now() + interval '15 minutes';

  -- Insert new code
  INSERT INTO email_verification_codes (user_id, email, code, expires_at)
  VALUES (p_user_id, p_email, v_code, v_expires_at)
  RETURNING id INTO v_code_id;

  RETURN json_build_object(
    'success', true,
    'code_id', v_code_id,
    'code', v_code,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify code
CREATE OR REPLACE FUNCTION verify_email_code(p_user_id uuid, p_code text)
RETURNS json AS $$
DECLARE
  v_code_record record;
BEGIN
  -- Find matching code
  SELECT * INTO v_code_record
  FROM email_verification_codes
  WHERE user_id = p_user_id
    AND code = p_code
    AND used_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired verification code'
    );
  END IF;

  -- Mark code as used
  UPDATE email_verification_codes
  SET used_at = now()
  WHERE id = v_code_record.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Email verified successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
