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

@WebServlet("/api/books")
public class BooksServlet extends HttpServlet {

   @Override
   public void doGet(HttpServletRequest request, HttpServletResponse response)
               throws ServletException, IOException {
      response.setContentType("application/json");
      response.setCharacterEncoding("UTF-8");
      PrintWriter out = response.getWriter();

      try (
         Connection conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/ebookshop?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC",
            "root", "");
         Statement stmt = conn.createStatement();
      ) {
         String sqlStr = "SELECT * FROM books ORDER BY title";
         ResultSet rset = stmt.executeQuery(sqlStr);

         // Build JSON array
         StringBuilder json = new StringBuilder();
         json.append("[");
         
         boolean first = true;
         while(rset.next()) {
            if (!first) {
               json.append(",");
            }
            first = false;
            
            json.append("{");
            json.append("\"id\":").append(rset.getInt("id")).append(",");
            json.append("\"title\":\"").append(escapeJson(rset.getString("title"))).append("\",");
            json.append("\"author\":\"").append(escapeJson(rset.getString("author"))).append("\",");
            json.append("\"price\":").append(rset.getFloat("price")).append(",");
            json.append("\"qty\":").append(rset.getInt("qty"));
            json.append("}");
         }
         
         json.append("]");
         out.print(json.toString());
         
      } catch(SQLException ex) {
         response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
         out.print("{\"error\":\"" + escapeJson(ex.getMessage()) + "\"}");
         ex.printStackTrace();
      }
 
      out.close();
   }
   
   // Escape special characters for JSON
   private String escapeJson(String str) {
      if (str == null) return "";
      return str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
   }
}