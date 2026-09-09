/* ============================================================
   DIPSIE COMMISSION — SCRIPT.JS
   All interactivity. No backend — everything is simulated
   client-side, as noted in the UI (form disclaimer + confirm modal).
   ============================================================ */

   document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------
       SHARED STATE
       Tracks the user's current selections across the whole page
       so the commission cards, style cards, calculator and order
       form all stay in sync.
    ---------------------------------------------------------- */
    const state = {
      type: '',       // 'chibi' | 'halfbody' | 'fullbody'
      typePrice: 0,
      style: '',      // 'anime' | 'manhwa' | 'semirealism'
      addons: []      // [{name, price}]
    };
  
    const typeLabels = { chibi: 'Chibi', halfbody: 'Half Body', fullbody: 'Full Body' };
    const styleLabels = { anime: 'Anime', manhwa: 'Manhwa', semirealism: 'Semi Realism' };
    const typePrices = { chibi: 35000, halfbody: 75000, fullbody: 120000 };
  
    function formatRp(n) {
      return 'Rp' + n.toLocaleString('id-ID');
    }
  
    /* ----------------------------------------------------------
       NAVBAR — sticky shadow state + smooth scroll + mobile menu
    ---------------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
      toggleBackToTop();
    });
  
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        closeMobileMenu();
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  
    document.querySelectorAll('[data-scroll]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.querySelector(btn.dataset.scroll);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });
    function closeMobileMenu() {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  
    /* ----------------------------------------------------------
       SCROLL REVEAL — fade sections in as they enter viewport
    ---------------------------------------------------------- */
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObserver.observe(el));
  
    /* ----------------------------------------------------------
       BACK TO TOP BUTTON
    ---------------------------------------------------------- */
    const backToTop = document.getElementById('backToTop');
    function toggleBackToTop() {
      backToTop.classList.toggle('show', window.scrollY > 600);
    }
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  
    /* ----------------------------------------------------------
       COMMISSION CARD SELECTION ("Choose" buttons)
       Selecting a type here updates shared state + all synced UI.
    ---------------------------------------------------------- */
    document.querySelectorAll('[data-choose]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.choose;
        setCommissionType(type);
        document.querySelector('#pricing').scrollIntoView({ behavior: 'smooth' });
      });
    });
  
    function setCommissionType(type) {
      state.type = type;
      state.typePrice = typePrices[type] || 0;
  
      // sync "Choose" buttons visual state
      document.querySelectorAll('.btn-choose').forEach(b => {
        b.classList.toggle('chosen', b.dataset.choose === type);
      });
  
      // sync calculator dropdown
      const calcType = document.getElementById('calcType');
      calcType.value = type;
  
      // sync order form dropdown
      const formType = document.getElementById('fType');
      formType.value = type;
  
      recalcAll();
    }
  
    /* ----------------------------------------------------------
       ART STYLE SELECTION
    ---------------------------------------------------------- */
    document.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        const style = card.dataset.style;
        state.style = style;
        document.querySelectorAll('.style-card').forEach(c => c.classList.toggle('selected', c === card));
        document.getElementById('fStyle').value = style;
        recalcAll();
      });
    });
  
    /* ----------------------------------------------------------
       PRICE CALCULATOR (pricing section)
    ---------------------------------------------------------- */
    const calcType = document.getElementById('calcType');
    calcType.addEventListener('change', () => {
      state.type = calcType.value;
      state.typePrice = typePrices[calcType.value] || 0;
      document.querySelectorAll('.btn-choose').forEach(b => b.classList.toggle('chosen', b.dataset.choose === calcType.value));
      document.getElementById('fType').value = calcType.value;
      recalcAll();
    });
  
    const addonChecks = document.querySelectorAll('.addon-check');
    addonChecks.forEach(chk => chk.addEventListener('change', recalcAll));
  
    function getSelectedAddons() {
      return Array.from(addonChecks)
        .filter(c => c.checked)
        .map(c => ({ name: c.dataset.name, price: parseInt(c.value, 10) }));
    }
  
    function recalcAll() {
      state.addons = getSelectedAddons();
      const addonsTotal = state.addons.reduce((sum, a) => sum + a.price, 0);
      const total = state.typePrice + addonsTotal;
  
      // pricing section summary
      document.getElementById('sumType').textContent = state.type ? typeLabels[state.type] : '—';
      document.getElementById('sumStyle').textContent = state.style ? styleLabels[state.style] : '—';
      document.getElementById('sumAddons').textContent = state.addons.length
        ? state.addons.map(a => a.name).join(', ')
        : 'None';
      document.getElementById('sumTotal').textContent = formatRp(total);
  
      // keep the order-form add-on checkboxes visually mirrored
      syncFormAddons();
      recalcForm();
    }
  
    function syncFormAddons() {
      const selectedValues = state.addons.map(a => a.price + a.name);
      document.querySelectorAll('.form-addon-check').forEach(chk => {
        const key = chk.value + chk.dataset.name;
        chk.checked = selectedValues.includes(key);
      });
    }
  
    /* ----------------------------------------------------------
       ORDER FORM — its own add-on checkboxes also drive the total
       (keeps calculator + form usable independently or together)
    ---------------------------------------------------------- */
    const formAddonChecks = document.querySelectorAll('.form-addon-check');
    formAddonChecks.forEach(chk => chk.addEventListener('change', () => {
      // mirror form addon changes back into the shared calculator checkboxes
      addonChecks.forEach(c => {
        if (c.value === chk.value && c.dataset.name === chk.dataset.name) {
          c.checked = chk.checked;
        }
      });
      recalcAll();
    }));
  
    document.getElementById('fType').addEventListener('change', (e) => {
      setCommissionType(e.target.value);
    });
    document.getElementById('fStyle').addEventListener('change', (e) => {
      state.style = e.target.value;
      document.querySelectorAll('.style-card').forEach(c => c.classList.toggle('selected', c.dataset.style === e.target.value));
      recalcAll();
    });
  
    function recalcForm() {
      document.getElementById('formSumType').textContent = state.type ? typeLabels[state.type] : '—';
      document.getElementById('formSumStyle').textContent = state.style ? styleLabels[state.style] : '—';
      document.getElementById('formSumAddons').textContent = state.addons.length
        ? state.addons.map(a => a.name).join(', ')
        : 'None';
      const addonsTotal = state.addons.reduce((sum, a) => sum + a.price, 0);
      document.getElementById('formSumTotal').textContent = formatRp(state.typePrice + addonsTotal);
    }
  
    document.getElementById('calcPriceBtn').addEventListener('click', () => {
      recalcAll();
      document.querySelector('.form-summary').style.animation = 'none';
      // small satisfying pulse to confirm the calculation ran
      requestAnimationFrame(() => {
        document.querySelector('.form-summary').style.transition = 'transform 0.2s ease';
        document.querySelector('.form-summary').style.transform = 'scale(1.02)';
        setTimeout(() => { document.querySelector('.form-summary').style.transform = 'scale(1)'; }, 200);
      });
    });
  
    /* ----------------------------------------------------------
       ORDER FORM VALIDATION + SUBMISSION (simulated)
    ---------------------------------------------------------- */
    const form = document.getElementById('commissionForm');
  
    const requiredFields = [
      { id: 'fName', message: 'Please enter your name.' },
      { id: 'fEmail', message: 'Please enter a valid email address.', email: true },
      { id: 'fType', message: 'Please choose a commission type.' },
      { id: 'fStyle', message: 'Please choose an art style.' },
      { id: 'fDesc', message: 'Please describe your character.' }
    ];
  
    function validateForm() {
      let valid = true;
      requiredFields.forEach(f => {
        const el = document.getElementById(f.id);
        const errEl = document.getElementById('err-' + f.id);
        const value = el.value.trim();
        let fieldValid = value.length > 0;
  
        if (fieldValid && f.email) {
          fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
  
        el.classList.toggle('invalid', !fieldValid);
        if (errEl) errEl.textContent = fieldValid ? '' : f.message;
        if (!fieldValid) valid = false;
      });
      return valid;
    }
  
    // clear error styling as the user fixes fields
    requiredFields.forEach(f => {
      document.getElementById(f.id).addEventListener('input', () => {
        const el = document.getElementById(f.id);
        el.classList.remove('invalid');
        const errEl = document.getElementById('err-' + f.id);
        if (errEl) errEl.textContent = '';
      });
    });
  
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm()) {
        // scroll to first invalid field
        const firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      recalcAll();
      showConfirmModal();
      form.reset();
      // reset visual selections after "submission"
      document.querySelectorAll('.btn-choose').forEach(b => b.classList.remove('chosen'));
      document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
      addonChecks.forEach(c => (c.checked = false));
      formAddonChecks.forEach(c => (c.checked = false));
    });
  
    /* ----------------------------------------------------------
       CONFIRMATION MODAL
    ---------------------------------------------------------- */
    const confirmOverlay = document.getElementById('confirmOverlay');
    function showConfirmModal() {
      const addonsTotal = state.addons.reduce((sum, a) => sum + a.price, 0);
      document.getElementById('confType').textContent = state.type ? typeLabels[state.type] : '—';
      document.getElementById('confStyle').textContent = state.style ? styleLabels[state.style] : '—';
      document.getElementById('confPrice').textContent = formatRp(state.typePrice + addonsTotal);
      openModal(confirmOverlay);
    }
    document.getElementById('confirmClose').addEventListener('click', () => closeModal(confirmOverlay));
    document.getElementById('confirmDone').addEventListener('click', () => closeModal(confirmOverlay));
  
    /* ----------------------------------------------------------
       GENERIC MODAL HELPERS (used by confirm + lightbox)
    ---------------------------------------------------------- */
    function openModal(overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
        if (chatWindow.classList.contains('open')) toggleChat(false);
      }
    });
  
    /* ----------------------------------------------------------
       GALLERY — data, render, filter, lightbox
    ---------------------------------------------------------- */
    const galleryData = [
      { emoji: '🌙', category: 'anime',       title: 'Moonlit Guardian',    desc: 'Anime-style character portrait with dynamic lighting.' },
      { emoji: '🌺', category: 'manhwa',      title: 'Cherry Blossom Duo',  desc: 'Manhwa-inspired duo illustration, soft color grading.' },
      { emoji: '🕊️', category: 'semirealism', title: 'Quiet Morning',       desc: 'Semi-realistic portrait study with painterly light.' },
      { emoji: '🧸', category: 'chibi',       title: 'Bouncy Buddy',        desc: 'Chibi commission — playful pose, bold outlines.' },
      { emoji: '⚔️', category: 'anime',       title: 'Blade & Bloom',       desc: 'Full body anime illustration with action pose.' },
      { emoji: '🎐', category: 'manhwa',      title: 'Wind Chime',          desc: 'Half body manhwa portrait, glowing highlights.' },
      { emoji: '🪞', category: 'semirealism', title: 'Reflections',         desc: 'Semi-realistic portrait, moody palette.' },
      { emoji: '🍡', category: 'chibi',       title: 'Sweet Tooth',         desc: 'Chibi icon set piece, dessert theme.' },
      { emoji: '🦋', category: 'anime',       title: 'Wingspan',            desc: 'Anime full body with fantasy costume design.' },
      { emoji: '🌊', category: 'manhwa',      title: 'Tidewalker',          desc: 'Manhwa aesthetic, dramatic water effects.' },
      { emoji: '🕯️', category: 'semirealism', title: 'Candlelight',         desc: 'Semi-realistic close-up portrait, warm tones.' },
      { emoji: '🎀', category: 'chibi',       title: 'Ribbon & Roses',      desc: 'Chibi commission, cottagecore theme.' }
    ];
  
    const galleryGrid = document.getElementById('galleryGrid');
    galleryData.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.dataset.category = item.category;
      div.innerHTML = `<span>${item.emoji}</span><span class="tag">${styleLabels[item.category] || 'Chibi'}</span>`;
      div.addEventListener('click', () => openLightbox(item));
      galleryGrid.appendChild(div);
    });
  
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.gallery-item').forEach(el => {
          const match = filter === 'all' || el.dataset.category === filter;
          el.classList.toggle('hidden', !match);
        });
      });
    });
  
    const lightboxOverlay = document.getElementById('lightboxOverlay');
    const lightboxArt = document.getElementById('lightboxArt');
    const lightboxCaption = document.getElementById('lightboxCaption');
    function openLightbox(item) {
      lightboxArt.innerHTML = `<span>${item.emoji}</span>`;
      lightboxCaption.textContent = `${item.title} — ${item.desc}`;
      openModal(lightboxOverlay);
    }
    document.getElementById('lightboxClose').addEventListener('click', () => closeModal(lightboxOverlay));
  
    /* ----------------------------------------------------------
       FAQ ACCORDION
    ---------------------------------------------------------- */
    document.querySelectorAll('.faq-item').forEach(item => {
      const question = item.querySelector('.faq-question');
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  
    /* ----------------------------------------------------------
       SOCIAL BUTTONS — placeholder links, visual feedback only
    ---------------------------------------------------------- */
    document.querySelectorAll('.social-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (btn.getAttribute('href') === '#') {
          e.preventDefault();
          btn.textContent = 'Link coming soon ✦';
          setTimeout(() => { btn.textContent = btn.dataset.social; }, 1600);
        }
      });
    });
  
    /* ----------------------------------------------------------
       CHAT WIDGET — simulated admin conversation
    ---------------------------------------------------------- */
    const chatFab = document.getElementById('chatFab');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatBody = document.getElementById('chatBody');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
  
    function toggleChat(forceState) {
      const open = forceState !== undefined ? forceState : !chatWindow.classList.contains('open');
      chatWindow.classList.toggle('open', open);
      if (open) chatInput.focus();
    }
    chatFab.addEventListener('click', () => toggleChat());
    chatClose.addEventListener('click', () => toggleChat(false));
  
    const chatResponses = {
      pricing: `Sure! Chibi starts at ${formatRp(35000)}, Half Body at ${formatRp(75000)}, and Full Body at ${formatRp(120000)}. You can build a full quote in the Pricing section above. 🎨`,
      status: `I don't have live order data in this demo, but in a real chat I'd look up your order by email and give you an update right here!`,
      revisions: `Every commission includes one sketch approval + one color revision. Need more? Add "Extra Revision" for ${formatRp(15000)} when ordering.`,
      other: `Feel free to type your question below and I'll do my best to help! (This is a simulated demo response.)`
    };
  
    function addChatMessage(text, sender) {
      const msg = document.createElement('div');
      msg.className = `chat-msg ${sender}`;
      msg.textContent = text;
      chatBody.appendChild(msg);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  
    document.getElementById('chatQuick').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-q]');
      if (!btn) return;
      addChatMessage(btn.textContent, 'user');
      setTimeout(() => addChatMessage(chatResponses[btn.dataset.q], 'admin'), 450);
    });
  
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      addChatMessage(text, 'user');
      chatInput.value = '';
      setTimeout(() => {
        addChatMessage("Thanks for your message! Dipsie will reply personally soon — in the meantime, feel free to browse the Gallery or Pricing sections. ✦", 'admin');
      }, 500);
    });
  
    /* ----------------------------------------------------------
       INIT
    ---------------------------------------------------------- */
    toggleBackToTop();
    recalcAll();
  });