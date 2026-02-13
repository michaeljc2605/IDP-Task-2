// ===================================
// SEARCH PAGE JAVASCRIPT
// ===================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initSearchPage();
});

// Initialize search page functionality
function initSearchPage() {
    const form = document.getElementById('searchForm');
    const resetBtn = document.getElementById('resetBtn');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selectionCount = document.getElementById('selectionCount');

    // Add change listeners to all checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectionCount);
    });

    // Add form submit listener
    form.addEventListener('submit', handleFormSubmit);

    // Add reset button listener
    resetBtn.addEventListener('click', handleReset);

    // Initialize selection count
    updateSelectionCount();

    // Add keyboard navigation
    addKeyboardNavigation();
}

// Update selection count display
function updateSelectionCount() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const count = checkboxes.length;
    const countElement = document.getElementById('selectionCount');
    const formSection = document.querySelector('.form-section');
    
    // Remove error state if exists
    formSection.classList.remove('error');
    
    if (count === 0) {
        countElement.textContent = 'No authors selected';
        countElement.classList.remove('active');
    } else if (count === 1) {
        countElement.textContent = '1 author selected';
        countElement.classList.add('active');
    } else {
        countElement.textContent = `${count} authors selected`;
        countElement.classList.add('active');
    }
}

// Handle form submission
function handleFormSubmit(e) {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const formSection = document.querySelector('.form-section');
    
    if (checkboxes.length === 0) {
        e.preventDefault();
        
        // Show error state
        formSection.classList.add('error');
        
        // Show alert
        showAlert('Please select at least one author to search!');
        
        // Focus on first checkbox
        document.getElementById('author1').focus();
        
        return false;
    }
    
    // Submit via fetch and render results in-page
    e.preventDefault();

    const form = document.getElementById('searchForm');
    form.classList.add('loading');

    const selectedAuthors = Array.from(checkboxes).map(cb => cb.value);

    // Build query string with multiple author params
    const params = new URLSearchParams();
    selectedAuthors.forEach(a => params.append('author', a));
    params.append('format', 'json'); // request JSON response

    fetch('query?' + params.toString(), { method: 'GET' })
        .then(resp => {
            if (!resp.ok) throw new Error('Network response was not ok');
            return resp.json();
        })
        .then(data => {
            renderResults(data);
        })
        .catch(err => {
            showAlert('Error fetching results.');
            console.error(err);
        })
        .finally(() => {
            form.classList.remove('loading');
        });

    return false;
}

// Handle reset button
function handleReset() {
    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Update count
    updateSelectionCount();
    
    // Add subtle animation
    const authorGrid = document.querySelector('.author-grid');
    authorGrid.style.opacity = '0.5';
    setTimeout(() => {
        authorGrid.style.opacity = '1';
    }, 150);
}

// Show custom alert
function showAlert(message) {
    // Create custom alert (better UX than browser alert)
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">⚠️</span>
            <span class="alert-message">${message}</span>
        </div>
    `;
    
    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-left: 4px solid #e74c3c;
        transition: transform 0.3s ease-out;
    `;
    
    document.body.appendChild(alert);
    
    // Animate in
    setTimeout(() => {
        alert.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        alert.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 3000);
}

// Escape HTML to prevent XSS (used when rendering results)
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Render results under the form
function renderResults(data) {
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
        resultsEl.innerHTML = '<div class="no-results"><h3>No books found</h3><p>Try selecting different authors.</p></div>';
        return;
    }

    const list = document.createElement('div');
    list.className = 'results-list';

    data.forEach(book => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <div class="result-title">${escapeHtml(book.title)}</div>
            <div class="result-meta">${escapeHtml(book.author)} — $${Number(book.price).toFixed(2)} — Qty: ${book.qty}</div>
        `;
        list.appendChild(item);
    });

    resultsEl.appendChild(list);
}

// Add keyboard navigation
function addKeyboardNavigation() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('keydown', (e) => {
            // Space to toggle
            if (e.key === ' ') {
                e.preventDefault();
                checkbox.checked = !checkbox.checked;
                updateSelectionCount();
            }
            
            // Arrow keys to navigate
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (index + 1) % checkboxes.length;
                checkboxes[nextIndex].focus();
            }
            
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = (index - 1 + checkboxes.length) % checkboxes.length;
                checkboxes[prevIndex].focus();
            }
        });
    });
}

// Select all functionality (optional enhancement)
function selectAll() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateSelectionCount();
}

// Deselect all functionality (optional enhancement)
function deselectAll() {
    handleReset();
}

// Get selected authors (helper function)
function getSelectedAuthors() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Log selected authors to console (for debugging)
function logSelectedAuthors() {
    const authors = getSelectedAuthors();
    console.log('Selected authors:', authors);
}

// Export functions for potential use elsewhere
window.searchPageUtils = {
    selectAll,
    deselectAll,
    getSelectedAuthors,
    logSelectedAuthors
};
