/* Behaviour of templates/site/pages (ported from the Astro <script> blocks). */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------------------------
   * components/team/TeamCard.astro: "Read more" toggles the clamped bio; the button hides
   * itself when nothing is cut off.
   * ---------------------------------------------------------------------------------------- */
  document.querySelectorAll('[data-team-card]').forEach((card) => {
    if (card.dataset.ready) return;
    card.dataset.ready = 'true';
    const lead = card.querySelector('[data-team-lead]');
    const rest = card.querySelector('[data-team-rest]');
    const wrap = card.querySelector('[data-team-toggle-wrap]');
    const button = card.querySelector('[data-team-toggle]');
    if (!lead || !wrap || !button) return;

    // The button shows when there is more to read: further paragraphs, or a first one cut by the clamp.
    const sync = () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      wrap.hidden = !expanded && !rest && lead.scrollHeight <= lead.clientHeight + 1;
    };

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(expanded));
      lead.classList.toggle('line-clamp-3', !expanded);
      if (rest) rest.hidden = !expanded;
      button.textContent = expanded ? 'Show less' : 'Read more';
      sync();
    });

    sync();
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(lead);
  });

  /* ------------------------------------------------------------------------------------------
   * pages/faq.astro: accordion, topic chips, search box, open the question in the URL hash.
   * ---------------------------------------------------------------------------------------- */
  (function initFaq() {
    const items = [...document.querySelectorAll('[data-faq-item]')];
    if (!items.length) return;

    const OPEN = ['border-gold-300', 'bg-[#1f3f3b]', 'shadow-[0_14px_30px_-18px_rgba(8,37,34,0.5)]'];
    const CLOSED = ['border-white/10', 'bg-[#1a3b36]', 'hover:border-white/30'];
    const ACTIVE_CHIP = ['border-gold-300', 'bg-gold-300', 'text-black', 'shadow-[0_0_20px_rgba(233,183,79,0.2)]'];
    const IDLE_CHIP = ['border-white/20', 'text-white/70', 'hover:border-gold-300', 'hover:text-gold-300'];

    const chips = [...document.querySelectorAll('[data-faq-filter]')];
    const search = document.querySelector('[data-faq-search]');
    const empty = document.querySelector('[data-faq-empty]');
    let category = 'All';

    function setOpen(item, open) {
      const button = item.querySelector('[data-faq-toggle]');
      const panel = button && document.getElementById(button.getAttribute('aria-controls') ?? '');
      const chevron = item.querySelector('[data-faq-chevron]');
      if (!button || !panel) return;
      button.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      item.classList.remove(...(open ? CLOSED : OPEN));
      item.classList.add(...(open ? OPEN : CLOSED));
      chevron?.classList.toggle('rotate-180', open);
      chevron?.classList.toggle('text-gold-300', open);
      chevron?.classList.toggle('text-white/50', !open); // the grey base class sits later in site.css and would win
    }

    function applyFilters() {
      const terms = (search?.value ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
      let visible = 0;
      for (const item of items) {
        const text = item.dataset.search ?? '';
        const match = (category === 'All' || item.dataset.category === category) && terms.every((t) => text.includes(t));
        item.hidden = !match;
        if (match) visible += 1;
      }
      if (empty) empty.hidden = visible > 0;
    }

    items.forEach((item) => {
      item.querySelector('[data-faq-toggle]')?.addEventListener('click', () => {
        const open = item.querySelector('[data-faq-toggle]')?.getAttribute('aria-expanded') !== 'true';
        setOpen(item, open);
      });
    });

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        category = chip.dataset.faqFilter ?? 'All';
        chips.forEach((c) => {
          const active = c === chip;
          c.setAttribute('aria-pressed', String(active));
          c.classList.remove(...(active ? IDLE_CHIP : ACTIVE_CHIP));
          c.classList.add(...(active ? ACTIVE_CHIP : IDLE_CHIP));
        });
        applyFilters();
      });
    });

    search?.addEventListener('input', applyFilters);

    // Open the question linked from elsewhere, e.g. /faq/#airport (also when the hash changes on this page).
    function openFromHash(scroll) {
      const linked = location.hash && items.find((item) => `#${item.id}` === location.hash);
      if (!linked) return;
      if (linked.hidden) {
        if (search) search.value = '';
        chips.find((c) => c.dataset.faqFilter === 'All')?.click();
      }
      setOpen(linked, true);
      if (scroll) linked.scrollIntoView({ block: 'start' });
    }

    openFromHash(false);
    window.addEventListener('hashchange', () => openFromHash(true));
  })();

  /* ------------------------------------------------------------------------------------------
   * pages/contact.astro: preselect the topic from the URL, e.g. /contact/?topic=Booking
   * ---------------------------------------------------------------------------------------- */
  (function initContactTopic() {
    const inputs = document.querySelectorAll('form[data-form="contact"] input[name="topic"]');
    if (!inputs.length) return;
    const topic = new URLSearchParams(window.location.search).get('topic')?.toLowerCase();
    if (!topic) return;
    inputs.forEach((input) => {
      if (input.value.toLowerCase() === topic) input.checked = true;
    });
  })();

  /* ------------------------------------------------------------------------------------------
   * pages/book.astro: price summary of the booking form.
   * The rooms and stay lengths come from the page (#booking-pricing, built from
   * site_content/pricing.py); the maths is in pricing.js (same results as pricing.py).
   * Payment (deposit / full, Stripe) is checkout.js; this keeps the summary in step.
   * ---------------------------------------------------------------------------------------- */
  (function initBooking() {
    const form = document.querySelector('form[data-form="booking"]');
    const dataEl = document.getElementById('booking-pricing');
    if (!form || !dataEl) return;
    let pricing;
    try {
      pricing = JSON.parse(dataEl.textContent);
    } catch {
      return;
    }

    if (!window.SohlaraPricing) return;
    const { getRoom, quote, formatEUR } = window.SohlaraPricing.create(pricing);
    const DEFAULT_DAYS = pricing.defaultDays;

    const roomInputs = [...form.querySelectorAll('input[name="room"]')];
    const dayInputs = [...form.querySelectorAll('input[name="days"]')];
    const unitsInput = form.querySelector('[data-units-input]');
    const unitsWrap = form.querySelector('[data-units-wrap]');
    const unitsValue = form.querySelector('[data-units-value]');
    const stepButtons = [...form.querySelectorAll('[data-units-step]')];
    const startDate = form.querySelector('[data-start-date]');
    const dob = form.querySelector('[data-dob]');
    const summary = (key) => form.querySelector(`[data-summary="${key}"]`);
    if (!unitsInput || !unitsWrap || !unitsValue || !startDate || !dob) return;

    const isoDate = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const selected = (inputs) => inputs.find((input) => input.checked)?.value;
    const select = (inputs, value) => {
      const match = value ? inputs.find((input) => input.value === value) : undefined;
      if (match) match.checked = true;
      return Boolean(match);
    };

    let units = 1;

    const render = () => {
      if (!selected(dayInputs)) select(dayInputs, DEFAULT_DAYS);
      const days = Number(selected(dayInputs));
      for (const input of roomInputs) {
        const card = input.closest('label');
        const price = card?.querySelector('[data-room-price]');
        if (!price) continue;
        const rate = quote(input.value, days, 1, startDate.value || null);
        if (!rate) continue;
        price.textContent = formatEUR(rate.total, 2);
        card.querySelector('[data-room-days]').textContent = String(rate.days);
        card.querySelector('[data-room-original]').hidden = rate.savings <= 0;
        card.querySelector('[data-room-subtotal]').textContent = formatEUR(rate.subtotal, 2);
        const perPerson = card.querySelector('[data-room-per-person]');
        if (perPerson) perPerson.textContent = formatEUR(rate.perPerson, 2);
      }
      const room = getRoom(selected(roomInputs));
      const empty = form.querySelector('[data-summary-empty]');
      const details = form.querySelector('[data-summary-details]');
      if (empty) empty.hidden = Boolean(room);
      if (details) details.hidden = false;
      if (!room) {
        unitsWrap.hidden = true;
        ['room', 'experience', 'days', 'units', 'arrival', 'subtotal', 'discount', 'total'].forEach(key => {
          summary(key).textContent = '—';
        });
        summary('units-label').textContent = 'Guests';
        summary('discount-label').textContent = 'Discount';
        summary('discount-row').hidden = false;
        summary('surcharge-row').hidden = true;
        summary('per-person').textContent = '';
        summary('price-before-discount').hidden = true;
        form.querySelector('[data-summary-date-note]').hidden = true;
        form.querySelector('[data-summary-total-label]').textContent = 'Total for your stay';
        return;
      }
      const dateNote = form.querySelector('[data-summary-date-note]');
      const totalLabel = form.querySelector('[data-summary-total-label]');
      if (dateNote) dateNote.hidden = Boolean(startDate.value);
      if (totalLabel) totalLabel.textContent = startDate.value ? 'Total for your stay' : 'Estimated total';

      // A dormitory can't take more guests than it has beds.
      const maxBeds = room.capacity;
      units = Math.min(Math.max(units, 1), maxBeds);
      unitsWrap.hidden = !room.perPerson;
      unitsInput.value = String(units);
      unitsValue.value = String(units);
      stepButtons.forEach((button) => {
        const step = Number(button.dataset.unitsStep);
        button.disabled = (step < 0 && units <= 1) || (step > 0 && units >= maxBeds);
      });

      // The arrival date sets the festive surcharge (website-copy-v3 C10); no date yet = normal prices.
      const q = quote(room.id, days, units, startDate.value || null);
      if (!q) return;
      summary('room').textContent = room.name;
      summary('experience').textContent = pricing.experiences[room.experience];
      summary('days').textContent = `${q.days} days`;
      summary('units-label').textContent = room.perPerson ? 'Beds' : 'Guests';
      summary('units').textContent = room.perPerson
        ? `${q.units} bed${q.units > 1 ? 's' : ''}`
        : `${q.guests} guest${q.guests > 1 ? 's' : ''}`;
      const [y, m, d] = startDate.value.split('-').map(Number);
      summary('arrival').textContent = startDate.value ? dateLabel.format(new Date(y, m - 1, d)) : 'Choose a date';
      summary('subtotal').textContent = formatEUR(q.base, 2);
      summary('surcharge-row').hidden = !q.surcharge;
      summary('surcharge-label').textContent = q.surchargeText;
      summary('surcharge').textContent = `+${formatEUR(q.surchargeAmount, 2)}`;
      summary('discount-row').hidden = q.savings <= 0;
      summary('discount-label').textContent = `Discount (−${Math.round(q.discount * 100)}%)`;
      summary('discount').textContent = `−${formatEUR(q.savings, 2)}`;
      const reference = summary('price-before-discount');
      if (reference) {
        const label = formatEUR(q.subtotal, 2);
        reference.textContent = label;
        reference.setAttribute('aria-label', `Price before discounts: ${label}`);
        reference.hidden = q.savings <= 0;
      }
      summary('total').textContent = formatEUR(q.total, 2);
      summary('per-person').textContent = `${formatEUR(q.perPerson, 2)} per person`;
    };

    // Preselect from the URL: /book-your-reset/?room=stone-double&days=10 (&start=2026-12-24 from "Try again")
    const params = new URLSearchParams(window.location.search);
    select(roomInputs, params.get('room'));
    select(dayInputs, params.get('days'));
    const bedsParam = Number(params.get('units'));
    if (Number.isInteger(bedsParam) && bedsParam > 0) units = bedsParam;

    const today = isoDate(new Date());
    startDate.min = today;
    dob.max = today;
    const startParam = params.get('start') || '';
    if (!startDate.value && /^\d{4}-\d{2}-\d{2}$/.test(startParam) && startParam >= today) startDate.value = startParam;

    stepButtons.forEach((button) =>
      button.addEventListener('click', () => {
        units += Number(button.dataset.unitsStep);
        render();
        // Keep keyboard focus in the stepper when this button hits its limit and gets disabled.
        if (button.disabled) stepButtons.find((other) => !other.disabled)?.focus();
      }),
    );
    form.addEventListener('change', render);
    form.addEventListener('input', (event) => {
      if (event.target === startDate) render();
    });
    form.addEventListener('reset', () => {
      units = 1;
      requestAnimationFrame(render);
    });
    window.addEventListener('pageshow', render);

    // Bring the first invalid field into view (below the fixed header) when validation fails.
    let scrolled = false;
    form.addEventListener(
      'invalid',
      (event) => {
        if (scrolled) return;
        scrolled = true;
        requestAnimationFrame(() => (scrolled = false));
        const field = event.target;
        (field.closest('label') ?? field).scrollIntoView({ block: 'center', behavior: 'instant' });
      },
      true,
    );

    render();
  })();

  /* ------------------------------------------------------------------------------------------
   * components/resources/GuidesIndex.astro: search box over the guide cards.
   * ---------------------------------------------------------------------------------------- */
  (function initGuideSearch() {
    const input = document.querySelector('[data-guide-search]');
    if (!input) return;
    const cards = document.querySelectorAll('[data-guide-card]');
    const empty = document.querySelector('[data-guide-empty]');

    input.addEventListener('input', () => {
      const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      let visible = 0;
      cards.forEach((card) => {
        const text = card.dataset.search ?? '';
        const match = terms.every((term) => text.includes(term));
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (empty) empty.hidden = visible > 0;
    });
  })();
})();
