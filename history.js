/* ============================================================
   Cat Lab — History Timeline Scroll Animations
   ============================================================ */

(function initTimeline() {
  const items = document.querySelectorAll('.timeline-item');
  if (!items.length) return;

  // If IntersectionObserver is not supported, just show everything
  if (!('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Animate once
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    }
  );

  items.forEach((item, i) => {
    // Stagger the transition delay slightly for a cascade effect
    item.style.transitionDelay = `${i * 0.04}s`;
    observer.observe(item);
  });
})();
