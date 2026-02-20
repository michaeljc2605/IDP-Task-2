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

@WebServlet("/api/orders")
public class OrderServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
                "root", "");
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery("SELECT * FROM order_records ORDER BY id DESC");
            StringBuilder json = new StringBuilder("[");
            boolean first = true;

            while (rs.next()) {
                if (!first) json.append(",");
                first = false;
                json.append("{");
                json.append("\"id\":").append(rs.getInt("id")).append(",");
                json.append("\"qty_ordered\":").append(rs.getInt("qty_ordered")).append(",");
                json.append("\"cust_name\":\"").append(escapeJson(rs.getString("cust_name"))).append("\",");
                json.append("\"cust_email\":\"").append(escapeJson(rs.getString("cust_email"))).append("\",");
                json.append("\"cust_phone\":\"").append(escapeJson(rs.getString("cust_phone"))).append("\",");
                json.append("\"book_title\":\"").append(escapeJson(rs.getString("book_title"))).append("\",");
                json.append("\"total_price\":").append(rs.getDouble("total_price"));
                json.append("}");
            }

            json.append("]");
            out.print(json.toString());

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("[]");
            e.printStackTrace();
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}