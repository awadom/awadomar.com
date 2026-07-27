(() => {
  "use strict";

  const scrollIndicator = document.querySelector(".scroll-indicator");
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const updateScrollIndicator = () => {
    if (!scrollIndicator) return;

    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    scrollIndicator.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  };

  updateScrollIndicator();
  window.addEventListener("scroll", updateScrollIndicator, { passive: true });
  window.addEventListener("resize", updateScrollIndicator);
})();
