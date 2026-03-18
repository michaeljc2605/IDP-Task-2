import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
// This servlet serves the book page and its static resources (JS/CSS/images)
@WebServlet("/book/*")
public class BookPageServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String pathInfo = req.getPathInfo();

        if (pathInfo != null) {
            String lower = pathInfo.toLowerCase();
            if (lower.startsWith("/js/") || lower.startsWith("/css/") || lower.startsWith("/images/") || lower.endsWith(".js") || lower.endsWith(".css") || lower.endsWith(".svg") || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                String resourcePath = "/book" + pathInfo;
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
        req.getRequestDispatcher("/WEB-INF/book/index.html").forward(req, resp);
    }
}
