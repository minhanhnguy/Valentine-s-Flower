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
    const duration = 0.6 + Math.random() * 0.4;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Randomize envelope shape
    const decayPower = 1.5 + Math.random() * 1.5;
    const amplitude = 0.6 + Math.random() * 0.4;

    // Generate noise with an envelope
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.pow(1 - t, decayPower) * Math.sin(t * Math.PI);
      data[i] = (Math.random() * 2 - 1) * envelope * amplitude;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass filter — randomized for tonal variety
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 400 + Math.random() * 500;
    filter.Q.value = 0.2 + Math.random() * 0.6;

    const gain = ctx.createGain();
    gain.gain.value = 0.5 + Math.random() * 0.3;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  // Background music (fades in after all leaves open, fades out before loop)
  let bgMusic = null;
  const maxVol = 0.3;
  const fadeDuration = 3; // seconds for fade-in and fade-out

  function fadeVolume(target, duration, callback) {
    const step = 0.01;
    const interval = (duration * 1000) / (Math.abs(target - bgMusic.volume) / step);
    const fade = setInterval(() => {
      if (target > bgMusic.volume) {
        bgMusic.volume = Math.min(bgMusic.volume + step, target);
        if (bgMusic.volume >= target) { clearInterval(fade); if (callback) callback(); }
      } else {
        bgMusic.volume = Math.max(bgMusic.volume - step, target);
        if (bgMusic.volume <= target) { clearInterval(fade); if (callback) callback(); }
      }
    }, interval);
  }

  function playBackgroundMusic() {
    bgMusic = new Audio("song.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0;
    bgMusic.currentTime = 6; // Skip silent intro
    bgMusic.play().catch(() => { });

    // Fade in on start
    fadeVolume(maxVol, fadeDuration);

    // Fade out near the end of the track, fade back in after loop restart
    bgMusic.addEventListener("timeupdate", () => {
      if (!bgMusic.duration || bgMusic.duration === Infinity) return;
      const timeLeft = bgMusic.duration - bgMusic.currentTime;

      if (timeLeft <= fadeDuration && bgMusic.volume > 0.01) {
        // Smoothly ramp down
        bgMusic.volume = Math.max(0, (timeLeft / fadeDuration) * maxVol);
      } else if (bgMusic.currentTime < fadeDuration && bgMusic.volume < maxVol) {
        // Smoothly ramp up after loop restart
        bgMusic.volume = Math.min(maxVol, (bgMusic.currentTime / fadeDuration) * maxVol);
      }
    });
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

  // ---- Password Screen ----
  const PASSWORD = "03/01/2024";
  const passwordScreen = document.getElementById("password-screen");
  const passwordInput = document.getElementById("password-input");
  const passwordBtn = document.getElementById("password-btn");
  const passwordError = document.getElementById("password-error");

  function checkPassword() {
    const value = passwordInput.value.trim();
    if (value === PASSWORD) {
      // Correct! Fade out password screen, show leaves, play music
      passwordScreen.classList.add("hidden");
      document.querySelector(".cover-leaves").classList.add("unlocked");
      playBackgroundMusic();
    } else {
      // Wrong password — shake and show error
      passwordError.textContent = "That's not quite right, try again 💕";
      passwordInput.classList.add("shake");
      setTimeout(() => passwordInput.classList.remove("shake"), 500);
    }
  }

  passwordBtn.addEventListener("click", checkPassword);
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkPassword();
  });

  // Auto-insert "/" as user types DD/MM/YYYY
  passwordInput.addEventListener("input", () => {
    let v = passwordInput.value.replace(/\//g, "");
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5);
    passwordInput.value = v;
  });

  // Auto-focus the input
  passwordInput.focus();

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

      // When the last leaf is clicked, start flower animations
      if (openedCount === leaves.length) {
        document.body.classList.remove("not-loaded");
        document.body.classList.add("fireflies-visible");
      }
    });
  });
};
