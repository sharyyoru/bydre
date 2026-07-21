-- Add requires_password_change flag to users table
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS requires_password_change boolean NOT NULL DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS users_requires_password_change_idx 
  ON users(requires_password_change) 
  WHERE requires_password_change = true;
