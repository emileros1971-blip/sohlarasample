(() => {
  const arrival = document.getElementById('villa-arrival');
  const departure = document.getElementById('villa-departure');
  const adults = document.getElementById('villa-adults');
  const children = document.getElementById('villa-children');
  const status = document.getElementById('villa-date-status');
  const format = new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium', timeZone: 'UTC'});
  const displayDate = (input) => input.value ? format.format(input.valueAsNumber) : '—';

  arrival.min = new Intl.DateTimeFormat('en-CA', {timeZone: 'Atlantic/Canary'}).format(new Date());
  function updateSummary() {
    departure.min = arrival.value || arrival.min;
    const nights = (departure.valueAsNumber - arrival.valueAsNumber) / 86400000;
    status.textContent = arrival.value && departure.value && nights <= 0 ? 'Check-out must be after check-in.' : '';
    document.getElementById('villa-summary-arrival').textContent = displayDate(arrival);
    document.getElementById('villa-summary-departure').textContent = displayDate(departure);
    document.getElementById('villa-summary-guests').textContent = Math.max(1, adults.valueAsNumber || 1) + Math.max(0, children.valueAsNumber || 0);
    document.getElementById('villa-summary-stay').textContent = nights > 0 ? nights + (nights === 1 ? ' night' : ' nights') : '—';
  }
  [arrival, departure, adults, children].forEach(input => input.addEventListener('input', updateSummary));
  updateSummary();
})();
