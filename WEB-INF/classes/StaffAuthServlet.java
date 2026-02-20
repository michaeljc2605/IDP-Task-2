import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;

// Note: this servlet requires the jBCrypt library (org.mindrot.jbcrypt.BCrypt).
// Add the jBCrypt jar to WEB-INF/lib or to Tomcat's lib/ directory and restart Tomcat.
@WebServlet(urlPatterns = {"/staff/login"})
public class StaffAuthServlet extends HttpServlet {

    // JDBC connection parameters (match other servlets)
    private static final String JDBC_URL = "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
    private static final String JDBC_USER = "root";
    private static final String JDBC_PASS = "";

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // Simple status / info
        resp.setContentType("text/plain;charset=UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            out.println("StaffAuthServlet is running.");
            out.println("POST username & password to authenticate.");
            out.println("To register (dev only) POST register=true along with username & password.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        String register = req.getParameter("register"); // if present, create user

        resp.setContentType("text/plain;charset=UTF-8");
        if (username == null || password == null || username.isEmpty() || password.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().println("Missing username or password");
            return;
        }

        // Use MySQL users table: id, username, password_hash, created_at
        try (Connection conn = DriverManager.getConnection(JDBC_URL, JDBC_USER, JDBC_PASS)) {
            if (register != null && register.equals("true")) {
                // check exists
                try (PreparedStatement ps = conn.prepareStatement("SELECT id FROM users WHERE username = ?")) {
                    ps.setString(1, username);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            resp.setStatus(HttpServletResponse.SC_CONFLICT);
                            resp.getWriter().println("User already exists");
                            return;
                        }
                    }
                }
                // Hash and insert
                String hashed = org.mindrot.jbcrypt.BCrypt.hashpw(password, org.mindrot.jbcrypt.BCrypt.gensalt(12));
                try (PreparedStatement ps = conn.prepareStatement("INSERT INTO users (username, password_hash) VALUES (?, ?)")) {
                    ps.setString(1, username);
                    ps.setString(2, hashed);
                    ps.executeUpdate();
                }
                resp.getWriter().println("Registered user: " + username);
                return;
            }

            // Authenticate: fetch stored hash
            String storedHash = null;
            try (PreparedStatement ps = conn.prepareStatement("SELECT password_hash FROM users WHERE username = ?")) {
                ps.setString(1, username);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        storedHash = rs.getString(1);
                    }
                }
            }

            if (storedHash == null) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.getWriter().println("Invalid username or password");
                return;
            }

            boolean ok = false;
            try {
                ok = org.mindrot.jbcrypt.BCrypt.checkpw(password, storedHash);
            } catch (Exception ex) {
                ok = false;
            }

            if (ok) {
                req.getSession(true).setAttribute("staff.user", username);
                resp.getWriter().println("Login successful");
            } else {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.getWriter().println("Invalid username or password");
            }
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().println("Database error: " + e.getMessage());
        }
    }
}
