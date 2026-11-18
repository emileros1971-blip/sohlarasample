(() => {
  const arrival = document.getElementById('villa-arrival');
  const departure = document.getElementById('villa-departure');
  const adults = document.getElementById('villa-adults');
  const children = document.getElementById('villa-children');
  const status = document.getElementById('villa-date-status');
  const check = document.getElementById('checkBtn');
  const rate = Number(document.getElementById('villa-nightly-rate').dataset.eur);
  const estimate = document.getElementById('villa-summary-estimate');
  const currency = new Intl.NumberFormat('en-IE', {style: 'currency', currency: 'EUR'});
  const format = new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium', timeZone: 'UTC'});
  const displayDate = (input) => input.value ? format.format(input.valueAsNumber) : '—';

  arrival.min = new Intl.DateTimeFormat('en-CA', {timeZone: 'Atlantic/Canary'}).format(new Date());
  function updateSummary() {
    departure.min = arrival.value || arrival.min;
    const nights = (departure.valueAsNumber - arrival.valueAsNumber) / 86400000;
    const valid = nights > 0 && arrival.validity.valid && departure.validity.valid;
    check.disabled = !valid;
    estimate.textContent = valid ? currency.format(nights * rate) : '—';
    status.textContent = 'Choose dates to see the estimate.';
    if (arrival.value && departure.value && !valid) {
      status.textContent = nights <= 0 ? 'Check-out must be after check-in.' : 'Choose a check-in date on or after today.';
    }
    if (valid) status.textContent = 'Availability has not been checked.';
    document.getElementById('villa-summary-arrival').textContent = displayDate(arrival);
    document.getElementById('villa-summary-departure').textContent = displayDate(departure);
    document.getElementById('villa-summary-guests').textContent = Math.max(1, adults.valueAsNumber || 1) + Math.max(0, children.valueAsNumber || 0);
    document.getElementById('villa-summary-stay').textContent = nights > 0 ? nights + (nights === 1 ? ' night' : ' nights') : '—';
  }
  [arrival, departure, adults, children].forEach(input => input.addEventListener('input', updateSummary));
  check.addEventListener('click', () => {
    status.textContent = 'Live availability checks are unavailable in this preview.';
  });
  updateSummary();
})();
