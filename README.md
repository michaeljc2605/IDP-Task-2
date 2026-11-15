# 📚 GM eBookshop

**Live website:** [GM eBookshop](https://gm-ebookshop.infinityfreeapp.com/)

For the full free PHP/MySQL deployment, see [InfinityFree deployment](docs/INFINITYFREE.md). The original Java/Tomcat version remains intact; its separate database-migration guide is [here](docs/DATABASE-MIGRATION.md).

> A full-stack bookshop web application built with Java Servlets, MySQL, and vanilla JavaScript — designed, developed, and shipped solo in a few weeks with the help of Jiulixiang and 2 cups of coffee ☕☕

---

## ✨ Features

| Feature | Description |
|---|---|
| 📖 Book Catalog | Dynamic grid with real-time filtering, sorting, and search |
| 🔍 Author Search | Multi-author checkbox search with instant in-page results |
| 🛒 Shopping Cart | localStorage-based cart with quantity controls |
| 📦 Order Management | Transactional order placement with stock decrement |
| 🔐 Staff Portal | BCrypt-authenticated staff login and order dashboard |
| 📱 Responsive UI | Mobile-friendly design with sticky navbar and component injection |

---

## 🛠️ Tech Stack

```
Backend   →  Java 17 Servlets (Jakarta EE 10); native PHP 8.4 for the live site
Database  →  MySQL-compatible SQL
Server    →  Tomcat 10.1 for Java; Apache/PHP on InfinityFree for the live site
Frontend  →  HTML5 · CSS3 · Vanilla JavaScript
Security  →  BCrypt staff authentication and protected order APIs
Styling   →  Custom CSS with #115E59 teal theme
```

---

## 🗂️ Project Structure

```
.
├── src/main/java/              # Canonical Java servlet source and Database helper
├── src/main/webapp/            # Canonical frontend used by both deployments
│   ├── index.html             # Catalogue
│   ├── querybook.html         # Author search
│   ├── cart.html              # Cart and checkout
│   ├── stafflogin.html        # Staff login
│   ├── staff/                 # Staff dashboard and orders
│   ├── css/ · js/ · book/      # Styles, scripts and book-detail assets
│   ├── static/ · components/  # Images, videos and shared page fragments
│   └── WEB-INF/book/index.html # Java book-detail template
├── php/                       # Native PHP routes and private-config example
├── deployment/ebookshop-catalog-only.sql
├── scripts/package-infinityfree.mjs
├── src/test/                  # Cart, Java/MySQL and PHP/MySQL checks
├── docs/                      # Hosting and migration guides
├── pom.xml                    # Maven build; produces target/ROOT.war
└── Dockerfile                 # Java/Tomcat container build
```

Edit Java in `src/main/java` and frontend files in `src/main/webapp`. The older root-level files and `WEB-INF/classes` Java copies are historical copies, not the Maven source directories. Build a fresh WAR rather than deploying an old `target/ROOT.war`.

The Java book-detail template lives under `WEB-INF` so Tomcat serves it through `BookPageServlet` at `/book/{id}`. The PHP package preserves the same public route while keeping its template in the protected `php` directory.

---

## 🔌 API Endpoints

The native PHP deployment provides the same public routes as the Java servlets below.

| Endpoint | Method | Java servlet | Description |
|---|---|---|---|
| `/api/books` | GET | `BooksServlet` | All books as JSON array |
| `/api/books/{id}` | GET | `BookServlet` | Single book by ID |
| `/book/{id}` | GET | `BookPageServlet` | Book detail page |
| `/query` | GET | `QueryServlet` | Search by author (`?author=...&format=json`) |
| `/api/orders/place` | POST | `OrderPlaceServlet` | Place order + decrement stock |
| `/api/orders` | GET | `OrderTableServlet` | All orders (staff) |
| `/staff/login` | POST | `StaffAuthServlet` | Staff login |
| `/staff/session` | GET | `StaffSessionServlet` | Check staff session |

---

## 🗄️ Database Schema

[The catalogue-only SQL file](deployment/ebookshop-catalog-only.sql) is the authoritative schema for `books`, `order_records` and `users`. Import it only into a **new empty database**. It creates **30 catalogue books, zero customer orders and zero staff accounts**; it does not create a default staff login.

Preserve any existing database before migration. The historical `Database/ebookshop_backup.sql` includes private order/contact records and a staff credential hash, so it is not the deployment seed. See [database migration](docs/DATABASE-MIGRATION.md) for recovery and cutover guidance.

---

## 🚀 Getting Started

### Live PHP/MySQL deployment

Follow [the InfinityFree deployment guide](docs/INFINITYFREE.md). Package the canonical frontend and PHP routes with:

```bash
node scripts/package-infinityfree.mjs build/infinityfree-release
```

Use a new output directory. The package excludes live configuration and customer records. On the host, create the private `php/config.local.php` from its example with the assigned database details and exact HTTPS `public_origin`. Keep that file outside GitHub and preserve it during future uploads.

### Original Java/Tomcat deployment

Use Java 17 or newer, Maven, MySQL and Tomcat 10.1. Run build commands from the repository root.

1. Start your local MySQL service and create a new empty `ebookshop` database. Import only the catalogue seed:

   ```bash
   mysql --user=YOUR_LOCAL_USER --password --execute="CREATE DATABASE ebookshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql --user=YOUR_LOCAL_USER --password ebookshop < deployment/ebookshop-catalog-only.sql
   ```

2. Set **`DB_URL`**, **`DB_USER`** and **`DB_PASS`** in the environment that starts Tomcat. `DB_URL` must be a MySQL JDBC URL, for example `jdbc:mysql://localhost:3306/ebookshop?serverTimezone=UTC`. Store the password privately. Remote databases require the provider's verified TLS settings; see [the Java database guide](docs/DATABASE-MIGRATION.md).
3. Build the deployable application:

   ```bash
   mvn --batch-mode --no-transfer-progress clean package
   ```

4. Deploy the newly built `target/ROOT.war` to Tomcat's `webapps` directory, then start Tomcat with the database environment available. Tomcat's default URL is `http://localhost:8080/`; use your configured port if different.
5. Provision or restore staff access privately with a bcrypt password hash. The application has staff login only, with no public registration or default credentials.

Run the storefront and cart checks with `node --test src/test/*.test.mjs`. The isolated database checks are `src/test/run-database-tests.sh` for Java and `src/test/run-php-tests.sh` for PHP; their setup requirements are described in the deployment guides.

---

## 🔐 Security Notes

- Staff passwords use bcrypt hashes; staff access is provisioned privately.
- Submitted SQL values use prepared statements.
- Orders validate positive quantities, read the title and price from the database, and use `SELECT ... FOR UPDATE` with rollback to protect stock.
- The orders API requires a staff session, and successful login rotates the session ID.
- Java reads `DB_URL`, `DB_USER` and `DB_PASS`; PHP reads its private host configuration. Neither deployment requires credentials in source code.
- Public database errors are generic. Operational details stay in server logs.

---

## 🐛 Troubleshooting

**Books or routes return 404**

For Java, rebuild with Maven and deploy the fresh `target/ROOT.war` to Tomcat. For PHP, confirm the package's root and private `.htaccess` files are installed as described in the hosting guide.

**Database temporarily unavailable**

Check that the database is running, the schema exists and the deployed application's connection settings match that database. Java needs the three `DB_*` environment variables on the web service; PHP needs the assigned hosting MySQL details in `php/config.local.php`.

**Port already in use**

Use another local Tomcat port or stop the specific service you started. Do not terminate unrelated processes.

**Changes not reflecting in the browser**

Confirm the current build was deployed, then use a hard refresh (`Cmd + Shift + R` on macOS).

---

## 👨‍💻 Author

**Michael Joseph Candra**
Built solo from scratch — database design, servlet backend, and frontend UI.
GitHub: [@michaeljc2605](https://github.com/michaeljc2605)

---

<p align="center">Made with ☕☕ and Java · February 2026</p>