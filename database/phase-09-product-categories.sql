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

INSERT IGNORE INTO product_categories (name, slug, sort_order) VALUES
('Visage', 'visage', 10),
('Corps', 'corps', 20),
('Corps & Visage', 'corps-visage', 30),
('Cheveux', 'cheveux', 40),
('Packs', 'packs', 50),
('Accessoires', 'accessoires', 60),
('Maquillage', 'maquillage', 70),
('Homme', 'homme', 80),
('Homme & Femme', 'homme-femme', 90),
('Parfum', 'parfum', 100);
