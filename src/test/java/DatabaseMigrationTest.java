import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/** Real-MySQL regression checks. Run only using run-database-tests.sh's disposable database. */
public final class DatabaseMigrationTest {
    private static int passed;

    public static void main(String[] args) throws Exception {
        try (Connection c = Database.open()) {
            String database = c.getCatalog();
            require(database != null && database.matches("ebookshop_test_[a-zA-Z0-9_]+"), "Refusing a non-test schema");
            require(c.getMetaData().getURL().startsWith("jdbc:mysql://127.0.0.1:"), "Refusing a non-loopback connection");
            com.mysql.cj.conf.PropertySet properties = ((com.mysql.cj.jdbc.JdbcConnection)c).getPropertySet();
            require(properties.getIntegerProperty("connectTimeout").getValue() == 10000, "Connection waits must be bounded even if the URL requested no timeout");
            require(properties.getIntegerProperty("socketTimeout").getValue() == 20000, "Socket waits must be bounded even if the URL requested no timeout");
            require("DISABLED".equals(properties.getEnumProperty("sslMode").getValue().name()), "The explicit local-fixture TLS choice must be preserved");
            require(scalar("SELECT COUNT(*) FROM books") == 30 && scalar("SELECT COUNT(*) FROM order_records") == 0 && scalar("SELECT COUNT(*) FROM users") == 0,
                    "The migration must import exactly the catalog and no customer or staff records");
            sql(c, "DELETE FROM books");
            sql(c, "INSERT INTO books VALUES (1, 'Canonical book', 'Fixture author', 19.95, 10, 'Disposable test book')");
        }
        pass("Catalog-only migration imports 30 books with no customer orders or staff credentials");
        pass("Shared configuration connects, bounds waits and preserves explicit TLS options");

        Response anonymous = orders(false);
        require(anonymous.status == 401 || anonymous.status == 403, "Anonymous orders request must be rejected");
        require(!anonymous.body().contains("fixture@example.invalid"), "Anonymous response must not expose contacts");
        pass("Order records require a staff session");

        try (Connection c = Database.open(); java.sql.PreparedStatement insert = c.prepareStatement("INSERT INTO users (username,password_hash) VALUES (?,?)")) {
            insert.setString(1, "fixture-staff");
            insert.setString(2, org.mindrot.jbcrypt.BCrypt.hashpw("fixture-only-password", org.mindrot.jbcrypt.BCrypt.gensalt(4)));
            insert.executeUpdate();
        }
        AuthRequest authenticated = new AuthRequest("fixture-staff", "fixture-only-password", true);
        String anonymousId = authenticated.sessionId;
        Response login = new Response();
        new StaffAuthServlet().doPost(authenticated.proxy(), login.proxy());
        require(login.status == 200 && login.body().contains("Login successful"), "Valid staff credentials must preserve the login response contract");
        require(authenticated.rotations == 1 && !anonymousId.equals(authenticated.sessionId), "Successful login must rotate an existing anonymous session ID");
        require("fixture-staff".equals(authenticated.attributes.get("staff.user")), "The rotated session must receive staff access");
        require(authenticated.sessionId.equals(authenticated.authorizedSessionId), "Staff access must not be attached to the old anonymous session ID");
        for (String candidate : new String[] {"fixture-staff", "unknown-staff"}) {
            AuthRequest rejected = new AuthRequest(candidate, "wrong-password", false);
            Response failure = new Response();
            new StaffAuthServlet().doPost(rejected.proxy(), failure.proxy());
            require(failure.status == 401, "Invalid credentials must be rejected");
            require(!rejected.sessionExists && rejected.rotations == 0 && !rejected.attributes.containsKey("staff.user"),
                    "A rejected login must not create, rotate or authorize a session");
        }
        pass("Staff login rotates an anonymous session before granting access; invalid credentials never authorize a session");

        for (String quantity : new String[] {"-1", "0", "1.5", "2147483648", "not-a-number"}) {
            Response invalid = place(quantity, "1", "0.01", "Tampered title");
            require(invalid.status == 400, "Invalid quantity must return 400: " + quantity);
        }
        require(scalar("SELECT qty FROM books WHERE id=1") == 10 && scalar("SELECT COUNT(*) FROM order_records") == 0,
                "Rejected quantities must leave stock and orders unchanged");
        pass("Negative, zero, fractional, overflowing and non-numeric quantities cannot mutate stock");

        Response ordered = place("2", "1", "0.01", "Tampered title");
        require(ordered.status == 200 && ordered.body().contains("\"success\":true"), "Valid order retains the frontend success contract");
        try (Connection c = Database.open(); Statement st = c.createStatement(); ResultSet r = st.executeQuery("SELECT book_title,total_price,qty_ordered FROM order_records")) {
            require(r.next(), "Expected stored order");
            require("Canonical book".equals(r.getString(1)), "Stored title must come from the book record");
            require(new BigDecimal("39.90").compareTo(r.getBigDecimal(2)) == 0, "Stored total must use the server price and requested quantity");
            require(r.getInt(3) == 2, "Stored quantity must match the validated quantity");
        }
        require(scalar("SELECT qty FROM books WHERE id=1") == 8, "Committed order must decrement inventory once");
        pass("Tampered client price and title are ignored; the transaction stores the canonical total");

        Response staff = orders(true);
        require(staff.status == 200 && staff.body().contains("fixture@example.invalid") && staff.body().startsWith("["), "Staff order listing contract must remain usable");
        pass("Authenticated staff can read the order JSON");

        StringBuilder specialName = new StringBuilder("Fixture");
        StringBuilder encodedName = new StringBuilder("Fixture");
        for (int control = 0; control < 32; control++) {
            specialName.append((char)control);
            encodedName.append(String.format("\\u%04x", control));
        }
        try (Connection c = Database.open(); java.sql.PreparedStatement statement = c.prepareStatement("UPDATE order_records SET cust_name=?")) {
            statement.setString(1, specialName.toString()); statement.executeUpdate();
        }
        Response escapedStaff = orders(true);
        require(escapedStaff.status == 200 && escapedStaff.body().contains(encodedName.toString()), "Staff JSON must escape every low control character");
        require(escapedStaff.body().chars().noneMatch(character -> character < 32), "Staff JSON must contain no literal control characters");
        pass("Stored customer control characters cannot break staff order JSON");

        Response unavailable = place("9", "1", "1", "Wrong title");
        Response missing = place("1", "999", "1", "Wrong title");
        require(unavailable.status == 409 && missing.status == 404, "Insufficient stock and absent books need their existing statuses");
        require(scalar("SELECT qty FROM books WHERE id=1") == 8 && scalar("SELECT COUNT(*) FROM order_records") == 1,
                "Rejected orders must neither insert nor decrement");
        pass("Insufficient stock and unknown books preserve existing orders and inventory");

        try (Connection c = Database.open()) { sql(c, "RENAME TABLE order_records TO order_records_unavailable"); }
        try {
            Response dbFailure = place("1", "1", "1", "Wrong title");
            require(dbFailure.status == 503, "A database failure must produce a service-unavailable response");
            require(!dbFailure.body().contains("order_records") && !dbFailure.body().contains("ebookshop_test_") && !dbFailure.body().contains("SQLException"),
                    "The public response must not disclose database internals");
            require(scalar("SELECT qty FROM books WHERE id=1") == 8, "Failed insertion must roll back stock changes");
        } finally { try (Connection c = Database.open()) { sql(c, "RENAME TABLE order_records_unavailable TO order_records"); } }
        pass("Database failures are generic and leave the transaction rolled back");

        try (Connection c = Database.open()) { sql(c, "DELETE FROM order_records"); sql(c, "UPDATE books SET qty=1 WHERE id=1"); }
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
        try {
            Future<Response> first = pool.submit(() -> { ready.countDown(); start.await(); return place("1", "1", "0", "Tampered"); });
            Future<Response> second = pool.submit(() -> { ready.countDown(); start.await(); return place("1", "1", "0", "Tampered"); });
            ready.await(); start.countDown();
            int a = first.get().status, b = second.get().status;
            require((a == 200 && b == 409) || (a == 409 && b == 200), "Only one concurrent request can buy the last copy");
            require(scalar("SELECT qty FROM books WHERE id=1") == 0 && scalar("SELECT COUNT(*) FROM order_records") == 1,
                    "Last-copy concurrency must not oversell or duplicate the order");
        } finally { pool.shutdownNow(); }
        pass("Competing last-copy purchases serialize correctly using MySQL row locks");
        System.out.println("PASS " + passed + " real-MySQL regression groups; fixture is removed by the runner.");
    }

    private static Response place(String qty, String id, String price, String title) throws Exception {
        Map<String,String> values = new HashMap<>();
        values.put("cust_name", "Disposable Test"); values.put("cust_email", "fixture@example.invalid"); values.put("cust_phone", "00000000");
        values.put("qty_ordered", qty); values.put("book_id", id); values.put("total_price", price); values.put("book_title", title);
        Response response = new Response();
        new OrderPlaceServlet().doPost(request(values, false), response.proxy());
        return response;
    }

    private static Response orders(boolean staff) throws Exception {
        Response response = new Response();
        new OrderTableServlet().doGet(request(Map.of(), staff), response.proxy());
        return response;
    }

    private static HttpServletRequest request(Map<String,String> parameters, boolean staff) {
        HttpSession session = staff ? (HttpSession) Proxy.newProxyInstance(DatabaseMigrationTest.class.getClassLoader(), new Class<?>[] {HttpSession.class},
                (p, m, a) -> m.getName().equals("getAttribute") && a[0].equals("staff.user") ? "disposable-staff" : defaultValue(m.getReturnType())) : null;
        return (HttpServletRequest) Proxy.newProxyInstance(DatabaseMigrationTest.class.getClassLoader(), new Class<?>[] {HttpServletRequest.class}, (p,m,a) -> {
            if (m.getName().equals("getParameter")) return parameters.get(a[0]);
            if (m.getName().equals("getSession")) return session;
            if (m.getName().equals("getMethod")) return "POST";
            return defaultValue(m.getReturnType());
        });
    }

    private static final class AuthRequest {
        final Map<String,String> parameters;
        final Map<String,Object> attributes = new HashMap<>();
        boolean sessionExists;
        String sessionId = "anonymous-fixture-session";
        String authorizedSessionId;
        int rotations;
        AuthRequest(String username, String password, boolean existing) {
            parameters = Map.of("username", username, "password", password);
            sessionExists = existing;
        }
        HttpServletRequest proxy() {
            HttpSession session = (HttpSession) Proxy.newProxyInstance(DatabaseMigrationTest.class.getClassLoader(), new Class<?>[] {HttpSession.class}, (p,m,a) -> {
                if (m.getName().equals("getId")) return sessionId;
                if (m.getName().equals("getAttribute")) return attributes.get(a[0]);
                if (m.getName().equals("setAttribute")) {
                    attributes.put((String)a[0], a[1]);
                    if (a[0].equals("staff.user")) authorizedSessionId = sessionId;
                    return null;
                }
                return defaultValue(m.getReturnType());
            });
            return (HttpServletRequest) Proxy.newProxyInstance(DatabaseMigrationTest.class.getClassLoader(), new Class<?>[] {HttpServletRequest.class}, (p,m,a) -> {
                if (m.getName().equals("getParameter")) return parameters.get(a[0]);
                if (m.getName().equals("getSession")) {
                    if (a == null || a.length == 0 || Boolean.TRUE.equals(a[0])) sessionExists = true;
                    return sessionExists ? session : null;
                }
                if (m.getName().equals("changeSessionId")) {
                    require(sessionExists, "Session ID rotation requires an existing session");
                    sessionId = "rotated-fixture-session-" + (++rotations);
                    return sessionId;
                }
                return defaultValue(m.getReturnType());
            });
        }
    }

    private static final class Response {
        int status = 200;
        final StringWriter text = new StringWriter();
        final PrintWriter writer = new PrintWriter(text);
        HttpServletResponse proxy() {
            return (HttpServletResponse) Proxy.newProxyInstance(DatabaseMigrationTest.class.getClassLoader(), new Class<?>[] {HttpServletResponse.class}, (p,m,a) -> {
                if (m.getName().equals("getWriter")) return writer;
                if (m.getName().equals("setStatus") || m.getName().equals("sendError")) { status=(Integer)a[0]; return null; }
                if (m.getName().equals("getStatus")) return status;
                return defaultValue(m.getReturnType());
            });
        }
        String body() { writer.flush(); return text.toString(); }
    }
    private static Object defaultValue(Class<?> type) {
        if (!type.isPrimitive() || type == void.class) return null;
        if (type == boolean.class) return false;
        if (type == int.class) return 0;
        if (type == long.class) return 0L;
        if (type == double.class) return 0.0;
        if (type == float.class) return 0.0f;
        if (type == short.class) return (short)0;
        if (type == byte.class) return (byte)0;
        return (char)0;
    }
    private static int scalar(String query) throws Exception {
        try(Connection c=Database.open(); Statement s=c.createStatement(); ResultSet r=s.executeQuery(query)) { r.next(); return r.getInt(1); }
    }
    private static void sql(Connection c,String query) throws Exception { try(Statement s=c.createStatement()) { s.execute(query); } }
    private static void require(boolean condition,String message) { if(!condition) throw new AssertionError(message); }
    private static void pass(String name) { passed++; System.out.println("PASS " + name); }
}
