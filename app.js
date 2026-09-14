/* ==========================================================================
   Comet Book Swap — app logic
   No framework, no build step. Listings persist in localStorage.
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'cometBookSwap.listings.v1';

  const SEED_LISTINGS = [
    {
      id: 'seed-1',
      type: 'selling',
      title: 'Discrete Mathematics and Its Applications (8th ed.)',
      course: 'CS 2305',
      price: 45,
      condition: 'Good',
      notes: 'Some highlighting in ch. 1–3, otherwise clean. No missing pages.',
      contact: 'net-id: jsmith',
      sold: false,
      postedAt: daysAgo(4),
    },
    {
      id: 'seed-2',
      type: 'wanted',
      title: 'Fundamentals of Financial Management',
      course: 'FIN 3320',
      price: 30,
      condition: 'Any',
      notes: 'Looking for the loose-leaf or bound version, either is fine. Need it before the first exam.',
      contact: 'discord: comet.finance',
      sold: false,
      postedAt: daysAgo(2),
    },
    {
      id: 'seed-3',
      type: 'selling',
      title: 'Chemistry: The Central Science (14th ed.)',
      course: 'CHEM 1311',
      price: 60,
      condition: 'Like New',
      notes: 'Bought for a class I ended up dropping — barely opened. Includes access code (unused).',
      contact: 'utdallas.edu email',
      sold: false,
      postedAt: daysAgo(1),
    },
  ];

  function daysAgo(n) {
    return Date.now() - n * 24 * 60 * 60 * 1000;
  }

  // ---------- State ----------

  let listings = loadListings();
  let filterType = 'all';   // 'all' | 'selling' | 'wanted'
  let searchTerm = '';
  let showSold = false;

  // ---------- Persistence ----------

  function loadListings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        saveListings(SEED_LISTINGS);
        return SEED_LISTINGS.slice();
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('bad shape');
      return parsed;
    } catch (err) {
      console.warn('Comet Book Swap: could not read localStorage, starting fresh.', err);
      return SEED_LISTINGS.slice();
    }
  }

  function saveListings(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Comet Book Swap: could not save to localStorage.', err);
    }
  }

  function persist() {
    saveListings(listings);
  }

  // ---------- DOM refs ----------

  const grid = document.getElementById('listingGrid');
  const emptyState = document.getElementById('emptyState');
  const resultSummary = document.getElementById('resultSummary');
  const cardTemplate = document.getElementById('cardTemplate');

  const searchInput = document.getElementById('searchInput');
  const filterChips = document.querySelectorAll('.chip[data-filter]');
  const showSoldToggle = document.getElementById('showSoldToggle');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  const openFormBtn = document.getElementById('openFormBtn');
  const closeFormBtn = document.getElementById('closeFormBtn');
  const cancelFormBtn = document.getElementById('cancelFormBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const listingForm = document.getElementById('listingForm');
  const priceLabel = document.getElementById('priceLabel');
  const priceInput = document.getElementById('priceInput');
  const typeRadios = document.querySelectorAll('input[name="type"]');

  // ---------- Rendering ----------

  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  function relativeDate(timestamp) {
    const diffMs = timestamp - Date.now();
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Posted today';
    if (diffDays > -1) return 'Posted today';
    return 'Posted ' + relativeFormatter.format(diffDays, 'day');
  }

  function getFilteredListings() {
    const term = searchTerm.trim().toLowerCase();
    return listings.filter((item) => {
      if (!showSold && item.sold) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (term) {
        const haystack = (item.title + ' ' + item.course).toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }

  function render() {
    const filtered = getFilteredListings()
      .slice()
      .sort((a, b) => {
        if (a.sold !== b.sold) return a.sold ? 1 : -1;
        return b.postedAt - a.postedAt;
      });

    grid.innerHTML = '';

    filtered.forEach((item) => {
      const node = cardTemplate.content.firstElementChild.cloneNode(true);

      node.classList.toggle('is-wanted', item.type === 'wanted');
      node.classList.toggle('is-sold', !!item.sold);
      node.dataset.id = item.id;

      node.querySelector('.badge').textContent = item.sold
        ? 'Sold'
        : (item.type === 'selling' ? 'Selling' : 'Wanted');
      node.querySelector('.course-pill').textContent = item.course;
      node.querySelector('.card-title').textContent = item.title;

      const priceEl = node.querySelector('.card-price');
      if (item.type === 'wanted' && (!item.price || item.price === 0)) {
        priceEl.textContent = 'Budget: open';
      } else if (item.type === 'wanted') {
        priceEl.textContent = 'Budget: ' + currency.format(item.price);
      } else {
        priceEl.textContent = currency.format(item.price);
      }

      node.querySelector('.card-condition').textContent =
        item.condition === 'Any' ? 'Any condition works' : 'Condition: ' + item.condition;

      const notesEl = node.querySelector('.card-notes');
      if (item.notes && item.notes.trim()) {
        notesEl.textContent = item.notes.trim();
      } else {
        notesEl.remove();
      }

      node.querySelector('.contact-text').textContent = item.contact;
      node.querySelector('.posted-date').textContent = relativeDate(item.postedAt);

      const soldBtn = node.querySelector('.sold-btn');
      soldBtn.textContent = item.sold ? 'Mark as available' : 'Mark as sold';
      soldBtn.addEventListener('click', () => toggleSold(item.id));

      node.querySelector('.remove-btn').addEventListener('click', () => removeListing(item.id));

      grid.appendChild(node);
    });

    emptyState.hidden = filtered.length !== 0;

    const total = listings.filter((l) => showSold || !l.sold).length;
    resultSummary.textContent = filtered.length === total
      ? `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`
      : `${filtered.length} of ${total} listing${total === 1 ? '' : 's'}`;
  }

  // ---------- Actions ----------

  function toggleSold(id) {
    const item = listings.find((l) => l.id === id);
    if (!item) return;
    item.sold = !item.sold;
    persist();
    render();
  }

  function removeListing(id) {
    if (!confirm('Remove this listing? This can\'t be undone.')) return;
    listings = listings.filter((l) => l.id !== id);
    persist();
    render();
  }

  function addListing(data) {
    listings.unshift({
      id: 'listing-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      ...data,
      sold: false,
      postedAt: Date.now(),
    });
    persist();
    render();
  }

  // ---------- Filters & search ----------

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    render();
  });

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      filterType = chip.dataset.filter;
      render();
    });
  });

  showSoldToggle.addEventListener('change', (e) => {
    showSold = e.target.checked;
    render();
  });

  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    filterType = 'all';
    filterChips.forEach((c) => c.classList.toggle('is-active', c.dataset.filter === 'all'));
    render();
  });

  // ---------- Modal / form ----------

  function openModal() {
    modalBackdrop.hidden = false;
    document.getElementById('titleInput').focus();
    document.addEventListener('keydown', onEscape);
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    listingForm.reset();
    updatePriceLabel();
    document.removeEventListener('keydown', onEscape);
  }

  function onEscape(e) {
    if (e.key === 'Escape') closeModal();
  }

  function updatePriceLabel() {
    const type = document.querySelector('input[name="type"]:checked').value;
    if (type === 'wanted') {
      priceLabel.textContent = 'Budget (optional)';
      priceInput.required = false;
      priceInput.placeholder = '30';
    } else {
      priceLabel.textContent = 'Asking price';
      priceInput.required = true;
      priceInput.placeholder = '45';
    }
  }

  openFormBtn.addEventListener('click', openModal);
  closeFormBtn.addEventListener('click', closeModal);
  cancelFormBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  typeRadios.forEach((r) => r.addEventListener('change', updatePriceLabel));

  listingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(listingForm);
    const type = formData.get('type');
    const price = formData.get('price');

    addListing({
      type,
      title: String(formData.get('title')).trim(),
      course: String(formData.get('course')).trim().toUpperCase(),
      price: price ? Number(price) : 0,
      condition: formData.get('condition'),
      notes: String(formData.get('notes') || '').trim(),
      contact: String(formData.get('contact')).trim(),
    });

    closeModal();
  });

  // ---------- Init ----------

  updatePriceLabel();
  render();
})();
