# 📚 GM eBookshop

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
Backend   →  Java Servlets (Jakarta EE 10)
Database  →  MySQL 8.0+
Server    →  Apache Tomcat 10  (port 9999)
Frontend  →  HTML5 · CSS3 · Vanilla JavaScript
Security  →  BCrypt via jbcrypt-0.4.jar
Styling   →  Custom CSS with #115E59 teal theme
```

---

## 🗂️ Project Structure

```
ROOT/
├── index.html                  # Book catalog (home page)
├── querybook.html              # Author search
├── cart.html                   # Shopping cart + checkout
├── aboutus.html                # About GM eBookshop
├── stafflogin.html             # Staff login
│
├── css/
│   ├── global.css              # Design system + CSS variables
│   ├── navbar.css              # Navbar (teal theme)
│   ├── footer.css              # Footer (teal theme)
│   └── index.css               # Home page styles
│
├── js/
│   ├── index.js                # Book grid, filters, add to cart
│   ├── querybook.js            # Author search logic
│   ├── navbar-v2.js            # Navbar injection + cart badge
│   └── footer-v2.js            # Footer injection
│
├── static/
│   ├── bookpage/{id}.jpg       # Book cover images
│   ├── bannervideo1.mp4        # Hero background video
│   ├── profile.jpg             # Team photo
│   └── office.jpg              # Office photo
│
├── components/
│   └── navbar.html             # Shared navbar fragment
│
└── WEB-INF/
    ├── classes/                # Compiled servlet .java + .class files
    ├── lib/
    │   └── jbcrypt-0.4.jar     # BCrypt password hashing
    └── book/
        └── index.html          # Protected book detail page ⚠️
```

> **Why is `book/index.html` inside `WEB-INF`?**
> Files inside `WEB-INF` cannot be accessed directly via browser URL — Tomcat blocks all direct HTTP access to this folder. This means users **must** go through `BookPageServlet` to reach the book detail page, preventing URL bypasses and routing loops from the `@WebServlet("/book/*")` wildcard mapping. It also enforces the MVC pattern: the servlet is the controller, and the HTML is the view.

---

## 🔌 API Endpoints

| Endpoint | Method | Servlet | Description |
|---|---|---|---|
| `/api/books` | GET | `BooksServlet` | All books as JSON array |
| `/api/books/{id}` | GET | `BookServlet` | Single book by ID |
| `/book/{id}` | GET | `BookPageServlet` | Book detail page |
| `/query` | GET | `QueryServlet` | Search by author (`?author=...&format=json`) |
| `/api/orders/place` | POST | `OrderPlaceServlet` | Place order + decrement stock |
| `/api/orders` | GET | `OrderTableServlet` | All orders (staff) |
| `/staff/login` | POST | `StaffAuthServlet` | Staff login / register |
| `/staff/session` | GET | `StaffSessionServlet` | Check staff session |

---

## 🗄️ Database Schema

### `books`
```sql
id          INT          PRIMARY KEY
title       VARCHAR(255) NOT NULL
author      VARCHAR(255) NOT NULL
price       FLOAT        NOT NULL
qty         INT          NOT NULL
description TEXT
```

### `order_records`
```sql
id          INT           AUTO_INCREMENT PRIMARY KEY
qty_ordered INT           NOT NULL
cust_name   VARCHAR(30)   NOT NULL
cust_email  VARCHAR(30)   NOT NULL
cust_phone  CHAR(8)       NOT NULL
book_id     INT
book_title  VARCHAR(255)
total_price DECIMAL(10,2)
```

### `users`
```sql
id            INT          AUTO_INCREMENT PRIMARY KEY
username      VARCHAR(50)  UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
```

---

## 🚀 Getting Started

### 1. Start MySQL

```bash
sudo /usr/local/mysql/support-files/mysql.server start
/usr/local/mysql/bin/mysql -u root
```

### 2. Create the Database

```sql
CREATE DATABASE ebookshop;
USE ebookshop;
-- Then run the full schema from Database/ebookshop.sql
```

### 3. Compile Servlets

```bash
cd /path/to/tomcat/webapps/ROOT/WEB-INF/classes

javac -cp "/path/to/tomcat/lib/servlet-api.jar:\
  ../lib/jbcrypt-0.4.jar:\
  /path/to/mysql-connector-j.jar:." \
  *.java
```

### 4. Start Tomcat

```bash
/path/to/tomcat/bin/shutdown.sh
/path/to/tomcat/bin/startup.sh
```

### 5. Open in Browser

```
http://localhost:9999/
```

---

## 🔐 Security Notes

- **Passwords** are hashed with BCrypt (`cost=12`) — never stored in plain text
- **SQL injection** is prevented via `PreparedStatement` throughout
- **Stock decrement** uses `SELECT ... FOR UPDATE` with transaction rollback to prevent race conditions
- **Staff pages** check `/staff/session` on load and redirect to login if unauthorized
- ⚠️ DB credentials are currently hard-coded — move to environment variables for production

---

## 🐛 Troubleshooting

**Books not loading (404)**
```bash
# Recompile servlets and restart Tomcat
cd WEB-INF/classes && javac -cp ... *.java
```

**Database connection error**
```bash
# Verify MySQL is running
sudo /usr/local/mysql/support-files/mysql.server status
```

**Port 9999 already in use**
```bash
lsof -ti:9999 | xargs kill -9
```

**Changes not reflecting in browser**
```
Cmd + Shift + R  (hard refresh / clear cache)
```

---

## 👨‍💻 Author

**Michael Joseph Candra**
Built solo from scratch — database design, servlet backend, and frontend UI.
GitHub: [@michaeljc2605](https://github.com/michaeljc2605)

---

<p align="center">Made with ☕☕ and Java · February 2026</p>