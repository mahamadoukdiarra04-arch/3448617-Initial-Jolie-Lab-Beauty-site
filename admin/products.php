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
$notice = '';
$error = '';
$categories = [];

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
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        jolie_verify_csrf();
        $action = (string) ($_POST['action'] ?? '');
        if ($action === 'create_category') {
            $categoryName = jolie_admin_create_product_category((string) ($_POST['category_name'] ?? ''));
            header('Location: products.php?category_created=' . rawurlencode($categoryName));
            exit;
        }
        if ($action === 'delete_product') {
            $deletedProduct = jolie_admin_delete_product((int) ($_POST['id'] ?? 0));
            $params = ['deleted' => (string) $deletedProduct['name']];
            if ($status !== '') {
                $params['status'] = $status;
            }
            if ($category !== '') {
                $params['category'] = $category;
            }
            if ($search !== '') {
                $params['q'] = $search;
            }
            header('Location: products.php?' . http_build_query($params));
            exit;
        }
    }

    if (isset($_GET['category_created'])) {
        $notice = 'Categorie creee : ' . (string) $_GET['category_created'];
    } elseif (isset($_GET['deleted'])) {
        $notice = 'Produit supprime : ' . (string) $_GET['deleted'];
    }

    $categories = jolie_product_categories();
    $stats = jolie_admin_product_stats();
    $products = jolie_admin_list_products([
        'status' => $status,
        'category' => $category,
        'q' => $search,
    ], 150);
} catch (JolieValidationException $exception) {
    $error = implode(' ', array_values($exception->errors));
    try {
        $categories = jolie_product_categories();
        $stats = jolie_admin_product_stats();
        $products = jolie_admin_list_products([
            'status' => $status,
            'category' => $category,
            'q' => $search,
        ], 150);
    } catch (Throwable $setupException) {
        $setupError = jolie_admin_setup_text($setupException);
    }
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
  <?php if ($notice !== ''): ?>
    <section class="admin-alert is-success"><?= jolie_admin_h($notice) ?></section>
  <?php endif; ?>
  <?php if ($error !== ''): ?>
    <section class="admin-alert is-error"><?= jolie_admin_h($error) ?></section>
  <?php endif; ?>

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
          <?php foreach ($categories as $option): ?>
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
      <h2>Categories</h2>
      <span>Creation rapide</span>
    </div>
    <form class="category-create-form" method="post">
      <input type="hidden" name="csrf_token" value="<?= jolie_admin_h(jolie_csrf_token()) ?>" />
      <input type="hidden" name="action" value="create_category" />
      <label>
        Nouvelle categorie
        <input name="category_name" type="text" placeholder="Ex: Bien-etre" required />
      </label>
      <button class="admin-button is-muted" type="submit">Creer la categorie</button>
    </form>
    <div class="category-chip-list">
      <?php foreach ($categories as $option): ?>
        <span><?= jolie_admin_h($option) ?></span>
      <?php endforeach; ?>
    </div>
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
              <th>Actions</th>
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
                <td>
                  <div class="admin-actions">
                    <a class="table-link" href="product.php?id=<?= (int) $product['id'] ?>">Modifier</a>
                    <form class="admin-inline-form" method="post" data-confirm-message="Supprimer definitivement le produit <?= jolie_admin_h($product['name']) ?> ?">
                      <input type="hidden" name="csrf_token" value="<?= jolie_admin_h(jolie_csrf_token()) ?>" />
                      <input type="hidden" name="action" value="delete_product" />
                      <input type="hidden" name="id" value="<?= (int) $product['id'] ?>" />
                      <button class="table-link is-danger-link" type="submit">Supprimer</button>
                    </form>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </section>
<?php endif; ?>
<?php jolie_admin_page_end(); ?>
