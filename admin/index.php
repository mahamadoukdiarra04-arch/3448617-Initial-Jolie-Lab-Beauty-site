<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

$user = jolie_require_admin();
$stats = null;
$recentOrders = [];
$setupError = '';

try {
    $stats = jolie_admin_stats();
    $recentOrders = jolie_admin_recent_orders(8);
} catch (Throwable $exception) {
    $setupError = jolie_admin_setup_text($exception);
}

jolie_admin_page_start('Tableau de bord', $user);
?>
<header class="admin-page-head">
  <div>
    <span class="admin-kicker">Commandes</span>
    <h1>Tableau de bord</h1>
  </div>
  <a class="admin-button" href="orders.php">Voir toutes les commandes</a>
</header>

<?php if ($setupError !== ''): ?>
  <section class="admin-alert is-warning"><?= jolie_admin_h($setupError) ?></section>
<?php else: ?>
  <?php if ((int) ($stats['new_orders'] ?? 0) > 0): ?>
    <section class="admin-alert is-warning">
      <?= jolie_admin_h($stats['new_orders']) ?> nouvelle(s) commande(s) attendent une confirmation.
      <a class="table-link" href="orders.php?status=new">Ouvrir les nouvelles commandes</a>
    </section>
  <?php endif; ?>

  <section class="stats-grid">
    <article><span>Total commandes</span><strong><?= jolie_admin_h($stats['total_orders']) ?></strong></article>
    <article><span>Nouvelles</span><strong><?= jolie_admin_h($stats['new_orders']) ?></strong></article>
    <article><span>Actives</span><strong><?= jolie_admin_h($stats['active_orders']) ?></strong></article>
    <article><span>Total produits</span><strong><?= jolie_admin_h(jolie_admin_price($stats['products_total'])) ?></strong></article>
  </section>

  <section class="admin-panel">
    <div class="panel-head">
      <h2>Dernieres commandes</h2>
      <a href="orders.php">Ouvrir la liste</a>
    </div>
    <?php if (!$recentOrders): ?>
      <p class="admin-empty">Aucune commande recue pour le moment.</p>
    <?php else: ?>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Cliente</th>
              <th>Total produits</th>
              <th>Statut</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($recentOrders as $order): ?>
              <tr>
                <td><strong><?= jolie_admin_h($order['order_number']) ?></strong></td>
                <td><?= jolie_admin_h($order['customer_name']) ?><small><?= jolie_admin_h($order['customer_phone']) ?></small></td>
                <td><?= jolie_admin_h(jolie_admin_price($order['products_total'])) ?></td>
                <td><span class="status-badge <?= jolie_admin_h(jolie_order_status_class($order['status'])) ?>"><?= jolie_admin_h(jolie_order_status_label($order['status'])) ?></span></td>
                <td><?= jolie_admin_h(jolie_admin_date($order['created_at'])) ?></td>
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
