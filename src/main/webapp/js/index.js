let allBooks = [];
let filteredBooks = [];

// DOM elements
const booksGrid = document.getElementById('books-grid');
const sortSelect = document.getElementById('sort-select');
const authorFilter = document.getElementById('author-filter');
const stockFilter = document.getElementById('stock-filter');
const noResults = document.getElementById('no-results');
const totalBooksEl = document.getElementById('total-books');
const totalAuthorsEl = document.getElementById('total-authors');
const totalStockEl = document.getElementById('total-stock');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    
    // Event listeners
    sortSelect.addEventListener('change', applyFilters);
    authorFilter.addEventListener('change', applyFilters);
    stockFilter.addEventListener('change', applyFilters);
});

// Fetch books from servlet
async function loadBooks() {
    try {
        const response = await fetch('/api/books');
        
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        
        allBooks = await response.json();
        filteredBooks = [...allBooks];
        
        populateAuthorFilter();
        updateStats();
        applyFilters();
        
    } catch (error) {
        console.error('Error loading books:', error);
        showError();
    }
}

// Populate author filter dropdown
function populateAuthorFilter() {
    const authors = [...new Set(allBooks.map(book => book.author))].sort();
    
    authors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
}

// Update statistics
function updateStats() {
    const totalBooks = allBooks.length;
    const totalAuthors = new Set(allBooks.map(book => book.author)).size;
    const totalStock = allBooks.reduce((sum, book) => sum + book.qty, 0);
    
    animateCounter(totalBooksEl, totalBooks);
    animateCounter(totalAuthorsEl, totalAuthors);
    animateCounter(totalStockEl, totalStock);
}

// Animate counter
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 20);
}

// Apply filters and sorting
function applyFilters() {
    filteredBooks = [...allBooks];
    
    // Apply author filter
    const selectedAuthor = authorFilter.value;
    if (selectedAuthor !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.author === selectedAuthor);
    }
    
    // Apply stock filter
    const selectedStock = stockFilter.value;
    if (selectedStock === 'in-stock') {
        filteredBooks = filteredBooks.filter(book => book.qty > 5);
    } else if (selectedStock === 'low-stock') {
        filteredBooks = filteredBooks.filter(book => book.qty > 0 && book.qty <= 5);
    }
    
    // Apply sorting
    const sortValue = sortSelect.value;
    switch (sortValue) {
        case 'title-asc':
            filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'price-asc':
            filteredBooks.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredBooks.sort((a, b) => b.price - a.price);
            break;
        case 'author-asc':
            filteredBooks.sort((a, b) => a.author.localeCompare(b.author));
            break;
    }
    
    renderBooks();
}

// Render books to grid
function renderBooks() {
    booksGrid.innerHTML = '';
    
    if (filteredBooks.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    filteredBooks.forEach((book, index) => {
        const bookCard = createBookCard(book, index);
        booksGrid.appendChild(bookCard);
    });
}

// Create book card element
function createBookCard(book, index) {
    const card = document.createElement('div');
    card.className = 'book-card fade-in';
    card.style.animationDelay = `${index * 0.05}s`;
    
    const stockStatus = getStockStatus(book.qty);
    const stockClass = stockStatus.class;
    const stockText = stockStatus.text;
    const isSoldOut = book.qty === 0;
    
    card.innerHTML = `
        <div class="book-cover">
            <img 
                src="/static/bookpage/${book.id}.jpg"
                alt="${escapeHtml(book.title)}"
                class="book-cover-img"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >
            <div class="book-cover-fallback" style="display:none; background: ${getRandomGradient()}">
                <div class="book-icon">📖</div>
            </div>
            ${isSoldOut ? `
            <div class="sold-out-overlay">
                <span class="sold-out-text">SOLD OUT</span>
            </div>` : ''}
        </div>
        <div class="book-info">
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <div class="book-author">${escapeHtml(book.author)}</div>
            <div class="book-details">
                <div class="book-price">$${book.price.toFixed(2)}</div>
                <div class="book-stock">
                    <span class="stock-indicator ${stockClass}"></span>
                    <span>${stockText}</span>
                </div>
                <div class="book-actions">
                    <button class="btn btn-primary" onclick="addToCart(${book.id})" ${isSoldOut ? 'disabled' : ''}>${isSoldOut ? 'Sold Out' : 'Add to Cart'}</button>
                    <a class="btn btn-outline" href="/book/${book.id}">Details</a>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Get stock status
function getStockStatus(qty) {
    if (qty === 0) {
        return { class: 'out-of-stock', text: 'Out of Stock' };
    } else if (qty <= 5) {
        return { class: 'low-stock', text: `Only ${qty} left!` };
    } else {
        return { class: 'in-stock', text: `${qty} in stock` };
    }
}

// Get random gradient for book cover
function getRandomGradient() {
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error message
function showError() {
    booksGrid.innerHTML = `
        <div class="loading-state">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h3>Unable to load books</h3>
            <p>Please check your database connection and try again.</p>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
    `;
}

// Add to cart function
function addToCart(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book || book.qty === 0) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === bookId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: book.id,
            title: book.title,
            author: book.author,
            price: book.price,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    // Update navbar badge
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = total;
        badge.style.display = 'flex';
    }

    // Show feedback
    const btn = event.target;
    const original = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.style.background = '#22c55e';
    setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
    }, 1500);
}