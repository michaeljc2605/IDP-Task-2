import { cp, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'build/infinityfree');
try { await stat(destination); throw new Error('Choose a new output directory; existing files will not be replaced.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const webRoot = join(destination, 'htdocs');
await mkdir(webRoot, { recursive: true });
const files = [];
async function copyStatic(directory = '') {
  for (const entry of await readdir(join(root, 'src/main/webapp', directory), { withFileTypes: true })) {
    const name = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${name}`);
    if (entry.name === 'WEB-INF' || entry.name.startsWith('.') || entry.name === 'META-INF') continue;
    if (entry.isDirectory()) { await copyStatic(name); continue; }
    if (!entry.isFile() || !/\.(?:html|css|js|png|jpe?g|svg|gif|webp|avif|mp4|woff2?|ttf|ico)$/i.test(entry.name)) continue;
    await mkdir(dirname(join(webRoot, name)), { recursive: true });
    await cp(join(root, 'src/main/webapp', name), join(webRoot, name));
    files.push(name);
  }
}
await copyStatic();
for (const [source, target] of [
  ['php/app.php', 'app.php'], ['php/lib.php', 'php/lib.php'], ['php/config.example.php', 'php/config.example.php'],
  ['php/.htaccess', 'php/.htaccess'], ['src/main/webapp/WEB-INF/book/index.html', 'php/book.html'],
  ['deployment/infinityfree/.htaccess', '.htaccess'],
]) {
  await mkdir(dirname(join(webRoot, target)), { recursive: true });
  await cp(join(root, source), join(webRoot, target)); files.push(target);
}
await mkdir(join(destination, 'database'));
await cp(join(root, 'deployment/ebookshop-catalog-only.sql'), join(destination, 'database/catalog-only.sql'));
await cp(join(root, 'docs/INFINITYFREE.md'), join(destination, 'INFINITYFREE.md'));
await writeFile(join(destination, 'manifest.json'), JSON.stringify({ backend: 'native-php', privateConfigurationIncluded: false, files: files.sort() }, null, 2) + '\n');
await writeFile(join(destination, 'README.txt'), `GM eBookshop — full native PHP deployment\n\nUpload only the CONTENTS of htdocs into this bookshop domain's document root.\nSelect a NEW EMPTY MySQL database and import database/catalog-only.sql. This seeds 30 books, zero orders and zero staff accounts.\nNever import it over an existing database or upload SQL files to the public document root.\nCopy php/config.example.php privately to php/config.local.php ON THE HOST and enter the hosting account's assigned MySQL details and the exact HTTPS public origin.\nExisting private configuration is intentionally excluded from this package.\nStaff access must be restored or provisioned privately; there is no default password or public setup endpoint.\nRead INFINITYFREE.md and verify the hosted routes before claiming deployment is complete.\n`);
console.log(`Prepared ${files.length} public runtime files in ${relative(process.cwd(), destination)}. No live configuration or customer records copied.`);
