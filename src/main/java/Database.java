import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

/** Shared JDBC configuration. Credentials stay in the hosting environment. */
public final class Database {
    private static final Logger LOGGER = Logger.getLogger(Database.class.getName());
    private static final String LOCAL_URL = "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";

    private Database() {}

    public static Connection open() throws SQLException {
        String configuredUrl = System.getenv("DB_URL");
        String url = configuredUrl == null || configuredUrl.isBlank() ? LOCAL_URL : configuredUrl.trim();
        if (!url.startsWith("jdbc:mysql://")) {
            throw new SQLException("DB_URL must use the MySQL JDBC scheme.", "08001");
        }
        // Keep the provider's TLS options intact while bounding failed requests.
        url = withTimeout(url, "connectTimeout", 10000);
        url = withTimeout(url, "socketTimeout", 20000);
        String user = System.getenv("DB_USER");
        String password = System.getenv("DB_PASS");
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException error) {
            throw new SQLException("MySQL JDBC driver is unavailable.", "08001", error);
        }
        return DriverManager.getConnection(url, user == null ? "root" : user, password == null ? "" : password);
    }

    private static String withTimeout(String url, String option, int milliseconds) {
        String pattern = "(?i)([?&])" + option + "=[^&]*";
        if (java.util.regex.Pattern.compile(pattern).matcher(url).find()) {
            return url.replaceAll(pattern, "$1" + option + "=" + milliseconds);
        }
        return url + (url.contains("?") ? "&" : "?") + option + "=" + milliseconds;
    }

    public static void logFailure(String operation, SQLException error) {
        // SQL exception messages can include infrastructure or submitted values.
        LOGGER.log(Level.WARNING, "Database operation {0} failed (SQLState {1}, vendor code {2}).",
                new Object[] {operation, error.getSQLState(), error.getErrorCode()});
    }
}
