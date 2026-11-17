/* Display the existing inline payment layout in the static design preview.
 * PaymentIntent creation and confirmation remain exclusively on the live server. */
(function () {
  'use strict';
  const form = document.querySelector('form[data-form="booking"]');
  if (!form || !window.SohlaraPricing) return;
  const pricing = window.SohlaraPricing.create(JSON.parse(document.getElementById('booking-pricing').textContent));
  const button = form.querySelector('[data-pay-button]');
  const container = form.querySelector('[data-payment-element]');
  let elements;
  form.querySelectorAll('[data-pay-only]').forEach(el => { el.hidden = false; });
  const note = document.createElement('p');
  note.className = 'text-sm text-neutral-400 mb-4';
  note.textContent = 'Design preview: payment processing will be available here after deployment to the live server.';
  container.before(note);
  const render = () => {
    const data = new FormData(form);
    const quote = data.get('room') ? pricing.quote(data.get('room'), Number(data.get('days')), Number(data.get('units') || 1), data.get('startDate') || null) : null;
    const full = data.get('payment') === 'full';
    const due = quote ? pricing.amountDue(quote.total, full ? 'full' : 'deposit') : 0;
    const values = quote ? {deposit: pricing.amountDue(quote.total, 'deposit'), full: quote.total, due, balance: pricing.round2(quote.total - due)} : {};
    Object.entries({deposit: null, full: null, due: null, balance: null}).forEach(([key]) => {
      form.querySelectorAll(`[data-co="${key}"]`).forEach(el => { el.textContent = quote ? pricing.formatEUR(values[key], 2) : '—'; });
    });
    form.querySelectorAll('[data-co-balance-row]').forEach(el => { el.hidden = full; });
    button.textContent = quote ? `Pay ${pricing.formatEUR(due, 2)} now` : 'Choose a room to see payment total';
    button.disabled = true;
    button.title = 'Payment processing requires deployment to the live server';
    if (elements && due) elements.update({amount: pricing.toCents(due)});
  };
  form.addEventListener('change', render);
  form.addEventListener('input', event => { if (event.target.matches('[data-start-date]')) render(); });
  form.querySelectorAll('[data-units-step]').forEach(el => el.addEventListener('click', () => requestAnimationFrame(render)));
  form.addEventListener('reset', () => requestAnimationFrame(render));
  render();
  try {
    if (!window.Stripe) throw new Error('Stripe not available');
    const config = JSON.parse(document.getElementById('checkout-config').textContent);
    const stripe = window.Stripe(config.publishableKey);
    elements = stripe.elements({mode: 'payment', amount: 50, currency: 'eur', appearance: {theme: 'night'}});
    elements.create('payment', {layout: {type: 'tabs', defaultCollapsed: false}}).mount(container);
    render();
  } catch {
    container.textContent = 'Secure payment fields load here on the live site.';
  }
})();
