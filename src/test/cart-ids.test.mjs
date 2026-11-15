import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const page = await readFile(new URL('../main/webapp/cart.html', import.meta.url), 'utf8');
const cartScript = [...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(script => script.includes('async function placeOrder()'));
const homeScript = await readFile(new URL('../main/webapp/js/index.js', import.meta.url), 'utf8');
const detailScript = await readFile(new URL('../main/webapp/book/js/book.js', import.meta.url), 'utf8');
assert.ok(cartScript, 'Test the inline script shipped in the actual cart page');

const sampleBook = { id: 4, title: 'Fixture Book', author: 'Fixture Author', price: 14.50, qty: 12, description: 'Book fixture' };
const cartBook = (id, quantity = 1) => ({ id, title: sampleBook.title, author: sampleBook.author, price: sampleBook.price, quantity });
function storageWith(items) {
  const values = new Map([['cart', JSON.stringify(items)]]);
  return {getItem:key=>values.get(key)??null, setItem:(key,value)=>values.set(key,String(value)), removeItem:key=>values.delete(key)};
}
const storedCart = storage => JSON.parse(storage.getItem('cart') || '[]');
const plain = value => JSON.parse(JSON.stringify(value));

function element() {
  const listeners = new Map();
  let text = '', html = '';
  return {
    listeners, value:'all', style:{}, disabled:false,
    classList:{add(){},remove(){},toggle(){return true;}},
    appendChild(){}, remove(){},
    addEventListener:(name,callback)=>listeners.set(name,callback),
    get textContent(){return text;},
    set textContent(value){text=String(value);html=text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));},
    get innerHTML(){return html;}, set innerHTML(value){html=String(value);},
  };
}
function browser(storage, respond) {
  const nodes = new Map(), ready = [];
  const getNode = id => {
    if(id === 'book-cover') return null; // Cover animation does not affect cart state.
    if(!nodes.has(id))nodes.set(id,element());
    return nodes.get(id);
  };
  getNode('book-title').textContent=sampleBook.title;
  getNode('book-author').textContent='by '+sampleBook.author;
  getNode('price-value').textContent='$'+sampleBook.price.toFixed(2);
  const context = vm.createContext({
    localStorage:storage,
    document:{
      getElementById:getNode,
      createElement:element,
      querySelector:selector=>selector==='.reading-progress'?null:getNode(selector.slice(1)),
      addEventListener:(name,callback)=>{if(name==='DOMContentLoaded')ready.push(callback);},
    },
    location:{pathname:'/book/4'},
    window:{addEventListener(){}},
    fetch:respond,
    event:{target:element()},
    URLSearchParams,
    setTimeout(){return 0;}, setInterval(){return 0;}, clearInterval(){},
    console,
  });
  return {context,ready,getNode};
}
function openCart(storage) {
  const visit=browser(storage,()=>{throw new Error('Cart quantity tests must not submit orders');});
  vm.runInContext(cartScript,visit.context,{filename:'cart.html'});
  return visit;
}
async function openDetail(storage) {
  const visit=browser(storage,async url=>{
    assert.equal(url,'/api/books/4');
    return {ok:true,json:async()=>({...sampleBook})};
  });
  vm.runInContext(detailScript,visit.context,{filename:'book/js/book.js'});
  assert.equal(visit.ready.length,1);
  visit.ready[0]();
  // The shipped DOMContentLoaded callback starts async initialization without returning its promise.
  await new Promise(resolve=>setImmediate(resolve));
  const click=visit.getNode('add-to-cart').listeners.get('click');
  assert.equal(typeof click,'function','Book detail initialization must bind the actual cart button');
  return {click};
}
async function openHome(storage) {
  const visit=browser(storage,async url=>{
    assert.equal(url,'/api/books');
    return {ok:true,json:async()=>[{...sampleBook}]};
  });
  vm.runInContext(homeScript,visit.context,{filename:'js/index.js'});
  await visit.context.loadBooks();
  return visit;
}

test('numeric cart buttons update and remove a legacy string-ID item',()=>{
  const storage=storageWith([cartBook('4',2)]);
  const visit=openCart(storage);
  visit.context.updateQuantity(4,1);
  assert.deepEqual(storedCart(storage),[cartBook(4,3)]);
  visit.context.updateQuantity(4,-1);
  assert.deepEqual(storedCart(storage),[cartBook(4,2)]);
  visit.context.removeFromCart(4);
  assert.deepEqual(storedCart(storage),[]);

  storage.setItem('cart',JSON.stringify([cartBook('4',1)]));
  visit.context.updateQuantity(4,-1);
  assert.deepEqual(storedCart(storage),[],'Decreasing the final copy should remove the legacy item');
});

test('mixed numeric and string duplicates merge quantities before cart edits',()=>{
  const storage=storageWith([cartBook('4','2'),cartBook(4,3),cartBook('7',1)]);
  const visit=openCart(storage);
  assert.deepEqual(plain(visit.context.getCart()),[cartBook(4,5),cartBook(7,1)]);
  visit.context.updateQuantity(4,1);
  assert.deepEqual(storedCart(storage),[cartBook(4,6),cartBook(7,1)]);
});

test('detail Add to Cart writes a numeric ID and repeated clicks reuse one row',async()=>{
  const storage=storageWith([]);
  const visit=await openDetail(storage);
  visit.click();visit.click();
  assert.deepEqual(storedCart(storage),[cartBook(4,2)]);
});

test('detail Add to Cart matches an existing string ID and increments quantity numerically',async()=>{
  const storage=storageWith([cartBook('4','2')]);
  const visit=await openDetail(storage);
  visit.click();
  assert.deepEqual(storedCart(storage),[cartBook(4,3)]);
});

test('home Add to Cart reuses legacy detail rows and never adds a duplicate',async()=>{
  const storage=storageWith([cartBook('4','2')]);
  const visit=await openHome(storage);
  visit.context.addToCart(4);visit.context.addToCart(4);
  assert.deepEqual(storedCart(storage),[cartBook(4,4)]);
});
