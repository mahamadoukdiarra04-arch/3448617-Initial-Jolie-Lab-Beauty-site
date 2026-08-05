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
