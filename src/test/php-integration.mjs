import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';

const run = promisify(execFile);
const origin = process.env.EBOOK_PHP_TEST_ORIGIN;
const schema = process.env.EBOOK_PHP_TEST_SCHEMA;
assert.match(origin ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);
assert.match(schema ?? '', /^ebookshop_test_[A-Za-z0-9_]+$/);
const mysqlArgs = ['--no-defaults', '--protocol=socket', `--socket=${process.env.EBOOK_PHP_TEST_SOCKET}`, '--user=root', `--database=${schema}`, '--batch', '--skip-column-names'];
async function sql(statement) {
  return (await run(process.env.EBOOK_PHP_TEST_MYSQL_BIN, [...mysqlArgs, '--execute', statement])).stdout.trim();
}
const cookieJar = () => new Map();
const guest = cookieJar(), staff = cookieJar();
async function request(path, { jar = guest, data, requestOrigin = origin } = {}) {
  const headers = {};
  if (jar.size) headers.Cookie = [...jar].map(([name,value])=>`${name}=${value}`).join('; ');
  if (data !== undefined) headers.Origin = requestOrigin;
  const response = await fetch(origin + path, {method:data === undefined ? 'GET' : 'POST', headers, body:data === undefined ? undefined : new URLSearchParams(data), redirect:'manual', signal:AbortSignal.timeout(25000)});
  const setCookies = response.headers.getSetCookie();
  for (const value of setCookies) {
    const first = value.split(';',1)[0]; const index=first.indexOf('=');
    if(index>0) jar.set(first.slice(0,index),first.slice(index+1));
  }
  const text = await response.text();
  return {status:response.status, text, headers:response.headers, setCookies, json:()=>JSON.parse(text)};
}
let groups=0;
function pass(label) { groups++; console.log('PASS '+label); }
const fields = {cust_name:'Disposable Fixture',cust_email:'fixture@example.invalid',cust_phone:'00000000',book_id:'1',qty_ordered:'1',book_title:'Tampered title',total_price:'0.01'};

let books = await request('/api/books');
assert.equal(books.status,200); assert.equal(books.json().length,30);
let single = await request('/api/books/1');
assert.equal(single.status,200); assert.equal(single.json().id,1); assert.equal(typeof single.json().description,'string');
let bookPage = await request('/book/1');
assert.equal(bookPage.status,200); assert.match(bookPage.text,/<html/i); assert.match(bookPage.text,/book\/js\/book\.js/);
pass('Catalog, individual book API and original book page retain their contracts');

let query = await request('/query?author=Charles+Dickens&author=Jane+Austen&format=json');
assert.equal(query.status,200); assert(query.json().length>1);
assert(query.json().some(book=>book.author==='Charles Dickens')); assert(query.json().some(book=>book.author==='Jane Austen'));
assert(query.json().every(book=>['Charles Dickens','Jane Austen'].includes(book.author) && book.qty>0));
let htmlQuery=await request('/query?author=Charles+Dickens');
assert.equal(htmlQuery.status,200); assert.match(htmlQuery.text,/<html|<p/i);
pass('Repeated author filters work in both original query formats');

assert.equal((await request('/staff/session',{jar:staff})).status,401);
const previousCookies = [...staff.entries()];
assert.equal((await request('/api/orders')).status,401);
let badLogin=await request('/staff/login',{jar:staff,data:{username:'fixture-staff',password:'incorrect'}});
assert.equal(badLogin.status,401);
let foreignLogin=await request('/staff/login',{jar:staff,requestOrigin:'https://unrelated.invalid',data:{username:'fixture-staff',password:'fixture-only-not-a-live-password'}});
assert.equal(foreignLogin.status,403); assert.equal((await request('/staff/session',{jar:staff})).status,401);
let goodLogin=await request('/staff/login',{jar:staff,data:{username:'fixture-staff',password:'fixture-only-not-a-live-password'}});
assert.equal(goodLogin.status,200); assert.match(goodLogin.text,/successful/i);
assert(goodLogin.setCookies.some(cookie=>/HttpOnly/i.test(cookie)&&/SameSite=Lax/i.test(cookie)),'Login cookie must be HttpOnly and SameSite=Lax');
if(previousCookies.length) assert.notDeepEqual([...staff.entries()],previousCookies,'Login must regenerate the anonymous session');
assert.equal((await request('/staff/session',{jar:staff})).status,200);
assert.equal((await request('/api/orders',{jar:staff})).status,200);
pass('Staff login, protected APIs, session regeneration and cookie flags work over HTTP');

const beforeQty=Number(await sql('SELECT qty FROM books WHERE id=1'));
for(const quantity of ['-1','0','1.5','2147483648','not-a-number']) {
  assert.equal((await request('/api/orders/place',{data:{...fields,qty_ordered:quantity}})).status,400);
}
let foreign=await request('/api/orders/place',{requestOrigin:'https://unrelated.invalid',data:fields});
assert.equal(foreign.status,403);
assert.equal(Number(await sql('SELECT qty FROM books WHERE id=1')),beforeQty);
assert.equal(await sql('SELECT COUNT(*) FROM order_records'),'0');
pass('Invalid quantities and foreign-origin writes cannot change inventory or orders');

let accepted=await request('/api/orders/place',{data:{...fields,qty_ordered:'2'}});
assert.equal(accepted.status,200); assert.equal(accepted.json().success,true);
const saved=(await sql('SELECT book_title,total_price,qty_ordered FROM order_records LIMIT 1')).split('\t');
assert.equal(saved[0],single.json().title); assert.equal(Number(saved[1]),Number(single.json().price)*2); assert.equal(saved[2],'2');
assert.equal(Number(await sql('SELECT qty FROM books WHERE id=1')),beforeQty-2);
let listed=await request('/api/orders',{jar:staff});
assert.equal(listed.status,200); assert.equal(listed.json()[0].cust_email,'fixture@example.invalid');
pass('Orders use the database title and price, decrement stock and remain visible only to staff');

let missing=await request('/api/orders/place',{data:{...fields,book_id:'999999'}});
let over=await request('/api/orders/place',{data:{...fields,qty_ordered:'999999'}});
assert.equal(missing.status,404); assert.equal(over.status,409);
assert.equal(await sql('SELECT COUNT(*) FROM order_records'),'1');
assert.equal(Number(await sql('SELECT qty FROM books WHERE id=1')),beforeQty-2);
pass('Missing books and insufficient stock leave the existing transaction history intact');

await sql('RENAME TABLE order_records TO order_records_unavailable');
try {
  let unavailable=await request('/api/orders/place',{data:fields});
  assert.equal(unavailable.status,503); assert.equal(unavailable.json().success,false);
  assert(!/order_records|SQLSTATE|ebookshop_test_|password/i.test(unavailable.text));
  assert.equal(Number(await sql('SELECT qty FROM books WHERE id=1')),beforeQty-2);
} finally { await sql('RENAME TABLE order_records_unavailable TO order_records'); }
pass('Database failures return a generic error and roll back inventory');

await sql('DELETE FROM order_records');
await sql('UPDATE books SET qty=1 WHERE id=1');
const contenders = await Promise.all([request('/api/orders/place',{jar:cookieJar(),data:fields}),request('/api/orders/place',{jar:cookieJar(),data:fields})]);
assert.deepEqual(contenders.map(result=>result.status).sort(),[200,409]);
assert.equal(await sql('SELECT qty FROM books WHERE id=1'),'0'); assert.equal(await sql('SELECT COUNT(*) FROM order_records'),'1');
pass('Competing PHP requests can sell the final copy only once');

const sessionId=staff.get('gm_ebookshop');
assert.match(sessionId??'',/^[A-Za-z0-9,-]+$/);
const fixture=process.env.EBOOK_PHP_TEST_FIXTURE;
assert.match(fixture??'',/\/ebookshop-php-test\.[A-Za-z0-9]+$/);
const sessionPath=fixture+'/sessions/sess_'+sessionId;
const sessionData=await readFile(sessionPath,'utf8');
assert.match(sessionData,/staff_login_at\|i:[0-9]+;/);
await writeFile(sessionPath,sessionData.replace(/staff_login_at\|i:[0-9]+;/,`staff_login_at|i:${Math.floor(Date.now()/1000)-3601};`));
assert.equal((await request('/staff/session',{jar:staff})).status,401);
assert.equal((await request('/api/orders',{jar:staff})).status,401);
pass('Expired staff sessions lose access even when their last activity was recent');

console.log(`PASS ${groups} native PHP integration groups; live Apache rewrites still require hosted verification.`);
