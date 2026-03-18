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

@WebServlet("/query")
public class QueryServlet extends HttpServlet {

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String formatEarly = request.getParameter("format");
        boolean wantsJsonEarly = "json".equalsIgnoreCase(formatEarly);
        if (wantsJsonEarly) {
            response.setContentType("application/json");
        } else {
            response.setContentType("text/html");
        }
        PrintWriter out = response.getWriter();

        if (!wantsJsonEarly) {
            out.println("<!DOCTYPE html><html><head><title>Query Response</title></head><body>");
        }

        String dbUrl  = System.getenv("DB_URL")  != null ? System.getenv("DB_URL")  : "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
        String dbUser = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
        String dbPass = System.getenv("DB_PASS") != null ? System.getenv("DB_PASS") : "";

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass)) {
            String[] authors = request.getParameterValues("author");
            String format = request.getParameter("format");

            if (authors == null || authors.length == 0) {
                if ("json".equalsIgnoreCase(format)) {
                    response.setContentType("application/json");
                    out.println("[]");
                    return;
                } else {
                    out.println("<p>No authors selected.</p>");
                    return;
                }
            }

            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < authors.length; i++) {
                if (i > 0) sb.append(" OR ");
                sb.append("author = ?");
            }

            String sqlStr = "select * from books where (" + sb.toString() + ") and qty > 0 order by price desc";

            try (java.sql.PreparedStatement pstmt = conn.prepareStatement(sqlStr)) {
                for (int i = 0; i < authors.length; i++) {
                    pstmt.setString(i + 1, authors[i]);
                }

                ResultSet rset = pstmt.executeQuery();
                java.util.List<java.util.Map<String, Object>> results = new java.util.ArrayList<>();

                while (rset.next()) {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", rset.getInt("id"));
                    m.put("title", rset.getString("title"));
                    m.put("author", rset.getString("author"));
                    m.put("price", rset.getDouble("price"));
                    m.put("qty", rset.getInt("qty"));
                    results.add(m);
                }

                if ("json".equalsIgnoreCase(format)) {
                    response.setContentType("application/json");
                    StringBuilder json = new StringBuilder("[");
                    for (int i = 0; i < results.size(); i++) {
                        java.util.Map<String, Object> m = results.get(i);
                        if (i > 0) json.append(",");
                        json.append("{");
                        json.append("\"id\":").append(m.get("id")).append(",");
                        json.append("\"title\":\"").append(escapeJson(m.get("title").toString())).append("\",");
                        json.append("\"author\":\"").append(escapeJson(m.get("author").toString())).append("\",");
                        json.append("\"price\":").append(m.get("price")).append(",");
                        json.append("\"qty\":").append(m.get("qty"));
                        json.append("}");
                    }
                    json.append("]");
                    out.println(json.toString());
                } else {
                    out.println("<h3>Thank you for your query.</h3>");
                    out.println("<p>Your SQL statement is: " + sqlStr + "</p>");
                    for (java.util.Map<String, Object> m : results) {
                        out.println("<p>" + m.get("author") + ", " + m.get("title") + ", $" + m.get("price") + "</p>");
                    }
                    out.println("<p>==== " + results.size() + " records found =====</p>");
                }
            }
        } catch (SQLException ex) {
            out.println("<p>Error: " + ex.getMessage() + "</p>");
            ex.printStackTrace();
        }

        if (!"json".equalsIgnoreCase(request.getParameter("format"))) {
            out.println("</body></html>");
        }
        out.close();
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
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }
}