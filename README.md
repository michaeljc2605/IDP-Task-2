# Bookshop Web Application

A Java servlet webapp to query books from a MySQL database using JDBC.

## Prerequisites

- Java JDK 11 or higher
- Apache Tomcat 10
- MySQL JDBC Driver
- Git
- VS Code (recommended)

## Initial Setup (First Time Only)

### 1. Install Required Software

#### Install Java JDK 21
```bash
# macOS (using Homebrew)
brew install openjdk@21

# Create symlink so macOS can find it
sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Verify installation
java -version
```

#### Install Apache Tomcat 10
```bash
# Download Tomcat 10 from https://tomcat.apache.org
# Extract to ~/Downloads/tomcat (or your preferred location)

cd ~/Downloads
# Download the tar.gz file, then:
tar -xzf apache-tomcat-10.x.xx.tar.gz
mv apache-tomcat-10.x.xx tomcat
```

### 2. Clone the Repository
```bash
# Create project directory
mkdir -p ~/myWebProject
cd ~/myWebProject

# Clone the repository
git clone https://github.com/michaeljc2605/bookshop-webapp.git
cd bookshop-webapp
```

### 3. Download MySQL JDBC Driver
```bash
cd ~/Downloads
curl -O https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar

# Copy to Tomcat's lib directory
cp mysql-connector-j-8.3.0.jar ~/Downloads/tomcat/lib/
```

### 4. Deploy to Tomcat
```bash
# Copy webapp to Tomcat's webapps directory
cp -r ~/myWebProject/bookshop-webapp ~/Downloads/tomcat/webapps/hello

# Compile the servlet
cd ~/Downloads/tomcat/webapps/hello/WEB-INF/classes
javac -cp ../../../../lib/servlet-api.jar QueryServlet.java
```

### 5. Configure Tomcat (Optional but Recommended)

Edit `~/Downloads/tomcat/conf/server.xml`:
- Change port from 8080 to 9999 (line ~68):
```xml
  <Connector port="9999" protocol="HTTP/1.1"
             connectionTimeout="20000"
             redirectPort="8443" />
```

Edit `~/Downloads/tomcat/conf/web.xml`:
- Enable directory listing (line ~122): Change `listings` from `false` to `true`

Edit `~/Downloads/tomcat/conf/context.xml`:
- Enable auto-reload (line ~19):
```xml
  <Context reloadable="true" crossContext="true" parallelAnnotationScanning="true">
```

### 6. Start Tomcat
```bash
cd ~/Downloads/tomcat/bin
./catalina.sh run
```

### 7. Access the Application

Open your browser and go to:
```
http://localhost:9999/hello/querybook.html
```

## Database Configuration

The application connects to a remote MySQL database:
- **Host**: 10.91.138.41
- **Port**: 3306
- **Database**: ebookshop
- **Username**: michael
- **Password**: (contact team member)

### Database Schema
```sql
CREATE DATABASE IF NOT EXISTS ebookshop;

USE ebookshop;

CREATE TABLE books (
   id     INT PRIMARY KEY,
   title  VARCHAR(50),
   author VARCHAR(50),
   price  FLOAT,
   qty    INT
);
```

## Development Workflow

### Daily Workflow for Making Changes

#### Method A: Edit in Git Repo (Recommended)
```bash
# 1. Pull latest changes from GitHub
cd ~/myWebProject/bookshop-webapp
git pull

# 2. Open in VS Code
code .

# 3. Make your changes in VS Code
# (edit HTML, Java files, etc.)

# 4. Copy changes to Tomcat for testing
cp -r ~/myWebProject/bookshop-webapp/* ~/Downloads/tomcat/webapps/hello/

# 5. Recompile Java files (if you edited .java files)
cd ~/Downloads/tomcat/webapps/hello/WEB-INF/classes
javac -cp ../../../../lib/servlet-api.jar *.java

# 6. Test in browser: http://localhost:9999/hello/querybook.html

# 7. If it works, commit and push
cd ~/myWebProject/bookshop-webapp
git add .
git commit -m "Description of your changes"
git push
```

#### Method B: Quick Test in Tomcat
```bash
# 1. Edit directly in Tomcat folder for quick testing
cd ~/Downloads/tomcat/webapps/hello
# Make changes...

# 2. Recompile if needed
cd WEB-INF/classes
javac -cp ../../../../lib/servlet-api.jar *.java

# 3. Test immediately (no copying needed)

# 4. Copy back to Git repo when satisfied
cp -r ~/Downloads/tomcat/webapps/hello/* ~/myWebProject/bookshop-webapp/

# 5. Commit and push
cd ~/myWebProject/bookshop-webapp
git pull  # Always pull first!
git add .
git commit -m "Description of your changes"
git push
```

### Getting Teammate's Changes
```bash
# Pull latest changes
cd ~/myWebProject/bookshop-webapp
git pull

# Copy to Tomcat
cp -r ~/myWebProject/bookshop-webapp/* ~/Downloads/tomcat/webapps/hello/

# Recompile (if Java files changed)
cd ~/Downloads/tomcat/webapps/hello/WEB-INF/classes
javac -cp ../../../../lib/servlet-api.jar *.java

# Tomcat will auto-reload if configured
```

## Project Structure
```
bookshop-webapp/
├── .git/                   # Git repository (don't edit)
├── .gitignore              # Files to ignore in Git
├── README.md               # This file
├── querybook.html          # HTML form for querying books
└── WEB-INF/
    └── classes/
        └── QueryServlet.java  # Java servlet for handling queries
```

**Note**: `.class` files are NOT committed to Git (they're in `.gitignore`)

## Collaboration Best Practices

1. **Always `git pull` before making changes** - Get the latest code first
2. **Test locally before pushing** - Make sure your changes work
3. **Write clear commit messages** - "Added search by price" not "updates"
4. **Communicate with your team** - Let others know what you're working on
5. **Don't commit compiled files** - `.class`, `.jar` files are ignored
6. **Don't commit passwords** - Keep credentials secure

## Common Commands

### Compiling Servlets
```bash
cd ~/Downloads/tomcat/webapps/hello/WEB-INF/classes
javac -cp ../../../../lib/servlet-api.jar QueryServlet.java
```

### Starting/Stopping Tomcat
```bash
# Start
cd ~/Downloads/tomcat/bin
./catalina.sh run

# Stop (in the Tomcat terminal)
Control-C

# Or in a new terminal
cd ~/Downloads/tomcat/bin
./shutdown.sh
```

### Git Commands
```bash
git pull                          # Get latest changes
git status                        # Check what files changed
git add .                         # Stage all changes
git commit -m "Your message"      # Commit changes
git push                          # Push to GitHub
git log                           # View commit history
```

## Troubleshooting

### Cannot compile servlet
**Error**: `package jakarta.servlet does not exist`

**Solution**: Make sure you're using the correct classpath:
```bash
javac -cp ../../../../lib/servlet-api.jar QueryServlet.java
```

### Tomcat won't start
**Error**: `Address already in use`

**Solution**: Another Tomcat instance is running. Kill it:
```bash
ps aux | grep tomcat
kill -9 [PID]
```

### Cannot connect to database
**Error**: `Communications link failure`

**Solution**: 
- Check if MySQL server at 10.91.138.41 is running
- Verify your username and password
- Check network connection

### Git push rejected
**Error**: `Updates were rejected because the remote contains work...`

**Solution**: Pull first, then push:
```bash
git pull
git push
```

### Changes not reflecting in browser
**Solution**: 
1. Hard refresh the browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Restart Tomcat
3. Clear browser cache

## File Locations

- **Git Repository**: `~/myWebProject/bookshop-webapp/`
- **Tomcat Installation**: `~/Downloads/tomcat/`
- **Running Webapp**: `~/Downloads/tomcat/webapps/hello/`
- **Tomcat Logs**: `~/Downloads/tomcat/logs/`

## URLs

- **Application**: http://localhost:9999/hello/querybook.html
- **Tomcat Manager**: http://localhost:9999/manager
- **GitHub Repository**: https://github.com/michaeljc2605/bookshop-webapp

## Contact

For questions or issues, contact the team:
- Michael: [your contact info]
- [Partner name]: [their contact info]

---

**Happy Coding! 🚀**