import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/books/*")
public class BookServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();
        String path = req.getPathInfo();
        if (path == null || path.equals("/")) { out.println("[]"); return; }
        String id = path.substring(1);
        String dbUrl = System.getenv("DB_URL") != null ? System.getenv("DB_URL") : "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
        String dbUser = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
        String dbPass = System.getenv("DB_PASS") != null ? System.getenv("DB_PASS") : "";
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            resp.setStatus(500);
            out.println("{\"error\":\"MySQL driver not found\"}");
            return;
        }
        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass)) {
            try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM books WHERE id = ?")) {
                ps.setInt(1, Integer.parseInt(id));
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    StringBuilder json = new StringBuilder("{");
                    json.append("\"id\":").append(rs.getInt("id"));
                    json.append(",\"title\":\"").append(escapeJson(rs.getString("title"))).append("\"");
                    json.append(",\"author\":\"").append(escapeJson(rs.getString("author"))).append("\"");
                    json.append(",\"price\":").append(rs.getDouble("price"));
                    json.append(",\"qty\":").append(rs.getInt("qty"));
                    try {
                        String desc = rs.getString("description");
                        if (desc != null) json.append(",\"description\":\"").append(escapeJson(desc)).append("\"");
                    } catch (Exception e) {}
                    json.append("}");
                    out.println(json.toString());
                } else { out.println("{}"); }
            }
        } catch (SQLException ex) {
            resp.setStatus(500);
            out.println("{\"error\":\"" + escapeJson(ex.getMessage()) + "\"}");
            ex.printStackTrace();
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\': sb.append("\\\\"); break;
                case '"': sb.append("\\\""); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        String t = "000" + Integer.toHexString(c);
                        sb.append("\\u" + t.substring(t.length() - 4));
                    } else { sb.append(c); }
            }
        }
        return sb.toString();
    }
}