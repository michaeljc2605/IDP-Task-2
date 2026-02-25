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

@WebServlet("/api/orders/place")
public class OrderPlaceServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        String custName   = req.getParameter("cust_name");
        String custEmail  = req.getParameter("cust_email");
        String custPhone  = req.getParameter("cust_phone");
        String qtyStr     = req.getParameter("qty_ordered");
        String bookIdStr  = req.getParameter("book_id");
        String bookTitle  = req.getParameter("book_title");
        String totalPrice = req.getParameter("total_price");

        if (custName == null || custEmail == null || custPhone == null || qtyStr == null || bookIdStr == null) {
            resp.setStatus(400);
            out.print("{\"success\":false,\"message\":\"Missing required fields.\"}");
            return;
        }

        int qty, bookId;
        double price;
        try {
            qty    = Integer.parseInt(qtyStr);
            bookId = Integer.parseInt(bookIdStr);
            price  = totalPrice != null ? Double.parseDouble(totalPrice) : 0.0;
        } catch (NumberFormatException e) {
            resp.setStatus(400);
            out.print("{\"success\":false,\"message\":\"Invalid numeric parameters.\"}");
            return;
        }

        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
                "root", "")) {

            conn.setAutoCommit(false);

            try {
                // Step 1: Lock the row and read current stock
                int availableQty;
                try (PreparedStatement checkPs = conn.prepareStatement(
                        "SELECT qty FROM books WHERE id = ? FOR UPDATE")) {
                    checkPs.setInt(1, bookId);
                    ResultSet rs = checkPs.executeQuery();
                    if (!rs.next()) {
                        resp.setStatus(404);
                        out.print("{\"success\":false,\"message\":\"Book not found.\"}");
                        conn.rollback();
                        return;
                    }
                    availableQty = rs.getInt("qty");
                }

                // Step 2: Check if enough stock
                if (qty > availableQty) {
                    resp.setStatus(409);
                    String message = availableQty == 0
                        ? "\\\"" + escapeJson(bookTitle) + "\\\" is out of stock."
                        : "Only " + availableQty + " copy/copies of \\\"" + escapeJson(bookTitle) + "\\\" left in stock.";
                    out.print("{\"success\":false,\"message\":\"" + message + "\"}");
                    conn.rollback();
                    return;
                }

                // Step 3: Insert the order
                try (PreparedStatement insertPs = conn.prepareStatement(
                        "INSERT INTO order_records (qty_ordered, cust_name, cust_email, cust_phone, book_id, book_title, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
                    insertPs.setInt(1, qty);
                    insertPs.setString(2, custName);
                    insertPs.setString(3, custEmail);
                    insertPs.setString(4, custPhone);
                    insertPs.setInt(5, bookId);
                    insertPs.setString(6, bookTitle);
                    insertPs.setDouble(7, price);
                    insertPs.executeUpdate();
                }

                // Step 4: Deduct stock
                try (PreparedStatement updatePs = conn.prepareStatement(
                        "UPDATE books SET qty = qty - ? WHERE id = ?")) {
                    updatePs.setInt(1, qty);
                    updatePs.setInt(2, bookId);
                    updatePs.executeUpdate();
                }

                conn.commit();
                out.print("{\"success\":true,\"message\":\"Order placed successfully.\"}");

            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (SQLException e) {
            resp.setStatus(500);
            out.print("{\"success\":false,\"message\":\"Database error: " + escapeJson(e.getMessage()) + "\"}");
            e.printStackTrace();
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}