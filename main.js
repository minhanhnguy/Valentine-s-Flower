onload = () => {
  // Force layout computation for all elements
  document.body.offsetHeight;

  // Double rAF ensures layout + paint are done
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Extra delay for GPU compositing layers to be ready
      setTimeout(() => {
        // Remove paused state — animations start
        document.body.classList.remove("not-loaded");

        // Fade out loader
        const loader = document.querySelector(".loader");
        loader.classList.add("loader--hidden");
        loader.addEventListener("transitionend", () => {
          loader.remove();
        });
      }, 800);
    });
  });
};
