document.querySelectorAll('[data-print-worksheet]').forEach(button => {
  button.addEventListener('click', () => window.print());
});
