<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/notifications.php';

const JOLIE_PAYMENT_METHOD = 'Paiement à la livraison';
const JOLIE_DELIVERY_LABEL = 'À déterminer';
const JOLIE_ORDER_STATUS_NEW = 'new';

function jolie_required_string(array $source, string $key, string $label, array &$errors, int $maxLength = 255): string
{
    $value = trim((string) ($source[$key] ?? ''));
    if ($value === '') {
        $errors[$key] = "{$label} est obligatoire.";
        return '';
    }
    if (mb_strlen($value) > $maxLength) {
        $errors[$key] = "{$label} est trop long.";
        return '';
    }
    return $value;
}

function jolie_optional_string(array $source, string $key, int $maxLength = 1000): string
{
    $value = trim((string) ($source[$key] ?? ''));
    return mb_substr($value, 0, $maxLength);
}

function jolie_positive_int(mixed $value, string $label, array &$errors, string $key): int
{
    $number = filter_var($value, FILTER_VALIDATE_INT);
    if ($number === false || $number < 0) {
        $errors[$key] = "{$label} est invalide.";
        return 0;
    }
    return (int) $number;
}

function jolie_normalize_order_payload(array $payload): array
{
    $errors = [];
    $customer = is_array($payload['customer'] ?? null) ? $payload['customer'] : [];
    $items = is_array($payload['items'] ?? null) ? $payload['items'] : [];

    if (!$items) {
        $errors['items'] = 'Ajoutez au moins un produit avant de passer commande.';
    }

    $normalizedItems = [];
    foreach ($items as $index => $item) {
        if (!is_array($item)) {
            $errors["items.{$index}"] = 'Produit invalide.';
            continue;
        }

        $quantity = jolie_positive_int($item['quantity'] ?? null, 'La quantite', $errors, "items.{$index}.quantity");
        $unitPrice = jolie_positive_int($item['unitPrice'] ?? null, 'Le prix produit', $errors, "items.{$index}.unitPrice");
        $productName = trim((string) ($item['productName'] ?? $item['displayName'] ?? ''));
        if ($productName === '') {
            $errors["items.{$index}.productName"] = 'Le nom du produit est obligatoire.';
        }

        if ($quantity <= 0) {
            $errors["items.{$index}.quantity"] = 'La quantite doit etre superieure a zero.';
        }

        $normalizedItems[] = [
            'product_id' => (string) ($item['productId'] ?? ''),
            'product_slug' => mb_substr((string) ($item['productSlug'] ?? ''), 0, 180),
            'product_name' => mb_substr($productName, 0, 255),
            'variant_id' => mb_substr((string) ($item['variantId'] ?? ''), 0, 80),
            'variant_name' => mb_substr((string) ($item['variantName'] ?? ''), 0, 180),
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'line_total' => $unitPrice * $quantity,
        ];
    }

    $name = jolie_required_string($customer, 'name', 'Le nom', $errors, 160);
    $phone = jolie_required_string($customer, 'phone', 'Le telephone', $errors, 80);
    $city = jolie_required_string($customer, 'city', 'La ville', $errors, 120);
    $area = jolie_required_string($customer, 'area', 'Le quartier ou la zone', $errors, 160);
    $address = jolie_optional_string($customer, 'address', 500);
    $notes = jolie_optional_string($customer, 'notes', 1000);

    if ($errors) {
        throw new JolieValidationException($errors);
    }

    $productsTotal = array_reduce(
        $normalizedItems,
        static fn (int $sum, array $item): int => $sum + $item['line_total'],
        0
    );

    return [
        'customer' => [
            'name' => $name,
            'phone' => $phone,
            'city' => $city,
            'area' => $area,
            'address' => $address,
            'notes' => $notes,
        ],
        'payment_method' => JOLIE_PAYMENT_METHOD,
        'delivery_fee' => null,
        'final_total' => null,
        'products_total' => $productsTotal,
        'status' => JOLIE_ORDER_STATUS_NEW,
        'items' => $normalizedItems,
    ];
}

function jolie_generate_order_number(PDO $pdo): string
{
    $date = date('Ymd');
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM orders WHERE order_number = :order_number');

    for ($attempt = 0; $attempt < 10; $attempt++) {
        $number = sprintf('JLB-%s-%04d', $date, random_int(0, 9999));
        $stmt->execute(['order_number' => $number]);
        if ((int) $stmt->fetchColumn() === 0) {
            return $number;
        }
    }

    throw new RuntimeException('Unable to generate unique order number');
}

function jolie_create_order(array $payload): array
{
    $order = jolie_normalize_order_payload($payload);
    $pdo = jolie_pdo();
    $orderNumber = jolie_generate_order_number($pdo);

    $pdo->beginTransaction();
    try {
        $insertOrder = $pdo->prepare(
            'INSERT INTO orders (
                order_number,
                customer_name,
                customer_phone,
                customer_city,
                customer_area,
                customer_address,
                customer_notes,
                payment_method,
                products_total,
                delivery_fee,
                final_total,
                status
            ) VALUES (
                :order_number,
                :customer_name,
                :customer_phone,
                :customer_city,
                :customer_area,
                :customer_address,
                :customer_notes,
                :payment_method,
                :products_total,
                NULL,
                NULL,
                :status
            )'
        );
        $insertOrder->execute([
            'order_number' => $orderNumber,
            'customer_name' => $order['customer']['name'],
            'customer_phone' => $order['customer']['phone'],
            'customer_city' => $order['customer']['city'],
            'customer_area' => $order['customer']['area'],
            'customer_address' => $order['customer']['address'],
            'customer_notes' => $order['customer']['notes'],
            'payment_method' => $order['payment_method'],
            'products_total' => $order['products_total'],
            'status' => $order['status'],
        ]);

        $orderId = (int) $pdo->lastInsertId();
        $insertItem = $pdo->prepare(
            'INSERT INTO order_items (
                order_id,
                product_id,
                product_slug,
                product_name,
                variant_id,
                variant_name,
                unit_price,
                quantity,
                line_total
            ) VALUES (
                :order_id,
                :product_id,
                :product_slug,
                :product_name,
                :variant_id,
                :variant_name,
                :unit_price,
                :quantity,
                :line_total
            )'
        );

        foreach ($order['items'] as $item) {
            $insertItem->execute([
                'order_id' => $orderId,
                'product_id' => $item['product_id'],
                'product_slug' => $item['product_slug'],
                'product_name' => $item['product_name'],
                'variant_id' => $item['variant_id'],
                'variant_name' => $item['variant_name'],
                'unit_price' => $item['unit_price'],
                'quantity' => $item['quantity'],
                'line_total' => $item['line_total'],
            ]);
        }

        $pdo->commit();

        $notification = jolie_notify_new_order([
            'order_number' => $orderNumber,
            'customer' => $order['customer'],
            'items' => array_map(
                static fn (array $item): array => [
                    'product_name' => trim($item['product_name'] . ($item['variant_name'] !== '' ? ' - ' . $item['variant_name'] : '')),
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $item['line_total'],
                ],
                $order['items']
            ),
            'payment_method' => $order['payment_method'],
            'products_total' => $order['products_total'],
            'admin_url' => jolie_notification_admin_url($orderId),
        ]);

        return [
            'id' => $orderId,
            'orderNumber' => $orderNumber,
            'status' => $order['status'],
            'paymentMethod' => $order['payment_method'],
            'deliveryLabel' => JOLIE_DELIVERY_LABEL,
            'deliveryFee' => null,
            'productsTotal' => $order['products_total'],
            'finalTotal' => null,
            'createdAt' => date(DATE_ATOM),
            'notification' => $notification,
        ];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}
