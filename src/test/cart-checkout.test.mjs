import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const page = await readFile(new URL('../main/webapp/cart.html', import.meta.url), 'utf8');
const checkoutScript = [...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(script => script.includes('async function placeOrder()'));
assert.ok(checkoutScript, 'Exercise the checkout code shipped in the actual cart page');

function storageWith(books) {
  const values = new Map([['cart', JSON.stringify(books)]]);
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

function openCart(storage, respond) {
  const nodes = new Map();
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, {
      value: '', textContent: '', innerHTML: '', className: '', style: {}, disabled: false,
      classList: { add() {}, remove() {} },
    });
    return nodes.get(id);
  }
  element('cust-name').value = 'Checkout test';
  element('cust-email').value = 'checkout@example.invalid';
  element('cust-phone').value = '00000000';
  const requestedBooks = [];
  const context = vm.createContext({
    localStorage: storage,
    document: { getElementById: element },
    URLSearchParams,
    fetch: async (url, options) => {
      assert.equal(url, '/api/orders/place');
      assert.equal(options.method, 'POST');
      const id = Number(options.body.get('book_id'));
      requestedBooks.push(id);
      return respond(id);
    },
  });
  vm.runInContext(checkoutScript, context, { filename: 'cart.html' });
  return { placeOrder: () => context.placeOrder(), requestedBooks, element };
}

const book = id => ({ id, title: `Book ${id}`, author: 'Fixture author', price: 10, quantity: 1 });
const accepted = () => ({ ok: true, json: async () => ({ success: true }) });
const cartContents = storage => JSON.parse(storage.getItem('cart') || '[]');

test('reload and retry submit only the rejected line after other lines were accepted', async () => {
  const storage = storageWith([book(1), book(2), book(3)]);
  const firstVisit = openCart(storage, id => id === 2
    ? { ok: false, json: async () => ({ message: 'Not enough stock' }) }
    : accepted());

  await firstVisit.placeOrder();
  assert.deepEqual(firstVisit.requestedBooks, [1, 2, 3]);
  assert.deepEqual(cartContents(storage), [book(2)]);
  assert.match(firstVisit.element('order-msg').textContent, /Not enough stock/);
  assert.equal(firstVisit.element('place-order-btn').disabled, false);

  // A fresh page shares only the persisted cart, as after a reload or a later visit.
  const retryVisit = openCart(storage, accepted);
  await retryVisit.placeOrder();
  assert.deepEqual(retryVisit.requestedBooks, [2], 'Accepted lines must not create duplicate orders');
  assert.deepEqual(cartContents(storage), []);
});

test('a network failure retains only the unacknowledged and unattempted lines', async () => {
  const storage = storageWith([book(1), book(2), book(3)]);
  const firstVisit = openCart(storage, id => {
    if (id === 2) throw new Error('Connection interrupted');
    return accepted();
  });
  await firstVisit.placeOrder();
  assert.deepEqual(firstVisit.requestedBooks, [1, 2]);
  assert.deepEqual(cartContents(storage), [book(2), book(3)]);
  assert.equal(firstVisit.element('place-order-btn').disabled, false);

  const retryVisit = openCart(storage, accepted);
  await retryVisit.placeOrder();
  assert.deepEqual(retryVisit.requestedBooks, [2, 3]);
  assert.deepEqual(cartContents(storage), []);
});

test('acknowledging the submitted quantity preserves books added while checkout is pending', async () => {
  const storage = storageWith([book(1)]);
  const visit = openCart(storage, () => {
    storage.setItem('cart', JSON.stringify([{ ...book(1), quantity: 2 }, book(2)]));
    return accepted();
  });
  await visit.placeOrder();
  assert.deepEqual(visit.requestedBooks, [1]);
  assert.deepEqual(cartContents(storage), [book(1), book(2)]);
});
