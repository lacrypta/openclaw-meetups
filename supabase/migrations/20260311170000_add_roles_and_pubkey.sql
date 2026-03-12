-- Add pubkey and role to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS pubkey TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'manager', 'admin'));
CREATE INDEX IF NOT EXISTS idx_users_pubkey ON users(pubkey);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create admin user with the current ALLOWED_PUBKEYS value
INSERT INTO users (name, email, pubkey, role)
VALUES ('Admin', 'admin@openclaw.lacrypta.ar', 'e5c1a30bfe9db1fc2ae3284da2cec7a3c3e67fb3ca699d4d05a3f1b3c64f862f', 'admin')
ON CONFLICT (pubkey) DO UPDATE SET role = 'admin';
