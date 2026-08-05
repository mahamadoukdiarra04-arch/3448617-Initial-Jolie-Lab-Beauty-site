<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$user = jolie_require_admin();
$status = (string) ($_GET['status'] ?? '');
$category = (string) ($_GET['category'] ?? '');
$search = (string) ($_GET['q'] ?? '');
$products = [];
$stats = null;
$setupError = '';

function jolie_admin_product_image_src(?string $url): string
{
    $url = trim((string) $url);
    if ($url === '') {
        return '../assets/brand/hero-01.jpeg';
    }
    if (preg_match('/^(https?:)?\/\//', $url) || str_starts_with($url, 'data:') || str_starts_with($url, '/')) {
        return $url;
    }

    return '../' . ltrim($url, '/');
}

try {
    $stats = jolie_admin_product_stats();
    $products = jolie_admin_list_products([
        'status' => $status,
        'category' => $category,
        'q' => $search,
    ], 150);
} catch (Throwable $exception) {
    $setupError = jolie_admin_setup_text($exception);
}

jolie_admin_page_start('Produits', $user);
?>
<header class="admin-page-head">
  <div>
    <span class="admin-kicker">Catalogue</span>
    <h1>Produits</h1>
  </div>
  <a class="admin-button" href="product.php">Nouveau produit</a>
</header>

<?php if ($setupError !== ''): ?>
  <section class="admin-alert is-warning"><?= jolie_admin_h($setupError) ?></section>
<?php else: ?>
  <section class="stats-grid product-stats">
    <article><span>Total produits</span><strong><?= jolie_admin_h($stats['total_products'] ?? 0) ?></strong></article>
    <article><span>Publies</span><strong><?= jolie_admin_h($stats['active_products'] ?? 0) ?></strong></article>
    <article><span>Masques</span><strong><?= jolie_admin_h($stats['hidden_products'] ?? 0) ?></strong></article>
  </section>

  <section class="admin-panel">
    <form class="orders-filter products-filter" method="get">
      <label>
        Recherche
        <input name="q" type="search" value="<?= jolie_admin_h($search) ?>" placeholder="Nom, slug, description" />
      </label>
      <label>
        Categorie
        <select name="category">
          <option value="">Toutes les categories</option>
          <?php foreach (jolie_product_categories() as $option): ?>
            <option value="<?= jolie_admin_h($option) ?>" <?= $category === $option ? 'selected' : '' ?>><?= jolie_admin_h($option) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <label>
        Statut
        <select name="status">
          <option value="">Tous</option>
          <option value="active" <?= $status === 'active' ? 'selected' : '' ?>>Publies</option>
          <option value="hidden" <?= $status === 'hidden' ? 'selected' : '' ?>>Masques</option>
        </select>
      </label>
      <button type="submit">Filtrer</button>
    </form>
  </section>

  <section class="admin-panel">
    <div class="panel-head">
      <h2>Catalogue admin</h2>
      <span><?= count($products) ?> resultat(s)</span>
    </div>
    <?php if (!$products): ?>
      <p class="admin-empty">Aucun produit admin pour le moment. Le site garde le catalogue actuel en secours.</p>
    <?php else: ?>
      <div class="admin-table-wrap">
        <table class="admin-table product-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Categorie</th>
              <th>Prix</th>
              <th>Media</th>
              <th>Ordre</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($products as $product): ?>
              <tr>
                <td>
                  <div class="product-cell">
                    <img src="<?= jolie_admin_h(jolie_admin_product_image_src($product['image_url'] ?? null)) ?>" alt="" />
                    <div>
                      <strong><?= jolie_admin_h($product['name']) ?></strong>
                      <small><?= jolie_admin_h($product['slug']) ?></small>
                    </div>
                  </div>
                </td>
                <td><?= jolie_admin_h($product['category']) ?></td>
                <td><?= jolie_admin_h(jolie_admin_price($product['price'])) ?><small><?= jolie_admin_h($product['price_note'] ?: '') ?></small></td>
                <td>
                  <strong><?= (int) $product['video_count'] ?> video(s)</strong>
                  <small><?= (int) $product['variant_count'] ?> variante(s)</small>
                </td>
                <td><?= (int) $product['sort_order'] ?></td>
                <td>
                  <span class="status-badge <?= jolie_admin_h(jolie_admin_product_status_class((int) $product['is_active'])) ?>">
                    <?= jolie_admin_h(jolie_admin_product_status_label((int) $product['is_active'])) ?>
                  </span>
                </td>
                <td><a class="table-link" href="product.php?id=<?= (int) $product['id'] ?>">Modifier</a></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </section>
<?php endif; ?>
<?php jolie_admin_page_end(); ?>
