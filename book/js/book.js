/* ===================================
   BOOK DETAIL PAGE - PREMIUM JAVASCRIPT
   =================================== */

(function() {
  'use strict';

  // ===================================
  // UTILITY FUNCTIONS
  // ===================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getBookIdFromPath() {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'book') return parts[1];
    return parts[1] || null;
  }

  // ===================================
  // PARTICLE ANIMATION SYSTEM
  // ===================================

  class ParticleSystem {
    constructor() {
      this.container = document.getElementById('particles-container');
      this.particles = [];
      this.maxParticles = 30;
      this.init();
    }

    init() {
      this.createParticles();
      this.animate();
    }

    createParticles() {
      for (let i = 0; i < this.maxParticles; i++) {
        setTimeout(() => this.addParticle(), i * 200);
      }
    }

    addParticle() {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      const duration = 15 + Math.random() * 15;
      const drift = -100 + Math.random() * 200;
      const startX = Math.random() * 100;
      
      particle.style.cssText = `
        left: ${startX}%;
        --duration: ${duration}s;
        --drift: ${drift}px;
        animation-delay: ${Math.random() * 5}s;
      `;
      
      this.container.appendChild(particle);
      this.particles.push(particle);

      particle.addEventListener('animationiteration', () => {
        particle.style.left = Math.random() * 100 + '%';
      });
    }

    animate() {
      // Continuous animation handled by CSS
    }
  }

  // ===================================
  // TOAST NOTIFICATION SYSTEM
  // ===================================

  class ToastManager {
    constructor() {
      this.container = document.getElementById('toast-container');
    }

    show(title, message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
      };

      toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
          <div class="toast-title">${escapeHtml(title)}</div>
          <div class="toast-message">${escapeHtml(message)}</div>
        </div>
      `;

      this.container.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    success(title, message) {
      this.show(title, message, 'success');
    }

    error(title, message) {
      this.show(title, message, 'error');
    }

    info(title, message) {
      this.show(title, message, 'info');
    }
  }

  // ===================================
  // BOOK DATA GENERATOR
  // ===================================

  class BookGenerator {
    getRating() {
      return 4.5;
    }
  }

  // ===================================
  // BOOK RENDERER
  // ===================================

  class BookRenderer {
    constructor(book, generator) {
      this.book = book;
      this.generator = generator;
    }

    render() {
      const description = this.book.description || "A captivating story that will transport you to another world.";
      const rating = this.generator.getRating();
      
      const stockStatus = this.getStockStatus();
      const stockClass = this.book.qty > 5 ? '' : (this.book.qty > 0 ? 'low-stock' : 'out-of-stock');

      return `
        <!-- Hero Section -->
        <section class="book-hero">
          <!-- Cover Section -->
          <div class="book-cover-section">
            <div class="book-cover-wrapper">
              <div class="book-cover" id="book-cover">
                ${this.book.qty > 0 && this.book.qty <= 5 ? '<div class="book-badge">Limited Stock</div>' : ''}
                ${this.book.qty === 0 ? '<div class="book-badge" style="background: var(--secondary)">Sold Out</div>' : ''}
                <img 
                  src="/static/bookpage/${this.book.id}.jpg"
                  alt="${escapeHtml(this.book.title)}"
                  style="width:100%; height:100%; object-fit:contain;"
                  onerror="this.style.display='none';"
                >
                <div class="book-cover-title">${escapeHtml(this.book.title)}</div>
                <div class="book-cover-author">by ${escapeHtml(this.book.author)}</div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="book-actions">
              <button class="action-btn btn-add-cart" id="add-to-cart" ${this.book.qty === 0 ? 'disabled' : ''}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="9" cy="21" r="1" stroke-width="2"/>
                  <circle cx="20" cy="21" r="1" stroke-width="2"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke-width="2"/>
                </svg>
                ${this.book.qty === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button class="action-btn btn-wishlist" id="add-to-wishlist">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-width="2"/>
                </svg>
                Add to Wishlist
              </button>
            </div>
          </div>

          <!-- Info Section -->
          <div class="book-info">
            <h1 class="book-title">${escapeHtml(this.book.title)}</h1>
            <p class="book-author">by ${escapeHtml(this.book.author)}</p>
            
            <!-- Meta Information -->
            <div class="book-meta">
              <div class="meta-item">
                <span class="meta-label">Price</span>
                <span class="meta-value price-value">$${Number(this.book.price).toFixed(2)}</span>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">Rating</span>
                <div class="rating-stars">
                  ${this.generateStars(rating)}
                </div>
              </div>
              
              <div class="meta-item">
                <span class="meta-label">Availability</span>
                <div class="stock-badge ${stockClass}">
                  <span class="stock-indicator"></span>
                  <span>${stockStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Description Section -->
        <section class="book-description">
          <h2 class="description-title">
            📚 About This Book
          </h2>
          <p class="description-text">${escapeHtml(description)}</p>
        </section>
      `;
    }

    generateStars(rating) {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      let stars = '';

      for (let i = 0; i < fullStars; i++) {
        stars += '<svg class="star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
      }

      if (hasHalfStar) {
        stars += '<svg class="star" viewBox="0 0 24 24" opacity="0.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
      }

      return stars;
    }

    getStockStatus() {
      if (this.book.qty === 0) return 'Out of Stock';
      if (this.book.qty <= 5) return `Only ${this.book.qty} left`;
      return 'In Stock';
    }
  }

  // ===================================
  // INTERACTIVE FEATURES
  // ===================================

  class InteractiveFeatures {
    constructor(toastManager) {
      this.toastManager = toastManager;
      this.wishlist = new Set(JSON.parse(localStorage.getItem('wishlist') || '[]'));
    }

    init() {
      this.setupCoverAnimation();
      this.setupButtons();
      this.setupThemeToggle();
      this.setupShareButton();
      this.setupReadingProgress();
    }

    setupCoverAnimation() {
      const cover = document.getElementById('book-cover');
      if (!cover) return;

      cover.addEventListener('mousemove', (e) => {
        const rect = cover.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        cover.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      cover.addEventListener('mouseleave', () => {
        cover.style.transform = '';
      });
    }

    setupButtons() {
      const addToCart = document.getElementById('add-to-cart');
      const addToWishlist = document.getElementById('add-to-wishlist');

      if (addToCart) {
        addToCart.addEventListener('click', () => {
          if (!addToCart.disabled) {
            this.toastManager.success('Added to Cart!', 'Book has been added to your shopping cart');
            this.animateButton(addToCart);
          }
        });
      }

      if (addToWishlist) {
        const bookId = getBookIdFromPath();
        
        if (this.wishlist.has(bookId)) {
          addToWishlist.classList.add('active');
          addToWishlist.innerHTML = addToWishlist.innerHTML.replace('Add to Wishlist', 'In Wishlist');
        }

        addToWishlist.addEventListener('click', () => {
          const isActive = addToWishlist.classList.toggle('active');
          
          if (isActive) {
            this.wishlist.add(bookId);
            this.toastManager.success('Added to Wishlist!', 'Book saved to your wishlist');
            addToWishlist.innerHTML = addToWishlist.innerHTML.replace('Add to Wishlist', 'In Wishlist');
          } else {
            this.wishlist.delete(bookId);
            this.toastManager.info('Removed from Wishlist', 'Book removed from your wishlist');
            addToWishlist.innerHTML = addToWishlist.innerHTML.replace('In Wishlist', 'Add to Wishlist');
          }

          localStorage.setItem('wishlist', JSON.stringify([...this.wishlist]));
          this.animateButton(addToWishlist);
        });
      }
    }

    animateButton(button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    }

    setupThemeToggle() {
      const themeToggle = document.getElementById('theme-toggle');
      const currentTheme = localStorage.getItem('theme') || 'light';
      
      if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
      }

      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          document.body.classList.toggle('dark-mode');
          const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
          localStorage.setItem('theme', newTheme);
          this.toastManager.info('Theme Changed', `Switched to ${newTheme} mode`);
        });
      }
    }

    setupShareButton() {
      const shareBtn = document.getElementById('share-btn');
      
      if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
          const bookTitle = document.querySelector('.book-title')?.textContent || 'this book';
          const shareData = {
            title: bookTitle,
            text: `Check out ${bookTitle}!`,
            url: window.location.href
          };

          try {
            if (navigator.share) {
              await navigator.share(shareData);
              this.toastManager.success('Shared!', 'Book shared successfully');
            } else {
              await navigator.clipboard.writeText(window.location.href);
              this.toastManager.success('Link Copied!', 'Book link copied to clipboard');
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Share failed:', err);
            }
          }
        });
      }
    }

    setupReadingProgress() {
      const progressBar = document.querySelector('.reading-progress');
      
      window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / documentHeight) * 100;
        
        if (progressBar) {
          progressBar.style.width = `${Math.min(progress, 100)}%`;
        }
      });
    }
  }

  // ===================================
  // MAIN APP
  // ===================================

  class BookDetailApp {
    constructor() {
      this.toastManager = new ToastManager();
      this.generator = new BookGenerator();
      this.particleSystem = null;
      this.features = null;
    }

    async init() {
      const bookId = getBookIdFromPath();
      if (!bookId) {
        this.showError('No book ID provided in URL');
        return;
      }

      await this.loadBook(bookId);
      this.particleSystem = new ParticleSystem();
      this.features = new InteractiveFeatures(this.toastManager);
      this.features.init();
    }

    async loadBook(bookId) {
      const root = document.getElementById('book-root');
      
      try {
        const response = await fetch(`/api/books/${encodeURIComponent(bookId)}`);

        if (!response.ok) {
          throw new Error('Failed to fetch book');
        }

        let book;
        try {
          book = await response.json();
        } catch (jsonErr) {
          const raw = await response.text();
          console.error('Failed to parse JSON response for /api/books/' + bookId + ':', jsonErr);
          console.error('Raw response:', raw);
          root.innerHTML = `<pre style="white-space:pre-wrap; background:#fff; padding:1rem; border-radius:6px;">${escapeHtml(raw)}</pre>`;
          throw jsonErr;
        }
        
        if (!book || !book.id) {
          this.showError('Book not found');
          return;
        }

        const renderer = new BookRenderer(book, this.generator);
        root.innerHTML = renderer.render();

      } catch (error) {
        console.error('Error loading book:', error);
        this.showError('Error loading book details');
      }
    }

    showError(message) {
      const root = document.getElementById('book-root');
      root.innerHTML = `
        <div class="book-description" style="text-align: center; padding: var(--space-3xl);">
          <div style="font-size: 4rem; margin-bottom: var(--space-lg);">📚</div>
          <h2 class="description-title">${escapeHtml(message)}</h2>
          <p class="description-text">Please try again or return to the library.</p>
          <a href="/" class="btn btn-primary" style="margin-top: var(--space-xl); display: inline-block;">
            Return to Library
          </a>
        </div>
      `;
    }
  }

  // ===================================
  // INITIALIZE APP
  // ===================================

  document.addEventListener('DOMContentLoaded', () => {
    const app = new BookDetailApp();
    app.init();
  });

})();