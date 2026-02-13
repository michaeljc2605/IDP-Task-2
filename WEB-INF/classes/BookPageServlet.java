import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/book/*")
public class BookPageServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // If the request targets a static asset under /book (e.g. /book/js/... or /book/css/...)
        // serve the asset directly from the webapp resources. Otherwise forward to the
        // internal book page so the URL remains /book/{id}.
        String pathInfo = req.getPathInfo(); // may be null, "/..." or "/js/book.js"

        if (pathInfo != null) {
            String lower = pathInfo.toLowerCase();
            if (lower.startsWith("/js/") || lower.startsWith("/css/") || lower.startsWith("/images/") || lower.endsWith(".js") || lower.endsWith(".css") || lower.endsWith(".svg") || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                // Try to load the resource from the webapp's /book directory
                String resourcePath = "/book" + pathInfo; // e.g. /book/js/book.js
                jakarta.servlet.ServletContext ctx = getServletContext();
                java.io.InputStream is = ctx.getResourceAsStream(resourcePath);
                if (is == null) {
                    resp.sendError(HttpServletResponse.SC_NOT_FOUND);
                    return;
                }
                String mime = ctx.getMimeType(resourcePath);
                if (mime == null) {
                    if (resourcePath.endsWith(".js")) mime = "application/javascript";
                    else if (resourcePath.endsWith(".css")) mime = "text/css";
                    else mime = "application/octet-stream";
                }
                resp.setContentType(mime);
                // small caching headers
                resp.setHeader("Cache-Control", "public, max-age=3600");
                try (java.io.OutputStream os = resp.getOutputStream()) {
                    byte[] buf = new byte[8192];
                    int len;
                    while ((len = is.read(buf)) != -1) {
                        os.write(buf, 0, len);
                    }
                } finally {
                    is.close();
                }
                return;
            }
        }

        // Not a static asset — forward to the internal WEB-INF book page so we don't hit the same mapping again
        req.getRequestDispatcher("/WEB-INF/book/index.html").forward(req, resp);
    }
}
