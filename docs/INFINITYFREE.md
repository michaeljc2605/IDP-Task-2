# Full GM eBookshop on InfinityFree

This deployment preserves the canonical frontend in `src/main/webapp`: the original pages, book details, search, cart, videos, images and staff pages. A native PHP 8.4 controller supplies the eight Java servlet routes, so the website does not need a Java process on this host. The original Java source, Maven build and Dockerfile remain available independently.

## Package and deploy

1. Run `node scripts/package-infinityfree.mjs build/infinityfree-release` with a new output directory. It creates an `htdocs` folder, a catalogue-only SQL file outside that folder, a manifest and this guide.
2. On the intended **bookshop** domain, upload the **contents** of `htdocs` into that domain's document root. A second domain on the cinema hosting account must use its own document root; do not overwrite the cinema's files.
3. Create a separate MySQL database for the bookshop in the hosting control panel. Select this **new empty** database and import `database/catalog-only.sql` from the package. The results should be 30 books, zero customer orders and zero staff accounts. This is catalogue recovery, not recovery of private order history.
4. In the host's private file editor, copy `php/config.example.php` to `php/config.local.php` and enter that hosting account's assigned MySQL hostname, database name, username, existing password and exact HTTPS bookshop origin. Keep the file private and out of GitHub. Do not use a TiDB password for InfinityFree MySQL.
5. Restore or provision an authorized staff account privately, with its password stored only as a bcrypt hash. No default login or public setup endpoint is installed. The clean catalogue import deliberately excludes the old public dump's customer rows and staff credential hash.
6. Confirm HTTPS is active, then verify the routes below in the browser. Do not work around a certificate warning or disable secure cookies. The configured public origin must exactly match the site's real origin.

The PHP runtime uses the same hosting account's MySQL service. A remote TiDB connection is not this deployment's configuration. Keep any existing remote database intact until its private records have been separately recovered and reconciled.

## Route compatibility

| Existing route | Native behaviour |
| --- | --- |
| `GET /api/books` | Catalogue JSON |
| `GET /api/books/1` | Book detail JSON |
| `GET /query?author=…&author=…&format=json` | Multi-author search, retaining repeated query keys |
| `GET /book/1` | Original book-detail page and its existing JS/CSS |
| `POST /api/orders/place` | Validated order with database title/price and atomic stock update |
| `GET /api/orders` | Staff-only orders JSON; anonymous requests receive 401 |
| `GET/POST /staff/login` | Existing login response contract and bcrypt verification |
| `GET /staff/session` | Staff-session probe |

The browser's origin or referring origin must match `public_origin` for both POST routes. The backend does not trust submitted prices or titles. It rejects nonpositive/fractional quantities and locks stock for the transaction. Staff sessions regenerate at login, use host-only HttpOnly/SameSite cookies, use Secure cookies on the HTTPS origin, and expire after the configured duration. Customer fields are escaped in the existing staff table.

## Private files

Keep both root and `php/.htaccess` files in place. The root rules redirect HTTP to HTTPS while recognizing the hosting proxy's HTTPS indicators to avoid redirect loops. The root rewrite rules route public URLs to the controller while rejecting direct PHP source URLs, hidden files, SQL exports, Java/build files and private directories. `php/.htaccess` independently denies HTTP access to the private directory. The controller reads those files internally; visitors cannot download the configuration or private book template.

Only `htdocs` is uploaded. `database/`, this guide, `manifest.json`, test fixtures and the old Java build artifacts are not web content. The packager excludes any populated private configuration and customer records. Updating the runtime later must preserve the host's existing `php/config.local.php`.

## Verification

Check the homepage and all 30 catalogue items, a book-detail page, multi-author search, cart, staff login, authorized orders and protected paths. Creating a test order changes inventory; use only an explicitly approved test and retain any real order history.

Run `src/test/run-php-tests.sh` for the isolated local HTTP/MySQL regression checks. It starts only its own temporary loopback database and PHP workers, imports the public catalogue, creates disposable test data and removes its own fixture afterwards. Hosted HTTPS, Apache rewrite rules, provider limits and the final browser experience still need verification on the actual domain. The Java regression runner remains `src/test/run-database-tests.sh`.
