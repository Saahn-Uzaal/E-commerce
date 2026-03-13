USE ecommerce_store;

CREATE TABLE IF NOT EXISTS user_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(180) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  role ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer',
  status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_accounts_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  account_id BIGINT UNSIGNED NOT NULL,
  session_token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_sessions_token_hash (session_token_hash),
  KEY idx_user_sessions_account_id (account_id),
  KEY idx_user_sessions_expires_at (expires_at),
  CONSTRAINT fk_user_sessions_account
    FOREIGN KEY (account_id) REFERENCES user_accounts (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

SET @seller_account_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'seller_account_id'
);
SET @seller_account_sql = IF(
  @seller_account_exists = 0,
  'ALTER TABLE products ADD COLUMN seller_account_id BIGINT UNSIGNED NULL AFTER category_id',
  'SELECT 1'
);
PREPARE seller_account_stmt FROM @seller_account_sql;
EXECUTE seller_account_stmt;
DEALLOCATE PREPARE seller_account_stmt;

SET @customer_account_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'customer_account_id'
);
SET @customer_account_sql = IF(
  @customer_account_exists = 0,
  'ALTER TABLE orders ADD COLUMN customer_account_id BIGINT UNSIGNED NULL AFTER order_number',
  'SELECT 1'
);
PREPARE customer_account_stmt FROM @customer_account_sql;
EXECUTE customer_account_stmt;
DEALLOCATE PREPARE customer_account_stmt;
