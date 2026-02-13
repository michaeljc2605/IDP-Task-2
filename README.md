# 📚 eBookshop - Java Servlet Web Application

A modern, full-stack bookshop web application built with Java Servlets, MySQL, and vanilla JavaScript. Features a beautiful responsive UI with real-time filtering, sorting, and dynamic content loading.

![eBookshop](https://img.shields.io/badge/Java-Servlets-orange) ![MySQL](https://img.shields.io/badge/Database-MySQL-blue) ![Tomcat](https://img.shields.io/badge/Server-Tomcat%2010-yellow)

---

## 🎯 Features

- **Dynamic Book Catalog** - Browse books with real-time filtering and sorting
- **Advanced Search** - Search books by author with instant results
- **Responsive Design** - Beautiful UI that works on all devices
- **RESTful API** - JSON API for book data
- **Database Integration** - MySQL backend with connection pooling
- **Modern Frontend** - Vanilla JavaScript with smooth animations

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java Servlets (Jakarta EE) |
| **Database** | MySQL 8.0+ |
| **Server** | Apache Tomcat 10 |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Styling** | Custom CSS with CSS Variables |

---

## 📁 Project Structure

```
ROOT/
├── index.html                 # Main page - Book catalog
├── querybook.html            # Search page
├── css/
│   ├── global.css           # Global styles & design system
│   └── index.css            # Main page specific styles
├── js/
│   └── index.js             # Client-side logic
├── WEB-INF/
│   ├── classes/
│   │   ├── BooksServlet.class    # API endpoint for all books
│   │   └── QueryServlet.class    # Search servlet
│   └── web.xml              # Deployment descriptor (optional)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Java JDK 11+** (for Jakarta EE)
- **Apache Tomcat 10** 
- **MySQL 8.0+**
- **macOS** (instructions are Mac-specific)

### Installation

#### 1️⃣ Setup MySQL Database

Start MySQL if not already running:
```bash
# Check MySQL status
sudo /usr/local/mysql/support-files/mysql.server status

# Start MySQL
sudo /usr/local/mysql/support-files/mysql.server start
```

Create the database and tables:
```bash
# Connect to MySQL
/usr/local/mysql/bin/mysql -u root

# Run these SQL commands:
```

```sql
CREATE DATABASE ebookshop;
USE ebookshop;

CREATE TABLE books (
    id INT PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    author VARCHAR(50) NOT NULL,
    price FLOAT NOT NULL,
    qty INT NOT NULL
);

INSERT INTO books (id, title, author, price, qty) VALUES
(1001, 'Java for dummies', 'Tan Ah Teck', 11.11, 11),
(1002, 'More Java for dummies', 'Tan Ah Teck', 22.22, 22),
(1003, 'More Java for more dummies', 'Mohammad Ali', 33.33, 33),
(1004, 'A Cup of Java', 'Kumar', 44.44, 44),
(1005, 'A Teaspoon of Java', 'Kevin Jones', 55.55, 55);

CREATE TABLE order_records (
    id INT PRIMARY KEY,
    qty_ordered INT NOT NULL,
    cust_name VARCHAR(30) NOT NULL,
    cust_email VARCHAR(30) NOT NULL,
    cust_phone CHAR(8) NOT NULL
);
```

#### 2️⃣ Configure Tomcat

**Important:** This application uses the **ROOT** context for cleaner URLs.

```bash
# Navigate to Tomcat webapps
cd /path/to/tomcat/webapps

# Backup original ROOT folder (optional)
mv ROOT ROOT_backup

# Create new ROOT directory
mkdir ROOT
```

#### 3️⃣ Deploy Application Files

Clone or download this repository, then copy files:

```bash
# Create directory structure
cd /path/to/tomcat/webapps/ROOT
mkdir -p css js WEB-INF/classes

# Copy frontend files
cp /path/to/project/index.html .
cp /path/to/project/querybook.html .
cp /path/to/project/css/* css/
cp /path/to/project/js/* js/

# Copy servlet source files
cp /path/to/project/servlets/*.java WEB-INF/classes/
```

#### 4️⃣ Compile Servlets

```bash
cd /path/to/tomcat/webapps/ROOT/WEB-INF/classes

# Compile both servlets
javac -cp "/path/to/tomcat/lib/servlet-api.jar:/path/to/tomcat/lib/mysql-connector-j-8.3.0.jar" \
    BooksServlet.java QueryServlet.java

# Verify .class files were created
ls -la *.class
```

**Note:** Ensure MySQL Connector/J JAR is in Tomcat's `lib` directory. Download if needed:
```bash
cd /path/to/tomcat/lib
curl -O https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar
```

#### 5️⃣ Start Tomcat

```bash
cd /path/to/tomcat/bin
./catalina.sh run
```

#### 6️⃣ Access Application

Open your browser and navigate to:
- **Main Page:** http://localhost:9999/
- **Search Page:** http://localhost:9999/querybook.html
- **API Endpoint:** http://localhost:9999/api/books

---

## 🔄 Migration Guide: `hello` → `ROOT`

### Why ROOT?

Originally, this app was in `/webapps/hello`, accessible at `http://localhost:9999/hello/`. 

Moving to `/webapps/ROOT` provides:
- ✅ Cleaner URLs: `http://localhost:9999/` instead of `http://localhost:9999/hello/`
- ✅ Default application behavior
- ✅ Professional deployment standard

### Migration Steps

```bash
# 1. Stop Tomcat
cd /path/to/tomcat/bin
./catalina.sh stop

# 2. Navigate to webapps
cd /path/to/tomcat/webapps

# 3. Backup existing ROOT (if it exists)
mv ROOT ROOT_backup

# 4. Rename hello to ROOT
mv hello ROOT

# 5. Start Tomcat
cd ../bin
./catalina.sh run
```

### Update Your Git Repository

```bash
cd /path/to/tomcat/webapps/ROOT

# Your git repository is still intact!
git status
git add .
git commit -m "Migrated from hello to ROOT context"
git push origin main
```

---

## 🔌 Database Connection Changes

### Original Setup (Remote Database)

```java
// Old connection (unreachable remote server)
Connection conn = DriverManager.getConnection(
    "jdbc:mysql://10.91.138.41:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
    "michael", "anjay88"
);
```

### Updated Setup (Local Database)

```java
// New connection (local MySQL)
Connection conn = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
    "root", ""
);
```

### Key Changes

| Aspect | Before | After | Reason |
|--------|--------|-------|--------|
| **Host** | `10.91.138.41` | `localhost` | Remote server unreachable |
| **Username** | `michael` | `root` | Local MySQL setup |
| **Password** | `anjay88` | `` (empty) | Root user has no password |

### Files Updated

- ✅ `BooksServlet.java` - Line 22
- ✅ `QueryServlet.java` - Line 28

---

## 🧪 Testing

### Test Database Connection

```bash
# Verify MySQL is accessible
/usr/local/mysql/bin/mysql -u root -e "USE ebookshop; SELECT * FROM books;"
```

### Test API Endpoint

```bash
# Should return JSON array of books
curl http://localhost:9999/api/books
```

### Test Main Page

1. Go to http://localhost:9999/
2. Verify books load in grid layout
3. Test filtering by author
4. Test sorting options

### Test Search Functionality

1. Go to http://localhost:9999/querybook.html
2. Enter "Tan Ah Teck" as author
3. Submit form
4. Verify results display correctly

---

## 🐛 Troubleshooting

### Books Not Loading (API 404 Error)

**Problem:** `/api/books` returns 404

**Solution:**
```bash
# Check if BooksServlet.class exists
ls -la /path/to/tomcat/webapps/ROOT/WEB-INF/classes/BooksServlet.class

# If missing, recompile:
cd /path/to/tomcat/webapps/ROOT/WEB-INF/classes
javac -cp "/path/to/tomcat/lib/servlet-api.jar:/path/to/tomcat/lib/mysql-connector-j-*.jar" BooksServlet.java

# Restart Tomcat
cd /path/to/tomcat/bin
./catalina.sh stop
./catalina.sh run
```

### Database Connection Error

**Problem:** "Communications link failure" or "Access denied"

**Solutions:**

1. **Check MySQL is running:**
   ```bash
   sudo /usr/local/mysql/support-files/mysql.server status
   ```

2. **Test connection:**
   ```bash
   /usr/local/mysql/bin/mysql -u root
   ```

3. **Verify database exists:**
   ```sql
   SHOW DATABASES;
   USE ebookshop;
   SHOW TABLES;
   ```

### Port Already in Use

**Problem:** Tomcat won't start, port 9999 in use

**Solution:**
```bash
# Find and kill process using port 9999
lsof -ti:9999 | xargs kill -9

# Or change port in server.xml
```

### Servlet Compilation Errors

**Problem:** "cannot find symbol" errors

**Solution:**
```bash
# Ensure MySQL connector is in lib/
ls -la /path/to/tomcat/lib/mysql-connector-j-*.jar

# If missing, download:
cd /path/to/tomcat/lib
curl -O https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar
```

---

## 📊 Database Schema

### Books Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY | Unique book identifier |
| `title` | VARCHAR(50) | NOT NULL | Book title |
| `author` | VARCHAR(50) | NOT NULL | Author name |
| `price` | FLOAT | NOT NULL | Book price |
| `qty` | INT | NOT NULL | Stock quantity |

### Order Records Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY | Order ID |
| `qty_ordered` | INT | NOT NULL | Quantity ordered |
| `cust_name` | VARCHAR(30) | NOT NULL | Customer name |
| `cust_email` | VARCHAR(30) | NOT NULL | Customer email |
| `cust_phone` | CHAR(8) | NOT NULL | Customer phone |

---

## 🎨 Design System

The application uses a comprehensive CSS design system with:

- **CSS Variables** for consistent theming
- **Responsive Grid Layout** (auto-fit, minmax)
- **Modern Color Palette** with gradients
- **Smooth Animations** and transitions
- **Mobile-First Design** approach

Key design tokens:
```css
--primary: #2c3e50;
--secondary: #e74c3c;
--accent: #3498db;
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...;
```

---

## 🔐 Security Considerations

⚠️ **Note:** This is a learning project. For production use:

- ✅ Use prepared statements to prevent SQL injection
- ✅ Implement authentication and authorization
- ✅ Use HTTPS for encrypted connections
- ✅ Store database credentials in environment variables
- ✅ Add input validation and sanitization
- ✅ Implement CSRF protection

---

## 📝 API Documentation

### GET `/api/books`

Returns all books in JSON format.

**Response:**
```json
[
  {
    "id": 1001,
    "title": "Java for dummies",
    "author": "Tan Ah Teck",
    "price": 11.11,
    "qty": 11
  },
  ...
]
```

### GET `/query?author=<author_name>`

Search books by author.

**Parameters:**
- `author` (string) - Author name to search

**Example:**
```
/query?author=Tan%20Ah%20Teck
```

---

## 🤝 Contributing

This is an educational project. Feel free to fork and experiment!

---

## 📄 License

This project is for educational purposes.

---

## 👨‍💻 Author

**Michael Joseph Candra**
- GitHub: [@michaeljc2605](https://github.com/michaeljc2605)

---

## 🙏 Acknowledgments

- Java Servlet API documentation
- MySQL documentation  
- Apache Tomcat team
- Modern web design principles

---

**Last Updated:** February 13, 2026

Made with ☕ and Java