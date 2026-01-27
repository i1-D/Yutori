(function () {
  'use strict';

  const menuToggle = document.querySelector('.menu-toggle');
  const navOverlay = document.getElementById('navOverlay');
  const header = document.querySelector('.header');
  const ctaFixed = document.getElementById('ctaFixed');
  const hero = document.querySelector('.hero');
  const sections = document.querySelectorAll('.section');

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

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateHeaderMode();
  }

  /* CTA fixed: slide in from right on first scroll down, slide out when scrolling up */
  if (ctaFixed) {
    var scrollThreshold = 80;
    var lastScrollY = window.scrollY;
    var ticking = false;

    function updateCtaVisibility() {
      var scrollY = window.scrollY;
      var direction = scrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = scrollY;

      if (direction === 'down' && scrollY > scrollThreshold) {
        document.body.classList.add('cta-visible');
      } else if (direction === 'up') {
        document.body.classList.remove('cta-visible');
      }
      ticking = false;
    }

    function onScrollCta() {
      if (!ticking) {
        requestAnimationFrame(updateCtaVisibility);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScrollCta, { passive: true });
  }

  /* Section scroll-in: fade + slide up when entering viewport */
  if (sections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* Space paragraph: reveal words one-by-one when div enters viewport */
  var spaceParagraph = document.querySelector('.space-paragraph');
  if (spaceParagraph && 'IntersectionObserver' in window) {
    var wordStaggerMs = 50;
    var spaceObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          spaceParagraph.classList.add('is-in-view');
          var words = spaceParagraph.querySelectorAll('.space-word');
          words.forEach(function (word, i) {
            word.style.transitionDelay = (i * wordStaggerMs) + 'ms';
          });
          spaceObserver.unobserve(spaceParagraph);
        });
      },
      { rootMargin: '0px 0px -5% 0px', threshold: 0.1 }
    );
    spaceObserver.observe(spaceParagraph);
  }
})();
