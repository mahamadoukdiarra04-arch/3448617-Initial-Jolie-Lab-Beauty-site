<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$user = jolie_require_admin();
$id = (int) ($_GET['id'] ?? 0);
$product = null;
$form = jolie_admin_product_empty_form();
$notice = '';
$error = '';
$setupError = '';
$submittedPayload = [];
$categories = [];

function jolie_admin_first_media_line(string $raw): string
{
    $lines = preg_split('/\R/u', $raw) ?: [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        return trim((string) (explode('|', $line, 2)[0] ?? ''));
    }

    return '../assets/brand/hero-01.jpeg';
}

function jolie_admin_form_media_src(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '../assets/brand/hero-01.jpeg';
    }
    if (preg_match('/^(https?:)?\/\//', $url) || str_starts_with($url, 'data:') || str_starts_with($url, '/')) {
        return $url;
    }

    return '../' . ltrim($url, '/');
}

function jolie_admin_variant_rows(array $form): array
{
    $rows = $form['variants'] ?? [];
    if (!$rows) {
        return [[
            'variant_key' => '',
            'name' => '',
            'price' => '',
            'is_default' => 1,
        ]];
    }

    return $rows;
}

try {
    if ($id > 0) {
        $product = jolie_admin_get_product($id);
        if (!$product) {
            throw new JolieValidationException(['product' => 'Produit introuvable.']);
        }
        $form = jolie_admin_product_for_form($product);
    }
    $categories = jolie_product_categories();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        jolie_verify_csrf();
        $action = (string) ($_POST['action'] ?? 'save');
        $id = (int) ($_POST['id'] ?? $id);
        $submittedPayload = $_POST;

        if ($id > 0 && $action === 'delete') {
            $deletedProduct = jolie_admin_delete_product($id);
            header('Location: products.php?deleted=' . rawurlencode((string) $deletedProduct['name']));
            exit;
        }

        if ($id > 0 && $action === 'hide') {
            jolie_admin_set_product_active($id, false);
            header('Location: product.php?id=' . $id . '&hidden=1');
            exit;
        }

        if ($id > 0 && $action === 'publish') {
            jolie_admin_set_product_active($id, true);
            header('Location: product.php?id=' . $id . '&published=1');
            exit;
        }

        $uploadErrors = [];
        $imageUploads = jolie_admin_upload_product_media($_FILES['image_files'] ?? null, 'image', $uploadErrors);
        $videoUploads = jolie_admin_upload_product_media($_FILES['video_files'] ?? null, 'video', $uploadErrors);
        $submittedPayload['image_urls'] = jolie_admin_append_media_upload_lines(
            (string) ($submittedPayload['image_urls'] ?? ''),
            $imageUploads
        );
        $submittedPayload['video_urls'] = jolie_admin_append_media_upload_lines(
            (string) ($submittedPayload['video_urls'] ?? ''),
            $videoUploads
        );
        if ($uploadErrors) {
            throw new JolieValidationException($uploadErrors);
        }

        $savedId = jolie_admin_save_product($id > 0 ? $id : null, $submittedPayload);
        header('Location: product.php?id=' . $savedId . '&saved=1');
        exit;
    }

    if (isset($_GET['saved'])) {
        $notice = 'Produit enregistre. Il sera pris en compte par le catalogue admin.';
    } elseif (isset($_GET['hidden'])) {
        $notice = "Produit masque. Il disparait du site public tout en restant dans l'admin.";
    } elseif (isset($_GET['published'])) {
        $notice = 'Produit republie.';
    }
} catch (JolieValidationException $exception) {
    $error = implode(' ', array_values($exception->errors));
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $form = jolie_admin_product_form_from_post($submittedPayload ?: $_POST);
        $form['id'] = $id > 0 ? $id : null;
    }
} catch (Throwable $exception) {
    $setupError = jolie_admin_setup_text($exception);
}

if ($setupError === '' && !$categories) {
    try {
        $categories = jolie_product_categories();
    } catch (Throwable $exception) {
        $setupError = jolie_admin_setup_text($exception);
    }
}

$title = $id > 0 ? 'Modifier produit' : 'Nouveau produit';
$previewImage = jolie_admin_form_media_src(jolie_admin_first_media_line((string) $form['image_urls']));
$publicUrl = $id > 0 && $form['slug'] !== ''
    ? '../produit.html?slug=' . rawurlencode((string) $form['slug']) . '&id=' . rawurlencode('admin-' . $id)
    : '../index.html#boutique';
$variantRows = jolie_admin_variant_rows($form);
$hasDefaultVariant = array_filter($variantRows, static fn (array $row): bool => (int) ($row['is_default'] ?? 0) === 1);
?>
<?php jolie_admin_page_start($title, $user); ?>
<header class="admin-page-head">
  <div>
    <span class="admin-kicker">Catalogue</span>
    <h1><?= jolie_admin_h($title) ?></h1>
  </div>
  <a class="admin-button" href="products.php">Retour produits</a>
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

  <form class="product-edit-layout" method="post" enctype="multipart/form-data" novalidate data-product-admin-form data-product-mode="<?= $id > 0 ? 'edit' : 'new' ?>">
    <input type="hidden" name="csrf_token" value="<?= jolie_admin_h(jolie_csrf_token()) ?>" />
    <input type="hidden" name="id" value="<?= jolie_admin_h($form['id'] ?? '') ?>" />

    <div class="product-edit-main">
      <section class="admin-panel product-form-section">
        <div class="panel-head">
          <h2>Identite</h2>
          <span>Visible sur les cards et fiches produit</span>
        </div>
        <div class="admin-form-grid">
          <label>
            Nom du produit
            <input name="name" type="text" value="<?= jolie_admin_h($form['name']) ?>" required data-product-name />
          </label>
          <label>
            Slug
            <input name="slug" type="text" value="<?= jolie_admin_h($form['slug']) ?>" placeholder="genere depuis le nom" data-product-slug />
          </label>
          <label>
            Categorie
            <select name="category" required data-product-category>
              <?php foreach ($categories as $category): ?>
                <option value="<?= jolie_admin_h($category) ?>" <?= $form['category'] === $category ? 'selected' : '' ?>><?= jolie_admin_h($category) ?></option>
              <?php endforeach; ?>
              <option value="__new__" <?= $form['category'] === '__new__' ? 'selected' : '' ?>>+ Nouvelle categorie</option>
            </select>
          </label>
          <label data-new-category-field hidden>
            Nouvelle categorie
            <input name="new_category" type="text" value="<?= jolie_admin_h($form['new_category'] ?? '') ?>" placeholder="Ex: Bien-etre" data-new-category />
          </label>
          <label>
            Prix principal
            <input name="price" type="number" min="1" step="500" value="<?= jolie_admin_h($form['price']) ?>" required data-product-price />
          </label>
          <label>
            Note de prix
            <input name="price_note" type="text" value="<?= jolie_admin_h($form['price_note']) ?>" placeholder="ex: Petit 13 000 FCFA | Grand 17 000 FCFA" />
          </label>
          <label>
            Ordre d'affichage
            <input name="sort_order" type="number" min="0" step="1" value="<?= jolie_admin_h($form['sort_order']) ?>" />
          </label>
        </div>
        <label class="admin-checkline">
          <input name="is_active" type="checkbox" value="1" <?= (int) $form['is_active'] === 1 ? 'checked' : '' ?> />
          <span>Produit publie sur le site</span>
        </label>
      </section>

      <section class="admin-panel product-form-section">
        <div class="panel-head">
          <h2>Textes produit</h2>
          <span>La description est gardee telle quelle</span>
        </div>
        <label>
          Description originale
          <textarea name="description" rows="12" required><?= jolie_admin_h($form['description']) ?></textarea>
        </label>
        <label>
          Resume court
          <textarea name="summary" rows="4" placeholder="Optionnel, sinon le site cree un resume depuis la description."><?= jolie_admin_h($form['summary']) ?></textarea>
        </label>
        <div class="admin-form-grid">
          <label>
            Conseil d'utilisation
            <textarea name="usage" rows="5"><?= jolie_admin_h($form['usage']) ?></textarea>
          </label>
          <label>
            Convient pour
            <textarea name="suited_for" rows="5"><?= jolie_admin_h($form['suited_for']) ?></textarea>
          </label>
        </div>
      </section>

      <section class="admin-panel product-form-section">
        <div class="panel-head">
          <h2>Images et videos</h2>
          <span>Depuis la galerie</span>
        </div>
        <div class="media-upload-grid">
          <label class="media-upload-card">
            <strong>Ajouter des images</strong>
            <span>JPG, PNG, WebP ou GIF</span>
            <input name="image_files[]" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple data-media-upload="image" />
          </label>
          <label class="media-upload-card">
            <strong>Ajouter des videos</strong>
            <span>MP4, WebM, MOV ou M4V</span>
            <input name="video_files[]" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" multiple data-media-upload="video" />
          </label>
        </div>
        <div class="media-manager-head">
          <h3>Medias du produit</h3>
          <span>Les nouveaux fichiers seront ajoutes apres enregistrement</span>
        </div>
        <div class="media-preview-grid" data-media-preview></div>
        <details class="media-paths-details">
          <summary>Chemins techniques</summary>
          <div class="admin-form-grid">
            <label>
              Images
              <textarea name="image_urls" rows="5" data-media-lines="image" placeholder="assets/products/mon-produit.jpeg | Photo principale"><?= jolie_admin_h($form['image_urls']) ?></textarea>
            </label>
            <label>
              Videos
              <textarea name="video_urls" rows="5" data-media-lines="video" placeholder="assets/products/demo-produit.mp4 | Demonstration produit"><?= jolie_admin_h($form['video_urls']) ?></textarea>
            </label>
          </div>
        </details>
      </section>

      <section class="admin-panel product-form-section">
        <div class="panel-head">
          <h2>Variantes</h2>
          <button class="admin-button is-muted" type="button" data-add-variant>Ajouter une variante</button>
        </div>
        <div class="variant-admin-list" data-variant-list>
          <?php foreach ($variantRows as $index => $variant): ?>
            <div class="variant-admin-row" data-variant-row>
              <label>
                Cle
                <input name="variant_ids[]" type="text" value="<?= jolie_admin_h($variant['variant_key'] ?? '') ?>" placeholder="petit" />
              </label>
              <label>
                Nom
                <input name="variant_names[]" type="text" value="<?= jolie_admin_h($variant['name'] ?? '') ?>" placeholder="Petit complet" />
              </label>
              <label>
                Prix
                <input name="variant_prices[]" type="number" min="1" step="500" value="<?= jolie_admin_h($variant['price'] ?? '') ?>" placeholder="13000" />
              </label>
              <label class="variant-radio">
                <input name="variant_default" type="radio" value="<?= (int) $index ?>" <?= ((int) ($variant['is_default'] ?? 0) === 1 || (!$hasDefaultVariant && $index === 0)) ? 'checked' : '' ?> />
                <span>Defaut</span>
              </label>
              <button class="admin-button is-muted" type="button" data-remove-variant>Retirer</button>
            </div>
          <?php endforeach; ?>
        </div>
      </section>
    </div>

    <aside class="product-edit-side">
      <section class="admin-panel product-preview-panel">
        <div class="product-admin-card" data-product-preview>
          <img src="<?= jolie_admin_h($previewImage) ?>" alt="" data-preview-image />
          <span data-preview-category><?= jolie_admin_h($form['category']) ?></span>
          <h2 data-preview-name><?= jolie_admin_h($form['name'] ?: 'Nom du produit') ?></h2>
          <strong data-preview-price><?= $form['price'] !== '' ? jolie_admin_h(jolie_admin_price($form['price'])) : 'Prix' ?></strong>
        </div>
        <div class="product-side-actions">
          <button class="admin-button" type="submit" name="action" value="save">Enregistrer</button>
          <a class="admin-button is-muted" href="<?= jolie_admin_h($publicUrl) ?>" target="_blank" rel="noreferrer">Voir la fiche</a>
          <?php if ($id > 0 && (int) $form['is_active'] === 1): ?>
            <button class="admin-button is-danger" type="submit" name="action" value="hide" formnovalidate>Masquer</button>
          <?php elseif ($id > 0): ?>
            <button class="admin-button is-success" type="submit" name="action" value="publish" formnovalidate>Republier</button>
          <?php endif; ?>
          <?php if ($id > 0): ?>
            <button class="admin-button is-danger" type="submit" name="action" value="delete" formnovalidate data-confirm-message="Supprimer definitivement le produit <?= jolie_admin_h($form['name']) ?> ?">Supprimer</button>
          <?php endif; ?>
        </div>
      </section>
    </aside>
  </form>
<?php endif; ?>
<?php jolie_admin_page_end(); ?>
