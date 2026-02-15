onload = () => {
  // Force layout computation for all elements
  document.body.offsetHeight;

  // Double rAF ensures layout + paint are done
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Extra delay for GPU compositing layers to be ready
      setTimeout(() => {
        // Fade out loader (animations stay paused behind cover leaves)
        const loader = document.querySelector(".loader");
        loader.classList.add("loader--hidden");
        loader.addEventListener("transitionend", () => {
          loader.remove();
        });
      }, 800);
    });
  });

  // Cover leaves: click to slide aside
  const leaves = document.querySelectorAll(".cover-leaf");
  let openedCount = 0;

  leaves.forEach((leaf) => {
    leaf.addEventListener("click", () => {
      if (leaf.classList.contains("open")) return;
      leaf.classList.add("open");
      openedCount++;

      // When the last leaf is clicked, start animations immediately
      if (openedCount === leaves.length) {
        document.body.classList.remove("not-loaded");
        document.body.classList.add("fireflies-visible");
      }
    });
  });
};
