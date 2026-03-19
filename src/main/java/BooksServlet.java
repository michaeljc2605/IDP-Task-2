import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/books")
public class BooksServlet extends HttpServlet {
    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        String dbUrl = System.getenv("DB_URL") != null ? System.getenv("DB_URL") : "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
        String dbUser = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
        String dbPass = System.getenv("DB_PASS") != null ? System.getenv("DB_PASS") : "";
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            response.setStatus(500);
            out.print("{\"error\":\"MySQL driver not found\"}");
            return;
        }
        try (
            Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass);
            Statement stmt = conn.createStatement();
        ) {
            ResultSet rset = stmt.executeQuery("SELECT * FROM books ORDER BY title");
            StringBuilder json = new StringBuilder("[");
            boolean first = true;
            while (rset.next()) {
                if (!first) json.append(",");
                first = false;
                json.append("{");
                json.append("\"id\":").append(rset.getInt("id")).append(",");
                json.append("\"title\":\"").append(escapeJson(rset.getString("title"))).append("\",");
                json.append("\"author\":\"").append(escapeJson(rset.getString("author"))).append("\",");
                json.append("\"price\":").append(rset.getFloat("price")).append(",");
                json.append("\"qty\":").append(rset.getInt("qty"));
                json.append("}");
            }
            json.append("]");
            out.print(json.toString());
        } catch (SQLException ex) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"" + escapeJson(ex.getMessage()) + "\"}");
            ex.printStackTrace();
        }
        out.close();
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
}
