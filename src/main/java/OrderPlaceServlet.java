import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
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
        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        PrintWriter out = resp.getWriter();
        String custName = trimmed(req.getParameter("cust_name"));
        String custEmail = trimmed(req.getParameter("cust_email"));
        String custPhone = trimmed(req.getParameter("cust_phone"));
        String qtyStr = req.getParameter("qty_ordered");
        String bookIdStr = req.getParameter("book_id");
        if (custName.isEmpty() || custEmail.isEmpty() || custPhone.isEmpty() || qtyStr == null || bookIdStr == null) {
            failure(resp, out, 400, "Missing required fields.");
            return;
        }
        if (custName.length() > 100 || custEmail.length() > 150 || custPhone.length() > 20) {
            failure(resp, out, 400, "Customer details exceed the supported length.");
            return;
        }
        int qty, bookId;
        try {
            if (!qtyStr.matches("[0-9]+") || !bookIdStr.matches("[0-9]+")) throw new NumberFormatException();
            qty = Integer.parseInt(qtyStr);
            bookId = Integer.parseInt(bookIdStr);
            if (qty < 1 || bookId < 1) throw new NumberFormatException();
        } catch (NumberFormatException error) {
            failure(resp, out, 400, "Book and quantity must be positive whole numbers.");
            return;
        }
        // Browser cart values are display hints only; the locked catalogue sets price and title.
        try (Connection conn = Database.open()) {
            conn.setAutoCommit(false);
            try {
                int availableQty;
                String bookTitle;
                BigDecimal unitPrice;
                try (PreparedStatement check = conn.prepareStatement("SELECT qty, title, price FROM books WHERE id = ? FOR UPDATE")) {
                    check.setInt(1, bookId);
                    try (ResultSet row = check.executeQuery()) {
                        if (!row.next()) {
                            conn.rollback();
                            failure(resp, out, 404, "Book not found.");
                            return;
                        }
                        availableQty = row.getInt("qty");
                        bookTitle = row.getString("title");
                        unitPrice = row.getBigDecimal("price");
                    }
                }
                if (qty > availableQty) {
                    conn.rollback();
                    failure(resp, out, 409, availableQty < 1 ? "This book is out of stock." : "Only " + availableQty + " copy/copies left in stock.");
                    return;
                }
                if (unitPrice == null || unitPrice.signum() < 0) throw new SQLException("Invalid catalogue price.", "22003");
                BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);
                if (total.compareTo(new BigDecimal("99999999.99")) > 0) {
                    conn.rollback();
                    failure(resp, out, 400, "This order exceeds the supported total.");
                    return;
                }
                try (PreparedStatement insert = conn.prepareStatement(
                        "INSERT INTO order_records (qty_ordered, cust_name, cust_email, cust_phone, book_id, book_title, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
                    insert.setInt(1, qty);
                    insert.setString(2, custName);
                    insert.setString(3, custEmail);
                    insert.setString(4, custPhone);
                    insert.setInt(5, bookId);
                    insert.setString(6, bookTitle);
                    insert.setBigDecimal(7, total);
                    insert.executeUpdate();
                }
                try (PreparedStatement update = conn.prepareStatement("UPDATE books SET qty = qty - ? WHERE id = ? AND qty >= ?")) {
                    update.setInt(1, qty);
                    update.setInt(2, bookId);
                    update.setInt(3, qty);
                    if (update.executeUpdate() != 1) throw new SQLException("Stock update failed.", "40001");
                }
                conn.commit();
                out.print("{\"success\":true,\"message\":\"Order placed successfully.\"}");
            } catch (SQLException error) {
                conn.rollback();
                throw error;
            }
        } catch (SQLException error) {
            Database.logFailure("place order", error);
            failure(resp, out, 503, "The bookshop database is temporarily unavailable. Please try again.");
        }
    }

    private static String trimmed(String value) { return value == null ? "" : value.trim(); }

    private static void failure(HttpServletResponse response, PrintWriter out, int status, String message) {
        response.setStatus(status);
        out.print("{\"success\":false,\"message\":\"" + message + "\"}");
    }
}
