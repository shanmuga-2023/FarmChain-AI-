import { router } from '../utils/router.js';

export function renderLanding(container) {
  // If intro has already been shown in this session, skip straight to auth
  if (sessionStorage.getItem('farmchainIntroShown') === 'true') {
    router.navigate('/login');
    return;
  }

  // Render cinematic intro
  container.innerHTML = `
    <style>
      .cinematic-intro {
        position: fixed;
        inset: 0;
        background: #000000;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      #intro-logo-container {
        opacity: 0;
        transform: scale(0.92);
        transition: opacity 0.5s ease, transform 0.5s ease;
        display: flex;
        justify-content: center;
        align-items: center;
        filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.15));
      }
      #intro-logo-container img {
        width: 220px;
        height: auto;
      }
      #intro-video-container {
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: none;
      }
      #intro-video {
        width: 100vw;
        height: 100vh;
        object-fit: cover;
      }
    </style>
    <div class="cinematic-intro" id="cinematic-container">
      <div id="intro-video-container">
        <video id="intro-video" muted playsinline preload="auto">
          <source src="/tomato_supply_chain.mp4" type="video/mp4" />
        </video>
      </div>
      <div id="intro-logo-container">
        <img src="/logo.png" alt="FarmChain Logo" />
      </div>
    </div>
  `;

  const logo = container.querySelector('#intro-logo-container');
  const vidContainer = container.querySelector('#intro-video-container');
  const vid = container.querySelector('#intro-video');
  const cinematicContainer = container.querySelector('#cinematic-container');

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const setOpacity = (op) => { logo.style.opacity = op; };

  const startSequence = async () => {
    // 1. Initial elegant entrance
    await wait(100);
    logo.style.opacity = '1';
    logo.style.transform = 'scale(1)';
    
    // Initial visible time
    await wait(700); 

    // Adjust transition speed for crisp blinking
    logo.style.transition = 'opacity 0.2s ease-in-out';

    // 2. Blink 1
    setOpacity('0');
    await wait(300);
    setOpacity('1');
    await wait(400);

    // 3. Blink 2
    setOpacity('0');
    await wait(300);
    setOpacity('1');
    await wait(400);

    // 4. Fade logo out smoothly before video
    logo.style.transition = 'opacity 0.4s ease';
    setOpacity('0');
    await wait(400); // Wait for logo to fully disappear

    // 5. Fade video in and play
    vidContainer.style.opacity = '1';
    try {
      await vid.play();
    } catch (err) {
      console.warn("Autoplay prevented or video missing, skipping intro.");
      finishIntro();
    }
  };

  const finishIntro = () => {
    cinematicContainer.style.transition = 'opacity 0.5s ease';
    cinematicContainer.style.opacity = '0';
    setTimeout(() => {
      sessionStorage.setItem('farmchainIntroShown', 'true');
      router.navigate('/login');
    }, 500);
  };

  // Listeners for video completion or error
  vid.addEventListener('ended', finishIntro);
  vid.addEventListener('error', finishIntro);

  // Kick off sequence
  startSequence();
}
