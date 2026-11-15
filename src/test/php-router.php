<?php
// Local PHP CLI routing for integration tests. Hosted Apache rewrites need a separate live check.
declare(strict_types=1);
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (preg_match('~(?:^|/)(?:php|WEB-INF)(?:/|$)|(?:^|/)\.~i', $path) || $path === '/app.php') {
    http_response_code(403);
    exit('Forbidden');
}
if (preg_match('~^/(?:api/books(?:/[0-9]+)?|api/orders(?:/place)?|query|book(?:/[0-9]+)?|staff/login|staff/session)$~', $path)) {
    require $_SERVER['DOCUMENT_ROOT'] . '/app.php';
    return true;
}
return false;
