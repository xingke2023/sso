ALTER TABLE oauth_accounts
  MODIFY COLUMN provider ENUM('google','wechat','wechat_miniapp') NOT NULL;
