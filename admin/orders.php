<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$user = jolie_require_admin();
$status = (string) ($_GET['status'] ?? '');
$search = (string) ($_GET['q'] ?? '');
$orders = [];
$setupError = '';

try {
    $orders = jolie_admin_list_orders(['status' => $status, 'q' => $search], 100);
} catch (Throwable $exception) {
    $setupError = jolie_admin_setup_text($exception);
}

jolie_admin_page_start('Commandes', $user);
?>
<header class="admin-page-head">
  <div>
    <span class="admin-kicker">Gestion</span>
    <h1>Commandes</h1>
  </div>
  <a class="admin-button" href="index.php">Tableau de bord</a>
</header>

<section class="admin-panel">
  <form class="orders-filter" method="get">
    <label>
      Recherche
      <input name="q" type="search" value="<?= jolie_admin_h($search) ?>" placeholder="Numero, nom, telephone, quartier" />
    </label>
    <label>
      Statut
      <select name="status">
        <option value="">Tous les statuts</option>
        <?php foreach (jolie_order_status_options() as $value => $label): ?>
          <option value="<?= jolie_admin_h($value) ?>" <?= $status === $value ? 'selected' : '' ?>><?= jolie_admin_h($label) ?></option>
        <?php endforeach; ?>
      </select>
    </label>
    <button type="submit">Filtrer</button>
  </form>
</section>

<?php if ($setupError !== ''): ?>
  <section class="admin-alert is-warning"><?= jolie_admin_h($setupError) ?></section>
<?php else: ?>
  <section class="admin-panel">
    <div class="panel-head">
      <h2>Liste des commandes</h2>
      <span><?= count($orders) ?> resultat(s)</span>
    </div>
    <?php if (!$orders): ?>
      <p class="admin-empty">Aucune commande ne correspond a cette recherche.</p>
    <?php else: ?>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Cliente</th>
              <th>Zone</th>
              <th>Produits</th>
              <th>Livraison</th>
              <th>Final</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($orders as $order): ?>
              <tr>
                <td><strong><?= jolie_admin_h($order['order_number']) ?></strong><small><?= jolie_admin_h(jolie_admin_date($order['created_at'])) ?></small></td>
                <td><?= jolie_admin_h($order['customer_name']) ?><small><?= jolie_admin_h($order['customer_phone']) ?></small></td>
                <td><?= jolie_admin_h($order['customer_city']) ?><small><?= jolie_admin_h($order['customer_area']) ?></small></td>
                <td><?= jolie_admin_h(jolie_admin_price($order['products_total'])) ?></td>
                <td><?= jolie_admin_h(jolie_admin_price($order['delivery_fee'])) ?></td>
                <td><?= jolie_admin_h(jolie_admin_price($order['final_total'])) ?></td>
                <td><span class="status-badge <?= jolie_admin_h(jolie_order_status_class($order['status'])) ?>"><?= jolie_admin_h(jolie_order_status_label($order['status'])) ?></span></td>
                <td><a class="table-link" href="order.php?id=<?= (int) $order['id'] ?>">Detail</a></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </section>
<?php endif; ?>
<?php jolie_admin_page_end(); ?>
