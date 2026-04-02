ALTER TABLE users
  ADD COLUMN username VARCHAR(50) UNIQUE NULL AFTER email,
  ADD INDEX idx_username (username);
