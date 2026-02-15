onload = () => {
  // Force layout computation for all elements
  document.body.offsetHeight;

  // ---- Audio Setup ----
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  // Synthesized whoosh/rustle sound for leaf push
  function playLeafSound() {
    const ctx = getAudioContext();
    const duration = 0.45;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate noise with an envelope
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Envelope: quick attack, slow decay
      const envelope = Math.pow(1 - t, 2.5) * Math.sin(t * Math.PI);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.4;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass filter for a softer, rustling quality
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.value = 0.35;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  // Background music (fades in after all leaves open)
  let bgMusic = null;

  function playBackgroundMusic() {
    bgMusic = new Audio(
      "https://cdn.pixabay.com/audio/2024/11/29/audio_7e4a40ca0c.mp3"
    );
    bgMusic.loop = true;
    bgMusic.volume = 0;
    bgMusic.play().catch(() => { });

    // Fade in over 3 seconds
    let vol = 0;
    const fadeIn = setInterval(() => {
      vol += 0.01;
      if (vol >= 0.3) {
        vol = 0.3;
        clearInterval(fadeIn);
      }
      bgMusic.volume = vol;
    }, 50);
  }

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

      // Play leaf rustle sound
      playLeafSound();

      // When the last leaf is clicked, start animations + music
      if (openedCount === leaves.length) {
        document.body.classList.remove("not-loaded");
        document.body.classList.add("fireflies-visible");
        playBackgroundMusic();
      }
    });
  });
};
