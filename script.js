document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================
     1. CAROUSEL ACCESSIBILITY & INTERACTION
     ========================================== */
  const cards = Array.from(document.querySelectorAll('.project-card'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const carouselStatus = document.getElementById('carouselStatus');

  const projectNames = [
    'פרויקט 1 מתוך 5: הטיסה הראשונה שלי (Storyline)',
    'פרויקט 2 מתוך 5: יום בשוק – מחולל משחקים',
    'פרויקט 3 מתוך 5: למידה זה שם המשחק (Genially)',
    'פרויקט 4 מתוך 5: CopyClick (Figma)',
    'פרויקט 5 מתוך 5: מתחברים (Figma)'
  ];

  // Default active project is index 1 (center card: "יום בשוק")
  let currentIndex = 1;
  let carouselMoving = false;
  let settleTimer;
  const previewUpdates = [];

  function updateCarousel(index, announce = true) {
    const total = cards.length;
    const nextIndex = (index + total) % total;
    if (nextIndex !== currentIndex) {
      carouselMoving = true;
      previewUpdates.forEach(update => update());
      clearTimeout(settleTimer);
      // Wait for the card movement to finish, including after rapid navigation.
      settleTimer = setTimeout(() => {
        carouselMoving = false;
        previewUpdates.forEach(update => update());
      }, 600);
    }
    currentIndex = nextIndex;
    const rightIndex = (currentIndex - 1 + total) % total;
    const leftIndex = (currentIndex + 1) % total;

    cards.forEach((card, i) => {
      const inner = card.querySelector('.card-inner');
      card.classList.remove(
        'active',
        'center-card',
        'side-card',
        'right-fade-card',
        'left-fade-card',
        'is-hidden',
        'is-highlighted',
        'pos-right',
        'pos-center',
        'pos-left',
        'pos-far-right',
        'pos-far-left'
      );
      if (inner) {
        inner.classList.remove('right-aligned', 'center-aligned', 'left-aligned');
      }

      if (i === currentIndex) {
        card.classList.add('center-card', 'active', 'pos-center');
        card.setAttribute('aria-pressed', 'true');
        card.setAttribute('tabindex', '0');
        card.removeAttribute('aria-hidden');
        if (inner) inner.classList.add('center-aligned');
      } else if (i === rightIndex) {
        card.classList.add('side-card', 'right-fade-card', 'pos-right');
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('tabindex', '0');
        card.removeAttribute('aria-hidden');
        if (inner) inner.classList.add('right-aligned');
      } else if (i === leftIndex) {
        card.classList.add('side-card', 'left-fade-card', 'pos-left');
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('tabindex', '0');
        card.removeAttribute('aria-hidden');
        if (inner) inner.classList.add('left-aligned');
      } else {
        // Compute circular distance so offscreen cards rest on the side they exited/enter from
        const diff = (i - currentIndex + total) % total;
        const farClass = diff <= Math.floor(total / 2) ? 'pos-far-left' : 'pos-far-right';
        card.classList.add('is-hidden', farClass);
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('tabindex', '-1');
        card.setAttribute('aria-hidden', 'true');
        if (inner) inner.classList.add('center-aligned');
      }
    });

    dots.forEach((dot, i) => {
      const isSelected = i === currentIndex;
      dot.classList.toggle('active', isSelected);
      dot.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    if (announce && carouselStatus) {
      carouselStatus.textContent = `נבחר ${projectNames[currentIndex]}`;
    }
  }

  // Initialize layout positions
  updateCarousel(1, false);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      updateCarousel(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      updateCarousel(currentIndex + 1);
    });
  }

  cards.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      // Allow native <a> links (card overlay link on center card or action buttons) to open naturally
      if (e.target.closest('a, button')) return;
      updateCarousel(index);
    });

    // Keyboard activation (Enter / Space) per WCAG 2.1.1
    card.addEventListener('keydown', (e) => {
      if (e.target.closest('a, button')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (index === currentIndex) {
          const cardLink = card.querySelector('.project-card-link');
          if (cardLink) cardLink.click();
        } else {
          updateCarousel(index);
        }
      }
    });

    // Hover video preview
    const previewVideo = card.querySelector('.banner-preview-video');
    if (previewVideo) {
      previewVideo.muted = true;

      const maxTime = parseFloat(previewVideo.dataset.maxTime);
      if (maxTime) {
        previewVideo.addEventListener('timeupdate', () => {
          if (previewVideo.currentTime >= maxTime) {
            previewVideo.currentTime = 0;
            previewVideo.play().catch(() => {});
          }
        });
      }

      let pointerInside = false;
      let focusInside = false;

      const updatePreview = () => {
        const shouldPlay = !carouselMoving && !card.classList.contains('is-hidden') &&
          (pointerInside || focusInside) &&
          !document.body.classList.contains('a11y-stop-animations');
        if (shouldPlay) {
          previewVideo.play().then(() => {
            if (!previewVideo.paused) card.classList.add('is-playing-video');
          }).catch(() => {});
        } else {
          card.classList.remove('is-playing-video');
          previewVideo.pause();
        }
      };

      previewUpdates.push(updatePreview);
      card.addEventListener('mouseenter', () => {
        pointerInside = true;
        updatePreview();
      });
      card.addEventListener('mouseleave', () => {
        pointerInside = false;
        updatePreview();
      });
      card.addEventListener('focusin', () => {
        focusInside = true;
        updatePreview();
      });
      card.addEventListener('focusout', (e) => {
        if (!card.contains(e.relatedTarget)) {
          focusInside = false;
          updatePreview();
        }
      });
    }
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      updateCarousel(index);
    });
  });

  // Native dialogs provide focus trapping, Escape dismissal and an inert background.
  const mediaDialogs = document.querySelectorAll('.media-dialog');
  let mediaOpener = null;
  document.querySelectorAll('[data-media-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      mediaOpener = button;
      document.getElementById(button.dataset.mediaDialog).showModal();
      document.body.classList.add('media-dialog-open');
    });
  });
  mediaDialogs.forEach((dialog) => {
    dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      const video = dialog.querySelector('video');
      if (video) video.pause();
      document.body.classList.remove('media-dialog-open');
      if (mediaOpener) mediaOpener.focus();
    });
  });
  let galleryIndex = 0;
  function moveGallery(step) {
    galleryIndex = (galleryIndex + step + 8) % 8;
    const image = document.getElementById('galleryImage');
    image.src = `assets/yom-bashuk/screenshot-${String(galleryIndex + 1).padStart(2, '0')}.jpg?v=20261116-1`;
    image.classList.toggle('gallery-image-cropped', galleryIndex < 4);
    image.alt = `צילום מסך ${galleryIndex + 1} מתוך 8 של המשחק יום בשוק`;
    document.getElementById('galleryStatus').textContent = `תמונה ${galleryIndex + 1} מתוך 8`;
  }
  document.getElementById('galleryPrevious').addEventListener('click', () => moveGallery(-1));
  document.getElementById('galleryNext').addEventListener('click', () => moveGallery(1));
  document.getElementById('galleryDialog').addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveGallery(event.key === 'ArrowLeft' ? 1 : -1);
    }
  });

  /* ==========================================
     2. ISRAELI STANDARD 5568 ACCESSIBILITY MENU
     ========================================== */
  const a11yToggle = document.getElementById('a11yToggle');
  const a11yPanel = document.getElementById('a11yPanel');
  const a11yClose = document.getElementById('a11yClose');
  const a11yButtons = Array.from(document.querySelectorAll('.a11y-btn'));
  const a11yStatementBtn = document.getElementById('a11yStatementBtn');
  const a11yStatementContent = document.getElementById('a11yStatementContent');

  let fontScale = 100;

  function togglePanel(forceOpen) {
    const isOpen = typeof forceOpen === 'boolean' ? forceOpen : a11yPanel.hasAttribute('hidden');
    if (isOpen) {
      a11yPanel.removeAttribute('hidden');
      a11yToggle.setAttribute('aria-expanded', 'true');
      a11yClose.focus();
    } else {
      a11yPanel.setAttribute('hidden', '');
      a11yToggle.setAttribute('aria-expanded', 'false');
      a11yToggle.focus();
    }
  }

  if (a11yToggle && a11yPanel) {
    a11yToggle.addEventListener('click', () => togglePanel());
  }

  if (a11yClose) {
    a11yClose.addEventListener('click', () => togglePanel(false));
  }

  if (a11yStatementBtn && a11yStatementContent) {
    a11yStatementBtn.addEventListener('click', () => {
      const isHidden = a11yStatementContent.hasAttribute('hidden');
      if (isHidden) {
        a11yStatementContent.removeAttribute('hidden');
        a11yStatementBtn.setAttribute('aria-expanded', 'true');
      } else {
        a11yStatementContent.setAttribute('hidden', '');
        a11yStatementBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Close accessibility menu on Escape key or outside click
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && a11yPanel && !a11yPanel.hasAttribute('hidden')) {
      togglePanel(false);
    }
  });

  document.addEventListener('click', (e) => {
    const widget = document.getElementById('a11yWidget');
    if (widget && !widget.contains(e.target) && a11yPanel && !a11yPanel.hasAttribute('hidden')) {
      a11yPanel.setAttribute('hidden', '');
      a11yToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle accessibility feature toggles
  a11yButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');

      switch (action) {
        case 'font-increase':
          if (fontScale < 130) {
            fontScale += 10;
            document.documentElement.style.fontSize = `${fontScale}%`;
          }
          btn.setAttribute('aria-pressed', fontScale > 100 ? 'true' : 'false');
          break;

        case 'font-decrease':
          if (fontScale > 90) {
            fontScale -= 10;
            document.documentElement.style.fontSize = `${fontScale}%`;
          }
          btn.setAttribute('aria-pressed', fontScale < 100 ? 'true' : 'false');
          break;

        case 'high-contrast': {
          const active = document.body.classList.toggle('a11y-high-contrast');
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          break;
        }

        case 'grayscale': {
          const active = document.documentElement.classList.toggle('a11y-grayscale');
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          break;
        }

        case 'highlight-links': {
          const active = document.body.classList.toggle('a11y-highlight-links');
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          break;
        }

        case 'readable-font': {
          const active = document.body.classList.toggle('a11y-readable-font');
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          break;
        }

        case 'stop-animations': {
          const active = document.body.classList.toggle('a11y-stop-animations');
          btn.setAttribute('aria-pressed', active ? 'true' : 'false');
          break;
        }

        case 'reset':
          fontScale = 100;
          document.documentElement.style.fontSize = '100%';
          document.documentElement.classList.remove('a11y-grayscale');
          document.body.classList.remove(
            'a11y-high-contrast',
            'a11y-highlight-links',
            'a11y-readable-font',
            'a11y-stop-animations'
          );
          a11yButtons.forEach((b) => {
            if (b.hasAttribute('aria-pressed')) {
              b.setAttribute('aria-pressed', 'false');
            }
          });
          break;
      }
    });
  });

  /* ==========================================
     3. APPLE-STYLE SCROLL REVEAL & PARALLAX
     ========================================== */
  const revealGroups = [
    { selector: '.hero-name', delay: 40 },
    { selector: '.hero-title', delay: 130 },
    { selector: '.hero-subtitle', delay: 230 },
    { selector: '.hero-cta-btn', delay: 320 },
    { selector: '.section-title', delay: 0 },
    { selector: '.section-subtitle', delay: 60 },
    { selector: '.tool-card', stagger: 95 },
    { selector: '.exp-item', stagger: 130 },
    { selector: '.exp-divider', delay: 100 },
    { selector: '.footer-title', delay: 0 },
    { selector: '.footer-email', delay: 60 }
  ];

  const revealTargets = [];

  revealGroups.forEach(({ selector, delay = 0, stagger = 0 }) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
      el.classList.add('apple-reveal');
      const totalDelay = delay + index * stagger;
      if (totalDelay > 0) {
        el.style.setProperty('--reveal-delay', `${totalDelay}ms`);
      }
      revealTargets.push(el);
    });
  });

  if ('IntersectionObserver' in window) {
    const footerEl = document.querySelector('.footer');
    const footerChildren = footerEl
      ? Array.from(footerEl.querySelectorAll('.apple-reveal'))
      : [];

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Reveal once: scrolling back must never hide cards or headings again.
          if (!entry.isIntersecting) return;
          if (entry.target === footerEl) {
            footerChildren.forEach((el) => el.classList.add('is-revealed'));
          } else {
            entry.target.classList.add('is-revealed');
          }
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -15px 0px'
      }
    );

    revealTargets.forEach((el) => {
      if (!footerChildren.includes(el)) {
        revealObserver.observe(el);
      }
    });

    if (footerEl) {
      revealObserver.observe(footerEl);
    }
  } else {
    revealTargets.forEach((el) => el.classList.add('is-revealed'));
  }

  // Subtle Apple-style scroll parallax on the Hero content
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    heroContent.classList.add('hero-parallax-layer');
    let ticking = false;

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const prefersReducedMotion =
              window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
              document.body.classList.contains('a11y-stop-animations');

            const scrollY = window.scrollY;
            if (!prefersReducedMotion && scrollY < 450) {
              const translateY = scrollY * 0.18;
              const opacity = Math.max(0.15, 1 - scrollY / 380);
              heroContent.style.transform = `translate3d(0, ${translateY}px, 0)`;
              heroContent.style.opacity = `${opacity}`;
            } else {
              heroContent.style.transform = '';
              heroContent.style.opacity = '';
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }
});
