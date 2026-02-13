# Bookshop Web Application

Java servlet webapp to query books from MySQL database.

## Setup Instructions
1. Install Tomcat 10
2. Copy this folder to `<TOMCAT_HOME>/webapps/hello`
3. Download MySQL JDBC Driver to `<TOMCAT_HOME>/lib/`
4. Compile servlet:
```bash
   cd WEB-INF/classes
   javac -cp ../../../../lib/servlet-api.jar QueryServlet.java
```
5. Start Tomcat and access: http://localhost:9999/hello/querybook.html

## Database
- Host: 10.91.138.41
- Database: ebookshop
- User: michael
