// ===================================
// SEARCH PAGE JAVASCRIPT
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    initSearchPage();
});

function initSearchPage() {
    const form = document.getElementById('searchForm');
    const resetBtn = document.getElementById('resetBtn');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectionCount);
    });

    form.addEventListener('submit', handleFormSubmit);
    resetBtn.addEventListener('click', handleReset);
    updateSelectionCount();
    addKeyboardNavigation();
}

function updateSelectionCount() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const count = checkboxes.length;
    const countElement = document.getElementById('selectionCount');

    if (count === 0) {
        countElement.textContent = 'No authors selected';
    } else if (count === 1) {
        countElement.textContent = '1 author selected';
    } else {
        countElement.textContent = `${count} authors selected`;
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        showAlert('Please select at least one author to search!');
        return false;
    }

    const selectedAuthors = Array.from(checkboxes).map(cb => cb.value);
    const params = new URLSearchParams();
    selectedAuthors.forEach(a => params.append('author', a));
    params.append('format', 'json');

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
        });

    return false;
}

function handleReset() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => { checkbox.checked = false; });
    updateSelectionCount();
    document.getElementById('results').innerHTML = '';
}

function showAlert(message) {
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = 'custom-alert';
    alert.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem;">
            <span>⚠️</span>
            <span>${message}</span>
        </div>
    `;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        border-left: 4px solid #115E59;
        transition: transform 0.3s ease-out;
        font-weight: 500;
    `;

    document.body.appendChild(alert);
    setTimeout(() => { alert.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
    setTimeout(() => {
        alert.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function renderResults(data) {
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
        resultsEl.innerHTML = `
            <div class="bg-white rounded-2xl shadow-md p-8 text-center text-gray-400">
                <div class="text-4xl mb-3">📭</div>
                <h3 class="text-lg font-semibold text-gray-600">No books found</h3>
                <p class="text-sm mt-1">Try selecting different authors.</p>
            </div>`;
        return;
    }

    const header = document.createElement('div');
    header.className = 'mb-4';
    header.innerHTML = `<p class="text-sm text-gray-500 font-medium">${data.length} book${data.length !== 1 ? 's' : ''} found</p>`;
    resultsEl.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 gap-4';

    data.forEach(book => {
        const stockColor = book.qty === 0 ? 'text-red-500' : book.qty <= 5 ? 'text-yellow-600' : 'text-green-600';
        const stockText = book.qty === 0 ? 'Out of Stock' : book.qty <= 5 ? `Only ${book.qty} left` : `${book.qty} in stock`;

        const card = document.createElement('a');
        card.href = `/book/${book.id}`;
        card.className = 'block bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200';
        card.innerHTML = `
            <div class="flex items-center gap-5 p-5">
                <img 
                    src="/static/bookpage/${book.id}.jpg"
                    alt="${escapeHtml(book.title)}"
                    class="w-16 h-22 object-contain rounded-lg flex-shrink-0"
                    style="height:88px;"
                    onerror="this.style.display='none'">
                <div class="flex-grow min-w-0">
                    <h3 class="font-bold text-gray-800 text-base truncate">${escapeHtml(book.title)}</h3>
                    <p class="text-gray-500 text-sm mb-2">by ${escapeHtml(book.author)}</p>
                    <div class="flex items-center gap-4">
                        <span class="font-bold text-lg" style="color:#115E59;">$${Number(book.price).toFixed(2)}</span>
                        <span class="text-sm ${stockColor} font-medium">${stockText}</span>
                    </div>
                </div>
                <div class="flex-shrink-0 text-gray-300 text-xl">→</div>
            </div>
        `;
        grid.appendChild(card);
    });

    resultsEl.appendChild(grid);
}

function addKeyboardNavigation() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                checkboxes[(index + 1) % checkboxes.length].focus();
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                checkboxes[(index - 1 + checkboxes.length) % checkboxes.length].focus();
            }
        });
    });
}

window.searchPageUtils = {
    selectAll: () => { document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true); updateSelectionCount(); },
    deselectAll: handleReset,
    getSelectedAuthors: () => Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
};