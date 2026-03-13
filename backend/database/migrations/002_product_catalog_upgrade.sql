USE ecommerce_store;

SET @badge_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'badge'
);
SET @badge_sql = IF(
  @badge_exists = 0,
  'ALTER TABLE products ADD COLUMN badge VARCHAR(80) NULL AFTER sku',
  'SELECT 1'
);
PREPARE badge_stmt FROM @badge_sql;
EXECUTE badge_stmt;
DEALLOCATE PREPARE badge_stmt;

SET @gradient_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'gradient'
);
SET @gradient_sql = IF(
  @gradient_exists = 0,
  'ALTER TABLE products ADD COLUMN gradient VARCHAR(255) NULL AFTER description',
  'SELECT 1'
);
PREPARE gradient_stmt FROM @gradient_sql;
EXECUTE gradient_stmt;
DEALLOCATE PREPARE gradient_stmt;

SET @primary_image_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'primary_image_url'
);
SET @primary_image_sql = IF(
  @primary_image_exists = 0,
  'ALTER TABLE products ADD COLUMN primary_image_url VARCHAR(255) NULL AFTER gradient',
  'SELECT 1'
);
PREPARE primary_image_stmt FROM @primary_image_sql;
EXECUTE primary_image_stmt;
DEALLOCATE PREPARE primary_image_stmt;

SET @material_note_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'material_note'
);
SET @material_note_sql = IF(
  @material_note_exists = 0,
  'ALTER TABLE products ADD COLUMN material_note VARCHAR(255) NULL AFTER primary_image_url',
  'SELECT 1'
);
PREPARE material_note_stmt FROM @material_note_sql;
EXECUTE material_note_stmt;
DEALLOCATE PREPARE material_note_stmt;

SET @shipping_note_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'shipping_note'
);
SET @shipping_note_sql = IF(
  @shipping_note_exists = 0,
  'ALTER TABLE products ADD COLUMN shipping_note VARCHAR(255) NULL AFTER material_note',
  'SELECT 1'
);
PREPARE shipping_note_stmt FROM @shipping_note_sql;
EXECUTE shipping_note_stmt;
DEALLOCATE PREPARE shipping_note_stmt;

SET @fit_note_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'fit_note'
);
SET @fit_note_sql = IF(
  @fit_note_exists = 0,
  'ALTER TABLE products ADD COLUMN fit_note VARCHAR(255) NULL AFTER shipping_note',
  'SELECT 1'
);
PREPARE fit_note_stmt FROM @fit_note_sql;
EXECUTE fit_note_stmt;
DEALLOCATE PREPARE fit_note_stmt;

CREATE TABLE IF NOT EXISTS product_highlights (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  content VARCHAR(255) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_highlights_product_sort (product_id, sort_order),
  KEY idx_product_highlights_product_id (product_id),
  CONSTRAINT fk_product_highlights_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;
