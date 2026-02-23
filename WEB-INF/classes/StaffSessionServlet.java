import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/staff/session")
public class StaffSessionServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        resp.setContentType("text/plain;charset=UTF-8");

        HttpSession session = req.getSession(false); // false = don't create a new session
        if (session != null && session.getAttribute("staff.user") != null) {
            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().println("ok");
        } else {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().println("unauthorized");
        }
    }
}