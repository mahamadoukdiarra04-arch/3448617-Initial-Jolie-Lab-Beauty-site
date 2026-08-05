<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$user = jolie_require_admin();
$id = (int) ($_GET['id'] ?? 0);
$order = null;
$notice = '';
$error = '';
$setupError = '';

try {
    if ($id <= 0) {
        throw new JolieValidationException(['order' => 'Commande introuvable.']);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        jolie_verify_csrf();
        $status = (string) ($_POST['status'] ?? 'new');
        $deliveryRaw = trim((string) ($_POST['delivery_fee'] ?? ''));
        $deliveryFee = $deliveryRaw === '' ? null : (int) $deliveryRaw;
        jolie_admin_update_order($id, $status, $deliveryFee);
        $notice = 'Commande mise a jour.';
    }

    $order = jolie_admin_get_order($id);
    if (!$order) {
        throw new JolieValidationException(['order' => 'Commande introuvable.']);
    }
} catch (JolieValidationException $exception) {
    $error = implode(' ', array_values($exception->errors));
} catch (Throwable $exception) {
    $setupError = jolie_admin_setup_text($exception);
}

jolie_admin_page_start('Detail commande', $user);
?>
<header class="admin-page-head">
  <div>
    <span class="admin-kicker">Commande</span>
    <h1><?= $order ? jolie_admin_h($order['order_number']) : 'Detail commande' ?></h1>
  </div>
  <a class="admin-button" href="orders.php">Retour commandes</a>
</header>

<?php if ($setupError !== ''): ?>
  <section class="admin-alert is-warning"><?= jolie_admin_h($setupError) ?></section>
<?php elseif ($error !== ''): ?>
  <section class="admin-alert is-error"><?= jolie_admin_h($error) ?></section>
<?php elseif ($order): ?>
  <?php if ($notice !== ''): ?>
    <section class="admin-alert is-success"><?= jolie_admin_h($notice) ?></section>
  <?php endif; ?>

  <section class="order-detail-grid">
    <article class="admin-panel">
      <div class="panel-head">
        <h2>Cliente</h2>
        <a href="<?= jolie_admin_h(jolie_admin_whatsapp_url($order)) ?>" target="_blank" rel="noreferrer">WhatsApp</a>
      </div>
      <dl class="detail-list">
        <div><dt>Nom</dt><dd><?= jolie_admin_h($order['customer_name']) ?></dd></div>
        <div><dt>Telephone</dt><dd><?= jolie_admin_h($order['customer_phone']) ?></dd></div>
        <div><dt>Ville</dt><dd><?= jolie_admin_h($order['customer_city']) ?></dd></div>
        <div><dt>Quartier / zone</dt><dd><?= jolie_admin_h($order['customer_area']) ?></dd></div>
        <div><dt>Adresse</dt><dd><?= jolie_admin_h($order['customer_address']) ?></dd></div>
        <div><dt>Note</dt><dd><?= jolie_admin_h($order['customer_notes'] ?: '--') ?></dd></div>
      </dl>
    </article>

    <article class="admin-panel">
      <div class="panel-head">
        <h2>Traitement</h2>
        <span class="status-badge <?= jolie_admin_h(jolie_order_status_class($order['status'])) ?>"><?= jolie_admin_h(jolie_order_status_label($order['status'])) ?></span>
      </div>
      <form class="order-update-form" method="post">
        <input type="hidden" name="csrf_token" value="<?= jolie_admin_h(jolie_csrf_token()) ?>" />
        <label>
          Statut
          <select name="status">
            <?php foreach (jolie_order_status_options() as $value => $label): ?>
              <option value="<?= jolie_admin_h($value) ?>" <?= $order['status'] === $value ? 'selected' : '' ?>><?= jolie_admin_h($label) ?></option>
            <?php endforeach; ?>
          </select>
        </label>
        <label>
          Prix livraison
          <input name="delivery_fee" type="number" min="0" step="500" value="<?= jolie_admin_h($order['delivery_fee'] ?? '') ?>" placeholder="A determiner" />
        </label>
        <button type="submit">Mettre a jour</button>
      </form>
      <dl class="detail-list compact">
        <div><dt>Paiement</dt><dd><?= jolie_admin_h($order['payment_method']) ?></dd></div>
        <div><dt>Total produits</dt><dd><?= jolie_admin_h(jolie_admin_price($order['products_total'])) ?></dd></div>
        <div><dt>Livraison</dt><dd><?= jolie_admin_h(jolie_admin_price($order['delivery_fee'])) ?></dd></div>
        <div><dt>Montant final</dt><dd><?= jolie_admin_h(jolie_admin_price($order['final_total'])) ?></dd></div>
      </dl>
    </article>
  </section>

  <section class="admin-panel">
    <div class="panel-head">
      <h2>Produits commandes</h2>
      <span><?= count($order['items']) ?> ligne(s)</span>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Variante</th>
            <th>Prix</th>
            <th>Quantite</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($order['items'] as $item): ?>
            <tr>
              <td><strong><?= jolie_admin_h($item['product_name']) ?></strong><small><?= jolie_admin_h($item['product_slug']) ?></small></td>
              <td><?= jolie_admin_h($item['variant_name'] ?: '--') ?></td>
              <td><?= jolie_admin_h(jolie_admin_price($item['unit_price'])) ?></td>
              <td><?= (int) $item['quantity'] ?></td>
              <td><?= jolie_admin_h(jolie_admin_price($item['line_total'])) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>
<?php endif; ?>
<?php jolie_admin_page_end(); ?>
