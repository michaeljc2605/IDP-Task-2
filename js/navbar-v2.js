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

  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = total;
      badge.style.display = total > 0 ? 'flex' : 'none';
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

    // wire close button inside mobile header
    const closeBtn = root.querySelector('.nav-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        linksEl.classList.remove('show');
        toggle.setAttribute('aria-expanded','false');
        toggle.focus();
      });
    }
  }

  async function init(){
    const placeholders = document.querySelectorAll('.site-navbar');
    if (!placeholders.length) return;
    const html = await fetchNavbarHtml();
    if (!html) return;
    placeholders.forEach(el => {
      el.innerHTML = html;
      const nav = el.querySelector('nav.site-nav');
      if (nav) nav.classList.add('enhanced');
      setupBehaviour(el);
    });

    // Update cart badge after navbar is injected
    updateCartBadge();

    // Listen for cart changes from other tabs or pages
    window.addEventListener('storage', updateCartBadge);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();