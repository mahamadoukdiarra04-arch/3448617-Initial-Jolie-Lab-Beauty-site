CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(32) NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(80) NOT NULL,
  customer_city VARCHAR(120) NOT NULL,
  customer_area VARCHAR(160) NOT NULL,
  customer_address VARCHAR(500) NOT NULL,
  customer_notes TEXT NULL,
  payment_method VARCHAR(80) NOT NULL DEFAULT 'Paiement à la livraison',
  products_total INT UNSIGNED NOT NULL DEFAULT 0,
  delivery_fee INT UNSIGNED NULL,
  final_total INT UNSIGNED NULL,
  status ENUM(
    'new',
    'pending_confirmation',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_order_number (order_number),
  KEY idx_orders_status_created (status, created_at),
  KEY idx_orders_phone (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(80) NOT NULL,
  product_slug VARCHAR(180) NULL,
  product_name VARCHAR(255) NOT NULL,
  variant_id VARCHAR(80) NULL,
  variant_name VARCHAR(180) NULL,
  unit_price INT UNSIGNED NOT NULL DEFAULT 0,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  line_total INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order_id (order_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(80) NOT NULL,
  price INT UNSIGNED NOT NULL DEFAULT 0,
  price_note VARCHAR(180) NULL,
  description MEDIUMTEXT NOT NULL,
  summary TEXT NULL,
  usage_note TEXT NULL,
  suited_for TEXT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 9999,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_active_sort (is_active, sort_order, name),
  KEY idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 9999,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_categories_name (name),
  UNIQUE KEY uq_product_categories_slug (slug),
  KEY idx_product_categories_sort (sort_order, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  type ENUM('image', 'video') NOT NULL,
  url VARCHAR(1000) NOT NULL,
  title VARCHAR(255) NULL,
  alt VARCHAR(255) NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_media_product (product_id, type, sort_order),
  CONSTRAINT fk_product_media_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_key VARCHAR(80) NOT NULL,
  name VARCHAR(180) NOT NULL,
  price INT UNSIGNED NOT NULL DEFAULT 0,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_variants_key (product_id, variant_key),
  KEY idx_product_variants_product (product_id, sort_order),
  CONSTRAINT fk_product_variants_product
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id BIGINT UNSIGNED NULL,
  endpoint VARCHAR(2048) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  user_agent VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  failure_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_status_code SMALLINT UNSIGNED NULL,
  last_success_at TIMESTAMP NULL,
  last_error_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_push_endpoint (endpoint(255)),
  KEY idx_admin_push_active (is_active, updated_at),
  KEY idx_admin_push_user (admin_user_id),
  CONSTRAINT fk_admin_push_user
    FOREIGN KEY (admin_user_id)
    REFERENCES admin_users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
