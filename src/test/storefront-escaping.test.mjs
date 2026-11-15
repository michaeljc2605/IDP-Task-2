import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const maliciousTitle = '" onload="alert(1)" ><script>alert(2)</script>&\'';
const maliciousAuthor = '<img src=x onerror=alert(3)>\'&';
const book = { id: 4, title: maliciousTitle, author: maliciousAuthor, price: 12.50, qty: 2, description: maliciousAuthor };
const encode = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const scripts = {};
for (const name of ['js/index.js', 'js/querybook.js', 'book/js/book.js', 'cart.html']) {
  scripts[name] = await readFile(new URL('../main/webapp/' + name, import.meta.url), 'utf8');
}

function browser() {
  const nodes = new Map(), ready = [];
  function element() {
    let html = '';
    return {
      children: [], style: {}, value: 'all', classList: { add() {}, remove() {} },
      appendChild(child) { this.children.push(child); },
      addEventListener() {},
      get innerHTML() { return html; },
      set innerHTML(value) { html = String(value); },
      // Real text-node serialization escapes angle brackets and ampersands, not quotes.
      set textContent(value) { html = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
      get textContent() { return html; },
    };
  }
  const getNode = id => {
    if (id === 'book-cover') return null;
    if (!nodes.has(id)) nodes.set(id, element());
    return nodes.get(id);
  };
  const context = vm.createContext({
    document: {
      createElement: element, getElementById: getNode, querySelector: () => null,
      addEventListener: (event, callback) => { if (event === 'DOMContentLoaded') ready.push(callback); },
    },
    localStorage: { getItem: key => key === 'cart' ? JSON.stringify([{ ...book, quantity: 1 }]) : null },
    location: { pathname: '/book/4' }, window: {}, console,
    setTimeout() {}, URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({ ...book }) }),
  });
  return { context, ready, getNode };
}

function assertSafeBook(html, includesImageAlt = true) {
  assert.ok(html.includes(encode(maliciousTitle)), 'Title must be rendered as escaped text');
  assert.ok(html.includes(encode(maliciousAuthor)), 'Author must be rendered as escaped text');
  assert.ok(!html.includes(maliciousTitle));
  assert.ok(!html.includes(maliciousAuthor));
  assert.doesNotMatch(html, /<script\b/i);
  if (includesImageAlt) {
    const image = html.match(/<img\b[^>]*\balt="([^"]*)"/);
    assert.ok(image, 'Expected the original book-cover image');
    assert.equal(image[1], encode(maliciousTitle), 'Quotes must stay inside the single alt attribute');
  }
}

test('homepage title and author cannot inject markup or escape the image alt attribute', () => {
  const visit = browser();
  vm.runInContext(scripts['js/index.js'], visit.context);
  assertSafeBook(visit.context.createBookCard(book, 0).innerHTML);
});

test('search results escape attribute quotes and text content', () => {
  const visit = browser();
  vm.runInContext(scripts['js/querybook.js'], visit.context);
  visit.context.renderResults([book]);
  assertSafeBook(visit.getNode('results').children[1].children[0].innerHTML);
});

test('book details escape the same API title in image attributes and headings', async () => {
  const visit = browser();
  vm.runInContext(scripts['book/js/book.js'], visit.context);
  visit.ready[0]();
  await new Promise(resolve => setImmediate(resolve));
  assertSafeBook(visit.getNode('book-root').innerHTML);
});

test('cart content remains text after catalogue values are stored locally', () => {
  const visit = browser();
  const script = [...scripts['cart.html'].matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1]).find(source => source.includes('async function placeOrder()'));
  vm.runInContext(script, visit.context);
  assertSafeBook(visit.getNode('cart-items').innerHTML, false);
});

test('non-numeric ID and stock values cannot add attributes through numeric template slots', () => {
  const visit = browser();
  vm.runInContext(scripts['js/index.js'], visit.context);
  const payload = '4" onload="alert(4)';
  const html = visit.context.createBookCard({ ...book, id: payload, qty: payload }, 0).innerHTML;
  assert.ok(!html.includes(payload));
  assert.match(html, /src="\/static\/bookpage\/NaN\.jpg\?v=20261115c"/);
});
