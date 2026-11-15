import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(urlPatterns = {"/staff/login"})
public class StaffAuthServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("text/plain;charset=UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            out.println("StaffAuthServlet is running.");
            out.println("POST username & password to authenticate.");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        resp.setContentType("text/plain;charset=UTF-8");
        if (username == null || password == null || username.isEmpty() || password.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().println("Missing username or password");
            return;
        }
        try (Connection conn = Database.open()) {
            String storedHash = null;
            try (PreparedStatement ps = conn.prepareStatement("SELECT password_hash FROM users WHERE username = ?")) {
                ps.setString(1, username);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) storedHash = rs.getString(1);
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
            } catch (Exception ex) { ok = false; }
            if (ok) {
                req.getSession(true).setAttribute("staff.user", username);
                resp.getWriter().println("Login successful");
            } else {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.getWriter().println("Invalid username or password");
            }
        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            Database.logFailure("staff authentication", e);
            resp.getWriter().println("The bookshop database is temporarily unavailable. Please try again.");
        }
    }
}