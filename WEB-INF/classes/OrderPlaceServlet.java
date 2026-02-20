import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/orders/place")
public class OrderPlaceServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        String custName  = req.getParameter("cust_name");
        String custEmail = req.getParameter("cust_email");
        String custPhone = req.getParameter("cust_phone");
        String qtyStr    = req.getParameter("qty_ordered");
        String bookId    = req.getParameter("book_id");
        String bookTitle = req.getParameter("book_title");
        String totalPrice= req.getParameter("total_price");

        if (custName == null || custEmail == null || custPhone == null || qtyStr == null) {
            resp.setStatus(400);
            out.print("{\"error\":\"Missing fields\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
                "root", "")) {
            String sql = "INSERT INTO order_records (qty_ordered, cust_name, cust_email, cust_phone, book_id, book_title, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                // qty_ordered (required)
                int qty;
                try {
                    qty = Integer.parseInt(qtyStr);
                } catch (NumberFormatException nfe) {
                    resp.setStatus(400);
                    out.print("{\"error\":\"Invalid quantity\"}");
                    return;
                }
                ps.setInt(1, qty);

                ps.setString(2, custName);
                ps.setString(3, custEmail);
                ps.setString(4, custPhone);

                // book_id may be null
                if (bookId != null && !bookId.isEmpty()) {
                    try {
                        ps.setInt(5, Integer.parseInt(bookId));
                    } catch (NumberFormatException nfe) {
                        ps.setNull(5, java.sql.Types.INTEGER);
                    }
                } else {
                    ps.setNull(5, java.sql.Types.INTEGER);
                }

                ps.setString(6, bookTitle);

                // total_price may be null
                if (totalPrice != null && !totalPrice.isEmpty()) {
                    try {
                        ps.setDouble(7, Double.parseDouble(totalPrice));
                    } catch (NumberFormatException nfe) {
                        ps.setNull(7, java.sql.Types.DECIMAL);
                    }
                } else {
                    ps.setNull(7, java.sql.Types.DECIMAL);
                }

                ps.executeUpdate();
            }
            out.print("{\"success\":true}");
        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
            e.printStackTrace();
        }
    }
}