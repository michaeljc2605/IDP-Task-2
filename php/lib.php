<?php
declare(strict_types=1);

function shop_config(): array
{
    static $config;
    if (isset($config)) return $config;
    $file = __DIR__ . '/config.local.php';
    if (!is_file($file)) throw new RuntimeException('Private configuration is missing.');
    $loaded = require $file;
    if (!is_array($loaded)) throw new RuntimeException('Private configuration is invalid.');
    foreach (['db_host', 'db_name', 'db_user', 'db_password', 'public_origin'] as $key) {
        if (!array_key_exists($key, $loaded) || !is_string($loaded[$key])) throw new RuntimeException('Private configuration is incomplete.');
    }
    foreach (['db_host', 'db_name'] as $key) {
        if ($loaded[$key] === '' || preg_match('/[;\x00-\x20]/', $loaded[$key])) throw new RuntimeException('Invalid database configuration.');
    }
    $origin = shop_origin($loaded['public_origin']);
    if ($origin === null) throw new RuntimeException('Invalid public origin.');
    $loaded['public_origin'] = $origin;
    $config = $loaded;
    return $config;
}

function shop_origin(string $value): ?string
{
    $parts = parse_url($value);
    if (!$parts || !isset($parts['scheme'], $parts['host']) || isset($parts['user']) || isset($parts['pass'])) return null;
    $scheme = strtolower($parts['scheme']);
    if (!in_array($scheme, ['http', 'https'], true)) return null;
    $host = strtolower($parts['host']);
    $port = isset($parts['port']) ? (int) $parts['port'] : ($scheme === 'https' ? 443 : 80);
    return $scheme . '://' . $host . (($scheme === 'https' && $port === 443) || ($scheme === 'http' && $port === 80) ? '' : ':' . $port);
}

function shop_db(): PDO
{
    ini_set('mysqlnd.net_read_timeout', '20');
    $config = shop_config();
    $port = (int) ($config['db_port'] ?? 3306);
    if ($port < 1 || $port > 65535) throw new RuntimeException('Invalid database port.');
    return new PDO('mysql:host=' . $config['db_host'] . ';port=' . $port . ';dbname=' . $config['db_name'] . ';charset=utf8mb4',
        $config['db_user'], $config['db_password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 10,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => false,
        ]);
}

function shop_json(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
    exit;
}

function shop_text(string $text, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: text/plain; charset=UTF-8');
    echo $text;
    exit;
}

function shop_error(string $message, int $status): never
{
    shop_json(['success' => false, 'message' => $message], $status);
}

function shop_same_origin(): bool
{
    $expected = shop_config()['public_origin'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') return shop_origin($origin) === $expected;
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    return $referer !== '' && shop_origin($referer) === $expected;
}

function shop_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $config = shop_config();
    session_name('gm_ebookshop');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => str_starts_with($config['public_origin'], 'https://'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    if (!session_start()) throw new RuntimeException('Session unavailable.');
}

function shop_staff(): bool
{
    shop_session();
    $now = time();
    $ttl = max(300, min(28800, (int) (shop_config()['session_ttl_seconds'] ?? 3600)));
    $active = isset($_SESSION['staff_user'], $_SESSION['staff_login_at'], $_SESSION['staff_seen_at'])
        && is_string($_SESSION['staff_user']) && $_SESSION['staff_user'] !== ''
        && $now - (int) $_SESSION['staff_login_at'] < $ttl
        && $now - (int) $_SESSION['staff_seen_at'] < $ttl;
    if ($active) $_SESSION['staff_seen_at'] = $now;
    else $_SESSION = [];
    session_write_close();
    return $active;
}

function shop_book(array $row, bool $detail = false): array
{
    $book = ['id' => (int) $row['id'], 'title' => $row['title'], 'author' => $row['author'],
        'price' => (float) $row['price'], 'qty' => (int) $row['qty']];
    if ($detail && isset($row['description'])) $book['description'] = $row['description'];
    return $book;
}

function shop_positive_int(mixed $value): ?int
{
    if (!is_string($value) || !preg_match('/^[0-9]{1,10}$/D', $value)) return null;
    $number = (int) $value;
    return $number > 0 && $number <= 2147483647 ? $number : null;
}

function shop_post_string(string $key): string
{
    return isset($_POST[$key]) && is_string($_POST[$key]) ? trim($_POST[$key]) : '';
}

function shop_place_order(): never
{
    $name = shop_post_string('cust_name');
    $email = shop_post_string('cust_email');
    $phone = shop_post_string('cust_phone');
    if ($name === '' || $email === '' || $phone === '' || !isset($_POST['qty_ordered'], $_POST['book_id'])) {
        shop_error('Missing required fields.', 400);
    }
    if (mb_strlen($name) > 100 || mb_strlen($email) > 150 || mb_strlen($phone) > 20) {
        shop_error('Customer details exceed the supported length.', 400);
    }
    $qty = shop_positive_int($_POST['qty_ordered']);
    $bookId = shop_positive_int($_POST['book_id']);
    if ($qty === null || $bookId === null) shop_error('Book and quantity must be positive whole numbers.', 400);
    $pdo = shop_db();
    $pdo->beginTransaction();
    try {
        $query = $pdo->prepare('SELECT qty, title, CAST(price AS DECIMAL(10,2)) AS unit_price FROM books WHERE id = ? FOR UPDATE');
        $query->execute([$bookId]);
        $book = $query->fetch();
        if (!$book) {
            $pdo->rollBack();
            shop_error('Book not found.', 404);
        }
        $stock = (int) $book['qty'];
        if ($qty > $stock) {
            $pdo->rollBack();
            shop_error($stock < 1 ? 'This book is out of stock.' : 'Only ' . $stock . ' copy/copies left in stock.', 409);
        }
        if (!preg_match('/^([0-9]{1,8})\.([0-9]{2})$/D', (string) $book['unit_price'], $price)) throw new RuntimeException('Invalid catalogue price.');
        $unitCents = (int) $price[1] * 100 + (int) $price[2];
        if ($unitCents > 0 && $qty > intdiv(9999999999, $unitCents)) {
            $pdo->rollBack();
            shop_error('This order exceeds the supported total.', 400);
        }
        $totalCents = $unitCents * $qty;
        $total = intdiv($totalCents, 100) . '.' . str_pad((string) ($totalCents % 100), 2, '0', STR_PAD_LEFT);
        $insert = $pdo->prepare('INSERT INTO order_records (qty_ordered, cust_name, cust_email, cust_phone, book_id, book_title, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([$qty, $name, $email, $phone, $bookId, $book['title'], $total]);
        $update = $pdo->prepare('UPDATE books SET qty = qty - ? WHERE id = ? AND qty >= ?');
        $update->execute([$qty, $bookId, $qty]);
        if ($update->rowCount() !== 1) throw new RuntimeException('Stock update failed.');
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    shop_json(['success' => true, 'message' => 'Order placed successfully.']);
}
