<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
require __DIR__ . '/php/lib.php';

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$plain = in_array($path, ['/staff/login', '/staff/session'], true);
try {
    $post = in_array($path, ['/staff/login', '/api/orders/place'], true) && $method === 'POST';
    if ($post && !shop_same_origin()) {
        if ($plain) shop_text('This request must come from the bookshop website.', 403);
        shop_error('This request must come from the bookshop website.', 403);
    }
    if ($path === '/api/orders/place') {
        if ($method !== 'POST') { header('Allow: POST'); shop_error('Method not allowed.', 405); }
        shop_place_order();
    }
    if ($path === '/staff/login' && $method === 'POST') {
        $username = shop_post_string('username');
        $password = isset($_POST['password']) && is_string($_POST['password']) ? $_POST['password'] : '';
        if ($username === '' || $password === '') shop_text('Missing username or password', 400);
        if (mb_strlen($username) > 100 || strlen($password) > 1024) shop_text('Invalid username or password', 401);
        $query = shop_db()->prepare('SELECT password_hash FROM users WHERE username = ?');
        $query->execute([$username]);
        $hash = $query->fetchColumn();
        if (!is_string($hash) || !password_verify($password, $hash)) shop_text('Invalid username or password', 401);
        shop_session();
        session_regenerate_id(true);
        $_SESSION = ['staff_user' => $username, 'staff_login_at' => time(), 'staff_seen_at' => time()];
        session_write_close();
        shop_text('Login successful');
    }
    if ($method !== 'GET') {
        header('Allow: ' . ($path === '/staff/login' ? 'GET, POST' : 'GET'));
        if ($plain) shop_text('Method not allowed.', 405);
        shop_error('Method not allowed.', 405);
    }
    if ($path === '/staff/login') shop_text("StaffAuthServlet is running.\nPOST username & password to authenticate.");
    if ($path === '/staff/session') {
        if (shop_staff()) shop_text('ok');
        shop_text('unauthorized', 401);
    }
    if ($path === '/api/orders') {
        if (!shop_staff()) shop_json([], 401);
        $rows = shop_db()->query('SELECT id, qty_ordered, cust_name, cust_email, cust_phone, book_title, total_price FROM order_records ORDER BY id DESC')->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int) $row['id'];
            $row['qty_ordered'] = (int) $row['qty_ordered'];
            $row['total_price'] = (float) $row['total_price'];
        }
        unset($row);
        shop_json($rows);
    }
    if ($path === '/api/books') {
        $rows = shop_db()->query('SELECT id, title, author, price, qty FROM books ORDER BY title')->fetchAll();
        shop_json(array_map('shop_book', $rows));
    }
    if ($path === '/api/books/') shop_json([]);
    if (preg_match('#^/api/books/([^/]+)$#D', $path, $match)) {
        $id = shop_positive_int($match[1]);
        if ($id === null) shop_json(['error' => 'Invalid book ID.'], 400);
        $query = shop_db()->prepare('SELECT id, title, author, price, qty, description FROM books WHERE id = ?');
        $query->execute([$id]);
        $book = $query->fetch();
        shop_json($book ? shop_book($book, true) : new stdClass());
    }
    if ($path === '/query') {
        $json = isset($_GET['format']) && is_string($_GET['format']) && strcasecmp($_GET['format'], 'json') === 0;
        // Servlet clients repeat author= without []: PHP's normal query parser loses earlier values.
        $authors = [];
        foreach (explode('&', $_SERVER['QUERY_STRING'] ?? '') as $pair) {
            $parts = explode('=', $pair, 2);
            if (in_array(urldecode($parts[0]), ['author', 'author[]'], true)) $authors[] = urldecode($parts[1] ?? '');
        }
        $authors = array_values(array_unique(array_filter($authors, static fn(string $a): bool => $a !== '')));
        if (count($authors) > 64) shop_json(['error' => 'Too many authors selected.'], 400);
        $books = [];
        if ($authors) {
            $query = shop_db()->prepare('SELECT id, title, author, price, qty FROM books WHERE author IN (' . implode(',', array_fill(0, count($authors), '?')) . ') AND qty > 0 ORDER BY price DESC');
            $query->execute($authors);
            $books = array_map('shop_book', $query->fetchAll());
        }
        if ($json) shop_json($books);
        header('Content-Type: text/html; charset=UTF-8');
        echo '<!DOCTYPE html><html><head><title>Query Response</title></head><body>';
        if (!$authors) echo '<p>No authors selected.</p>';
        else {
            echo '<h3>Thank you for your query.</h3>';
            foreach ($books as $book) echo '<p>' . htmlspecialchars($book['author'] . ', ' . $book['title'] . ', $' . $book['price'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>';
            echo '<p>==== ' . count($books) . ' records found =====</p>';
        }
        echo '</body></html>';
        exit;
    }
    if (preg_match('#^/book(?:/[0-9]+)?/?$#D', $path)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile(__DIR__ . '/php/book.html');
        exit;
    }
    shop_text('Not found.', 404);
} catch (Throwable $error) {
    // Never print exception text: it can include SQL, connection details or customer input.
    $state = $error instanceof PDOException ? preg_replace('/[^A-Z0-9]/i', '', (string) $error->getCode()) : 'runtime';
    error_log('Bookshop request failed (' . get_class($error) . ', code ' . $state . ').');
    if ($plain) shop_text('The bookshop database is temporarily unavailable. Please try again.', 503);
    if ($path === '/api/orders/place') shop_error('The bookshop database is temporarily unavailable. Please try again.', 503);
    shop_json(['error' => 'The bookshop database is temporarily unavailable. Please try again.'], 503);
}
