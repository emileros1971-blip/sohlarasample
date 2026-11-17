/* GitHub Pages has no booking/payment backend. Keep personal data out of the handoff URL. */
(function () {
  'use strict';
  const form = document.querySelector('form:has([data-live-booking])');
  if (!form) return;
  const buttons = form.querySelectorAll('[data-live-booking]');
  buttons.forEach(button => button.addEventListener('click', () => {
    const room = form.querySelector('input[name="room"]:checked');
    const arrival = form.querySelector('[data-start-date]');
    if (!room) {
      const firstRoom = form.querySelector('input[name="room"]');
      firstRoom.reportValidity();
      firstRoom.focus();
      firstRoom.closest('label').scrollIntoView({block: 'center'});
      return;
    }
    if (!arrival.reportValidity()) { arrival.focus(); return; }
    const target = new URL('https://sohlararetreats.com/book-your-reset/');
    target.searchParams.set('room', room.value);
    target.searchParams.set('start', arrival.value);
    target.searchParams.set('days', form.querySelector('input[name="days"]:checked').value);
    target.searchParams.set('units', form.querySelector('[data-units-input]').value || '1');
    window.location.assign(target.href);
  }));
})();
