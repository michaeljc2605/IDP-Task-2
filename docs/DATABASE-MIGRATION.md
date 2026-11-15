# Move the Java bookshop database

This guide applies to the retained Java/Tomcat deployment. For the full native PHP site on InfinityFree, follow [the InfinityFree guide](INFINITYFREE.md).

The website remains the original Java 17 / Tomcat 10 application. Its database can run separately on a MySQL-compatible service such as TiDB Cloud Starter. Moving the database does not move the web server or change that server's sleep behaviour.

## Keep existing data first

If the old database is reachable, export it privately before changing the application connection. Preserve current order records, stock and staff accounts; the repository's old snapshot may be stale. Do not commit a live export or copy customer records into a public deployment artifact.

For a fresh catalogue-only recovery, `deployment/ebookshop-catalog-only.sql` creates three tables and inserts the 30 original books. Orders and staff accounts start empty. It contains no passwords, staff hashes, customer records, table drops or privileged MySQL server settings. Select a **new empty database** before running it. If tables already exist, stop and inspect them instead of replacing them.

The old `Database/ebookshop_backup.sql` is a historical dump containing order/contact records and a staff credential hash. It also contains server-specific and destructive directives. Do not use it as an automatic deployment seed. Staff access must be restored or provisioned privately; the catalogue-only import does not create a default login.

## TiDB connection

1. In TiDB Cloud, select the intended Starter instance and create/select the application's database, for example `ebookshop`. Keep the existing cinema database separate.
2. Import the catalogue-only file into that new database, or perform a separately reviewed migration of the current private data. The catalogue-only file should report 30 books, zero orders and zero staff accounts.
3. Obtain the instance's host, port and full username from its **Connect** panel. Use the actual database name in the JDBC path; an instance name alone is not a database name.
4. Save the following environment variables on the **Java web service**, not just the database service:

| Variable | Value |
| --- | --- |
| `DB_URL` | `jdbc:mysql://HOST:4000/ebookshop?sslMode=VERIFY_IDENTITY&tlsVersions=TLSv1.2,TLSv1.3&serverTimezone=UTC` |
| `DB_USER` | The complete username shown by TiDB Connect, including its prefix |
| `DB_PASS` | The existing private database password, stored only as a hosting secret |

Use the host and port supplied for the actual instance. Never put the password in the JDBC URL or repository. `MYSQL_HOST`, `MYSQL_URL` and `DATABASE_URL` alone do not configure this application; it reads the three names above. TiDB Starter requires TLS. With the current JDK and MySQL Connector, use certificate and hostname verification rather than disabling TLS to work around an error. See [TiDB's Starter connection guide](https://docs.pingcap.com/developer/dev-guide-build-cluster-in-cloud/).

The shared `Database` helper applies a 10-second connection timeout and 20-second socket timeout. It preserves the configured TLS settings. Without `DB_URL`, it retains the local-development `localhost:3306/ebookshop` default; a hosted deployment must set its real URL.

## Cut over and verify

Deploy the updated source from `src/main/java`; Maven and the Dockerfile use that source. The older Java files under `WEB-INF/classes` are historical copies and are not the Maven compilation source. Do not deploy the previously committed `target/ROOT.war` as the new build.

After saving the environment values and redeploying, verify:

- `/api/books` returns the 30-book catalogue; a book page and author search load.
- `/api/orders` returns 401 without a staff session and returns orders after valid staff sign-in.
- An explicitly authorized test order uses the database book title and price, decrements stock once, and appears only to staff. Negative quantities and insufficient stock are rejected.
- No database host, credentials or raw SQL exception is displayed to visitors. Safe server logs retain an operation name, SQL state and vendor error code for diagnosis.

Leave the old database intact until the new application has been verified and any current private records have been reconciled. This process does not cancel hosting or delete the old account.

## Local regression checks

`src/test/run-database-tests.sh` compiles the Java sources and exercises the actual MySQL-backed servlet behaviour with a disposable local fixture. It requires Java 17 or newer, MySQL tools and the project's existing JDBC/Servlet/jbcrypt dependency jars. It does not use hosted credentials or operate on a live database. Read the script's requirements before running it.
