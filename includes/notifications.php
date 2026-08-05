<?php

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function jolie_notification_config(): array
{
    $config = jolie_config();
    $notifications = is_array($config['notifications'] ?? null) ? $config['notifications'] : [];
    $app = is_array($config['app'] ?? null) ? $config['app'] : [];

    return [
        'email_enabled' => (bool) ($notifications['email_enabled'] ?? true),
        'admin_email' => (string) ($notifications['admin_email'] ?? 'ramatabore31@gmail.com'),
        'from_email' => (string) ($notifications['from_email'] ?? 'no-reply@jolielabbeauty.com'),
        'from_name' => (string) ($notifications['from_name'] ?? 'Jolie Lab Beauty'),
        'app_url' => rtrim((string) ($app['url'] ?? ''), '/'),
    ];
}

function jolie_notification_price(mixed $amount): string
{
    if ($amount === null || $amount === '') {
        return 'A determiner';
    }

    return number_format((int) $amount, 0, ',', ' ') . ' FCFA';
}

function jolie_order_notification_subject(string $orderNumber): string
{
    return 'Nouvelle commande Jolie Lab Beauty - ' . $orderNumber;
}

function jolie_notification_admin_url(int $orderId): string
{
    $config = jolie_notification_config();
    if ($config['app_url'] === '') {
        return '';
    }

    return $config['app_url'] . '/admin/order.php?id=' . $orderId;
}

function jolie_build_order_notification_body(array $order): string
{
    $customer = $order['customer'] ?? [];
    $items = is_array($order['items'] ?? null) ? $order['items'] : [];
    $lines = [
        'Nouvelle commande Jolie Lab Beauty',
        '',
        'Commande : ' . (string) ($order['order_number'] ?? $order['orderNumber'] ?? ''),
        'Statut : Nouvelle',
        'Paiement : ' . (string) ($order['payment_method'] ?? $order['paymentMethod'] ?? 'Paiement a la livraison'),
        'Livraison : A determiner',
        '',
        'Cliente :',
        '- Nom : ' . (string) ($customer['name'] ?? ''),
        '- Telephone : ' . (string) ($customer['phone'] ?? ''),
        '- Ville : ' . (string) ($customer['city'] ?? ''),
        '- Quartier / zone : ' . (string) ($customer['area'] ?? ''),
        '- Adresse : ' . (string) ($customer['address'] ?? ''),
    ];

    $notes = trim((string) ($customer['notes'] ?? ''));
    if ($notes !== '') {
        $lines[] = '- Note : ' . $notes;
    }

    $lines[] = '';
    $lines[] = 'Produits :';
    foreach ($items as $item) {
        $name = (string) ($item['display_name'] ?? $item['displayName'] ?? $item['product_name'] ?? $item['productName'] ?? 'Produit');
        $quantity = (int) ($item['quantity'] ?? 0);
        $unitPrice = (int) ($item['unit_price'] ?? $item['unitPrice'] ?? 0);
        $lineTotal = (int) ($item['line_total'] ?? $item['lineTotal'] ?? ($unitPrice * $quantity));
        $lines[] = sprintf(
            '- %d x %s (%s) = %s',
            $quantity,
            $name,
            jolie_notification_price($unitPrice),
            jolie_notification_price($lineTotal)
        );
    }

    $lines[] = '';
    $lines[] = 'Total produits : ' . jolie_notification_price($order['products_total'] ?? $order['productsTotal'] ?? 0);
    $lines[] = 'Montant final : A determiner apres validation admin';

    $adminUrl = (string) ($order['admin_url'] ?? '');
    if ($adminUrl !== '') {
        $lines[] = '';
        $lines[] = 'Voir dans admin : ' . $adminUrl;
    }

    return implode("\n", $lines);
}

function jolie_send_mail(string $to, string $subject, string $body, string $fromEmail, string $fromName): bool
{
    if (!function_exists('mail')) {
        return false;
    }

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . sprintf('"%s" <%s>', addcslashes($fromName, '"\\'), $fromEmail),
        'Reply-To: ' . $fromEmail,
        'X-Mailer: PHP/' . PHP_VERSION,
    ];

    return @mail($to, $encodedSubject, $body, implode("\r\n", $headers));
}

function jolie_notify_new_order(array $order): array
{
    try {
        $config = jolie_notification_config();
        if (!$config['email_enabled']) {
            return ['email' => 'disabled'];
        }

        $orderNumber = (string) ($order['order_number'] ?? $order['orderNumber'] ?? '');
        $subject = jolie_order_notification_subject($orderNumber);
        $body = jolie_build_order_notification_body($order);
        $sent = jolie_send_mail(
            $config['admin_email'],
            $subject,
            $body,
            $config['from_email'],
            $config['from_name']
        );

        if (!$sent) {
            error_log('Jolie notification email failed for order ' . $orderNumber);
            return ['email' => 'failed'];
        }

        return ['email' => 'sent'];
    } catch (Throwable $error) {
        error_log('Jolie notification failed: ' . $error->getMessage());
        return ['email' => 'failed'];
    }
}
