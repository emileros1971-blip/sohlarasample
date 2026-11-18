(() => {
  const panel = document.getElementById('instant-checkout');
  const form = panel.querySelector('[data-new-year-inline-form]');
  const packages = JSON.parse(document.getElementById('retreat-checkout-data').textContent).packages;
  const buttons = [...document.querySelectorAll('[data-inline-package]')];
  const choices = [...form.querySelectorAll('input[name="package"]')];
  const paymentFields = form.querySelector('[data-payment-element]');
  let elements;
  let stripeAmount;

  const show = (selector, value) => form.querySelector(selector).textContent = value;

  function render() {
    const room = choices.find(choice => choice.checked);
    const booking = packages[room.value];
    const payment = form.querySelector('input[name="payment"]:checked').value;
    const { due, balance, cents } = booking.options[payment];

    show('[data-summary="room"]', booking.label);
    show('[data-summary="guests"]', booking.guests);
    show('[data-summary="total"]', booking.total);
    show('[data-co="deposit"]', booking.options.deposit.due);
    show('[data-co="full"]', booking.options.full.due);
    show('[data-co="due"]', due);
    show('[data-co="balance"]', balance);
    show('[data-pay-button]', 'Pay ' + due + ' now');
    form.querySelector('[data-co-balance-row]').hidden = payment === 'full';
    form.querySelector('[data-second-guest]').hidden = booking.guests < 2;

    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.inlinePackage === room.value));
    }

    if (elements && stripeAmount !== cents) elements.update({ amount: cents });
    stripeAmount = cents;
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const choice = choices.find(input => input.value === button.dataset.inlinePackage);
      choice.checked = true;
      choice.dispatchEvent(new Event('change', { bubbles: true }));
      panel.focus({ preventScroll: true });
      panel.scrollIntoView({ block: 'start' });
    });
  }

  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();

  try {
    const config = JSON.parse(document.getElementById('checkout-config').textContent);
    elements = window.Stripe(config.publishableKey).elements({
      mode: 'payment', amount: stripeAmount, currency: 'eur', appearance: { theme: 'night' },
    });
    const payment = elements.create('payment', { layout: { type: 'tabs', defaultCollapsed: false } });
    payment.on('loaderror', () => {
      paymentFields.textContent = 'Secure Stripe fields appear here on the live site.';
    });
    payment.mount(paymentFields);
  } catch {
    paymentFields.textContent = 'Secure Stripe fields appear here on the live site.';
  }
})();
