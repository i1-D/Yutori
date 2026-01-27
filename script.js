(function () {
  'use strict';

  const menuToggle = document.querySelector('.menu-toggle');
  const navOverlay = document.getElementById('navOverlay');
  const header = document.querySelector('.header');
  const ctaFixed = document.getElementById('ctaFixed');
  const hero = document.querySelector('.hero');
  const sections = document.querySelectorAll('.section');

  /* Lenis smooth scrolling – applies to full page (hero, all sections, footer) */
  var lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    /* Recalculate scrollable height so footer and all sections are included */
    function refreshLenis() {
      if (lenis && lenis.resize) lenis.resize();
    }
    if (document.readyState === 'complete') {
      refreshLenis();
    } else {
      window.addEventListener('load', refreshLenis);
    }
    window.addEventListener('resize', refreshLenis);

    /* Smooth scroll to anchor targets (e.g. #consultation in footer) */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      var hash = anchor.getAttribute('href');
      if (hash === '#') return;
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(hash);
        if (target && lenis) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: 0, duration: 1.2 });
        }
      });
    });
  }

  if (menuToggle && navOverlay) {
    menuToggle.addEventListener('click', function () {
      const isOpen = navOverlay.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navOverlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navOverlay.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      });
    });
  }

  /* Header: dark mode in hero (transparent + white), light mode elsewhere (white bg + black) */
  const heroSection = document.querySelector('.hero');
  if (header && heroSection) {
    const headerHeight = 124;
    let ticking = false;

    function updateHeaderMode() {
      const y = headerHeight / 2;
      const r = heroSection.getBoundingClientRect();
      const isDark = r.top <= y && r.bottom > y;
      header.setAttribute('data-mode', isDark ? 'dark' : 'light');
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateHeaderMode);
        ticking = true;
      }
    }

    if (lenis) {
      lenis.on('scroll', onScroll);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('resize', onScroll);
    updateHeaderMode();
  }

  /* CTA fixed: slide in from right on first scroll down, slide out when scrolling up */
  if (ctaFixed) {
    var scrollThreshold = 80;
    var lastScrollY = lenis ? 0 : window.scrollY;
    var ticking = false;

    function updateCtaVisibility(scrollY) {
      if (scrollY == null) scrollY = window.scrollY;
      var direction = scrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = scrollY;

      if (direction === 'down' && scrollY > scrollThreshold) {
        document.body.classList.add('cta-visible');
      } else if (direction === 'up') {
        document.body.classList.remove('cta-visible');
      }
      ticking = false;
    }

    function onScrollCta(ev) {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateCtaVisibility(ev && typeof ev.scroll === 'number' ? ev.scroll : window.scrollY);
        });
        ticking = true;
      }
    }

    if (lenis) {
      lenis.on('scroll', onScrollCta);
    } else {
      window.addEventListener('scroll', onScrollCta, { passive: true });
    }
  }

  /* Section & footer scroll-in: smooth ease-out reveal (Kasia Siwosz–style) */
  var scrollRevealEls = document.querySelectorAll('.section, .footer');
  if (scrollRevealEls.length && 'IntersectionObserver' in window) {
    var scrollRevealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    scrollRevealEls.forEach(function (el) {
      scrollRevealObserver.observe(el);
    });
  }

  /* Space paragraph: reveal words on scroll in, fade back to 0.3 when scroll out */
  var spaceParagraphs = document.querySelectorAll('.space-paragraph');
  if (spaceParagraphs.length && 'IntersectionObserver' in window) {
    var wordStaggerMs = 50;
    var spaceObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var paragraph = entry.target;
          var words = paragraph.querySelectorAll('.space-word');
          if (entry.isIntersecting) {
            paragraph.classList.add('is-in-view');
            words.forEach(function (word, i) {
              word.style.transitionDelay = (i * wordStaggerMs) + 'ms';
            });
          } else {
            paragraph.classList.remove('is-in-view');
            words.forEach(function (word) {
              word.style.transitionDelay = '';
            });
          }
        });
      },
      { rootMargin: '0px 0px -5% 0px', threshold: 0.1 }
    );
    spaceParagraphs.forEach(function (paragraph) {
      spaceObserver.observe(paragraph);
    });
  }
})();
