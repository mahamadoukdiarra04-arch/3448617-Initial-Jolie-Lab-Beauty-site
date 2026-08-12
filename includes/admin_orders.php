<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function jolie_order_status_options(): array
{
    return [
        'new' => 'Nouvelle',
        'pending_confirmation' => 'En attente de confirmation',
        'confirmed' => 'Confirmee',
        'preparing' => 'En preparation',
        'out_for_delivery' => 'En livraison',
        'delivered' => 'Livree',
        'cancelled' => 'Annulee',
    ];
}

function jolie_order_status_label(string $status): string
{
    $options = jolie_order_status_options();
    return $options[$status] ?? $status;
}

function jolie_order_status_class(string $status): string
{
    return match ($status) {
        'new' => 'is-new',
        'pending_confirmation' => 'is-pending',
        'confirmed' => 'is-confirmed',
        'preparing' => 'is-preparing',
        'out_for_delivery' => 'is-delivery',
        'delivered' => 'is-delivered',
        'cancelled' => 'is-cancelled',
        default => 'is-neutral',
    };
}

function jolie_admin_price(mixed $amount): string
{
    if ($amount === null || $amount === '') {
        return 'A determiner';
    }

    return number_format((int) $amount, 0, ',', ' ') . ' FCFA';
}

function jolie_admin_date(mixed $value): string
{
    if (!$value) {
        return '--';
    }

    $timestamp = strtotime((string) $value);
    if (!$timestamp) {
        return (string) $value;
    }

    return date('d/m/Y H:i', $timestamp);
}

function jolie_admin_whatsapp_url(array $order): string
{
    $phone = preg_replace('/\D+/', '', (string) ($order['customer_phone'] ?? ''));
    if ($phone === '') {
        $phone = '22394307799';
    }
    if (!str_starts_with($phone, '223')) {
        $phone = '223' . ltrim($phone, '0');
    }

    $text = sprintf(
        "Bonjour %s, votre commande %s Jolie Lab Beauty est en cours de traitement.",
        (string) ($order['customer_name'] ?? ''),
        (string) ($order['order_number'] ?? '')
    );

    return 'https://wa.me/' . $phone . '?text=' . rawurlencode($text);
}

function jolie_admin_stats(): array
{
    $pdo = jolie_pdo();
    $totals = $pdo->query(
        "SELECT
            COUNT(*) AS total_orders,
            SUM(status = 'new') AS new_orders,
            SUM(status IN ('new', 'pending_confirmation', 'confirmed', 'preparing', 'out_for_delivery')) AS active_orders,
            COALESCE(SUM(products_total), 0) AS products_total
        FROM orders"
    )->fetch() ?: [];

    return [
        'total_orders' => (int) ($totals['total_orders'] ?? 0),
        'new_orders' => (int) ($totals['new_orders'] ?? 0),
        'active_orders' => (int) ($totals['active_orders'] ?? 0),
        'products_total' => (int) ($totals['products_total'] ?? 0),
    ];
}

function jolie_admin_recent_orders(int $limit = 8): array
{
    $limit = max(1, min(50, $limit));
    $pdo = jolie_pdo();
    $stmt = $pdo->query(
        "SELECT
            id,
            order_number,
            customer_name,
            customer_phone,
            customer_city,
            customer_area,
            products_total,
            delivery_fee,
            final_total,
            status,
            created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT {$limit}"
    );

    return $stmt->fetchAll() ?: [];
}

function jolie_admin_list_orders(array $filters = [], int $limit = 50): array
{
    $pdo = jolie_pdo();
    $where = [];
    $params = [];
    $status = trim((string) ($filters['status'] ?? ''));
    $search = trim((string) ($filters['q'] ?? ''));

    if ($status !== '' && array_key_exists($status, jolie_order_status_options())) {
        $where[] = 'status = :status';
        $params['status'] = $status;
    }

    if ($search !== '') {
        $where[] = '(order_number LIKE :search OR customer_name LIKE :search OR customer_phone LIKE :search OR customer_area LIKE :search)';
        $params['search'] = '%' . $search . '%';
    }

    $sql = "SELECT
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_city,
        customer_area,
        products_total,
        delivery_fee,
        final_total,
        status,
        created_at,
        updated_at
    FROM orders";

    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $limit = max(1, min(200, $limit));
    $sql .= " ORDER BY created_at DESC LIMIT {$limit}";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll() ?: [];
}

function jolie_admin_get_order(int $id): ?array
{
    $pdo = jolie_pdo();
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch();

    if (!$order) {
        return null;
    }

    $items = $pdo->prepare('SELECT * FROM order_items WHERE order_id = :order_id ORDER BY id ASC');
    $items->execute(['order_id' => $id]);
    $order['items'] = $items->fetchAll() ?: [];

    return $order;
}

function jolie_admin_update_order(int $id, string $status, ?int $deliveryFee): void
{
    if (!array_key_exists($status, jolie_order_status_options())) {
        throw new JolieValidationException(['status' => 'Statut invalide.']);
    }

    if ($deliveryFee !== null && $deliveryFee < 0) {
        throw new JolieValidationException(['delivery_fee' => 'Le prix de livraison est invalide.']);
    }

    $pdo = jolie_pdo();
    $order = jolie_admin_get_order($id);
    if (!$order) {
        throw new JolieValidationException(['order' => 'Commande introuvable.']);
    }

    $finalTotal = $deliveryFee === null ? null : (int) $order['products_total'] + $deliveryFee;
    $stmt = $pdo->prepare(
        'UPDATE orders
        SET status = :status,
            delivery_fee = :delivery_fee,
            final_total = :final_total
        WHERE id = :id'
    );
    $stmt->execute([
        'status' => $status,
        'delivery_fee' => $deliveryFee,
        'final_total' => $finalTotal,
        'id' => $id,
    ]);
}

function jolie_admin_delete_order(int $id): array
{
    $order = jolie_admin_get_order($id);
    if (!$order) {
        throw new JolieValidationException(['order' => 'Commande introuvable.']);
    }

    $stmt = jolie_pdo()->prepare('DELETE FROM orders WHERE id = :id');
    $stmt->execute(['id' => $id]);

    return $order;
}

function jolie_admin_order_alert_snapshot(int $afterId = 0): array
{
    $pdo = jolie_pdo();
    $newCount = (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'new'")->fetchColumn();

    $latestStmt = $pdo->query(
        "SELECT id, order_number, customer_name, products_total, created_at
        FROM orders
        WHERE status = 'new'
        ORDER BY id DESC
        LIMIT 1"
    );
    $latestOrder = $latestStmt->fetch() ?: null;

    $newOrder = null;
    if ($afterId > 0) {
        $stmt = $pdo->prepare(
            "SELECT id, order_number, customer_name, products_total, created_at
            FROM orders
            WHERE status = 'new' AND id > :after_id
            ORDER BY id DESC
            LIMIT 1"
        );
        $stmt->execute(['after_id' => $afterId]);
        $newOrder = $stmt->fetch() ?: null;
    }

    return [
        'new_orders' => $newCount,
        'latest_order' => $latestOrder,
        'new_order' => $newOrder,
    ];
}
