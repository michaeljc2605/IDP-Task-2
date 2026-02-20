// Enhanced navbar injector and behaviour (navbar-v2)
// Builds on the original injector: fetches components/navbar.html and then wires mobile toggle and active link highlighting.

(function(){
  async function fetchNavbarHtml(){
    try {
      const resp = await fetch('/components/navbar.html');
      if (!resp.ok) throw new Error('Navbar fetch failed: ' + resp.status);
      return await resp.text();
    } catch (err) {
      console.error('Failed to load navbar component', err);
      return null;
    }
  }

  function setupBehaviour(root){
    // add a toggle button for small screens
    let toggle = root.querySelector('.nav-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Toggle navigation');
      toggle.innerHTML = '\u2630'; // hamburger
      const container = root.querySelector('.nav-container');
      if (container) container.insertBefore(toggle, container.querySelector('.nav-links'));
    }

    const linksEl = root.querySelector('.nav-links');
    if (!linksEl) return;

    toggle.addEventListener('click', () => {
      const showing = linksEl.classList.toggle('show');
      toggle.setAttribute('aria-expanded', showing ? 'true' : 'false');
    });

    // close nav when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (!linksEl.classList.contains('show')) return;
      if (root.contains(e.target)) return;
      linksEl.classList.remove('show');
      toggle.setAttribute('aria-expanded','false');
    });

    // mark active link by matching current path
    const anchors = Array.from(linksEl.querySelectorAll('a'));
    const current = window.location.pathname + window.location.hash;
    // prefer exact match then startsWith
    anchors.forEach(a => {
      try {
        const href = new URL(a.href, window.location.origin);
        const matchPath = href.pathname + href.hash;
        if (matchPath === current) a.classList.add('active');
        else if (current.startsWith(href.pathname) && href.pathname !== '/') a.classList.add('active');
      } catch (e) { /* ignore invalid hrefs */ }
    });

    // keyboard accessibility: close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && linksEl.classList.contains('show')) {
        linksEl.classList.remove('show');
        toggle.setAttribute('aria-expanded','false');
        toggle.focus();
      }
    });
  }

  async function init(){
    const placeholders = document.querySelectorAll('.site-navbar');
    if (!placeholders.length) return;
    const html = await fetchNavbarHtml();
    if (!html) return;
    placeholders.forEach(el => {
      // inject
      el.innerHTML = html;
      // small enhancement: wrap the default nav container with our `nav-brand` class for styling compat
      const nav = el.querySelector('nav.site-nav');
      if (nav) nav.classList.add('enhanced');
      // run behaviour setup for this injected nav
      setupBehaviour(el);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
