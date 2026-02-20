// Footer injector (footer-v2): fetches components/footer.html and injects into `.site-footer` placeholders
(function(){
  async function loadFooter(){
    const placeholders = document.querySelectorAll('.site-footer');
    if (!placeholders.length) return;
    try {
      const resp = await fetch('/components/footer.html');
      if (!resp.ok) throw new Error('Footer fetch failed: ' + resp.status);
      const html = await resp.text();
      placeholders.forEach(el => el.innerHTML = html);
    } catch (e) {
      console.error('Failed to load footer component', e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadFooter);
  else loadFooter();
})();
