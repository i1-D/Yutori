(function () {
  'use strict';

  const menuToggle = document.querySelector('.menu-toggle');
  const navOverlay = document.getElementById('navOverlay');
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero');
  const heroBgDark = document.querySelector('.hero-bg--dark');
  const heroBgBright = document.querySelector('.hero-bg--bright');
  const heroContent = document.querySelector('.hero-content');
  const heroTitle = document.querySelector('.hero-title');
  const heroTitle2 = document.querySelector('.hero-title-2');
  const ctaFloating = document.querySelector('.cta-floating');

  /* Lenis smooth scrolling – glide slowly to stop (duration + ease-out) */
  var lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.8,
      easing: function (t) { return 1 - Math.pow(1 - t, 4); },
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
      orientation: 'vertical',
      smoothWheel: true
    });
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);
    if (lenis.start) lenis.start();

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
          lenis.scrollTo(target, { offset: 0, duration: 2 });
        }
      });
    });
  }

  if (menuToggle && navOverlay) {
    menuToggle.addEventListener('click', function () {
      const isOpen = navOverlay.classList.toggle('is-open');
      document.body.classList.toggle('nav-open', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navOverlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navOverlay.classList.remove('is-open');
        document.body.classList.remove('nav-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      });
    });
  }

  /* Header: dark mode in hero pin zone (0–200vh) + spacious + everyone, light mode elsewhere */
  if (header && hero) {
    const headerHeight = 124;
    const heroPin = document.querySelector('.hero-pin');
    const sectionSpacious = document.querySelector('.section--spacious');
    const sectionEveryone = document.querySelector('.section--everyone');
    let ticking = false;

    function updateHeaderMode() {
      const scrollY = getScrollY();
      const heroPinHeight = heroPin ? heroPin.offsetHeight : 2 * window.innerHeight;
      const inHeroPin = scrollY < heroPinHeight;
      const y = headerHeight / 2;
      function sectionInView(section) {
        if (!section) return false;
        const r = section.getBoundingClientRect();
        return r.top <= y && r.bottom > y;
      }
      const isDark = inHeroPin || sectionInView(sectionSpacious) || sectionInView(sectionEveryone);
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

  function getScrollY() {
    return lenis && typeof lenis.scroll === 'number' ? lenis.scroll : window.scrollY;
  }

  /* Hero: Cascaid-style fixed section – scroll drives background + text transition (0–100vh), then page scrolls on */
  if (hero && heroBgDark && heroBgBright && heroContent && heroTitle && heroTitle2) {
    var heroScrollTicking = false;
    var scrollBudget = function () { return window.innerHeight; }; /* first 100vh of scroll drives animation */

    heroTitle2.style.opacity = '0';
    heroTitle2.style.transform = 'translate(-50%, calc(-50% + 100px))';
    heroBgDark.style.opacity = 1;
    heroBgBright.style.opacity = 0;
    heroBgDark.style.transform = 'translateY(0)';
    heroBgBright.style.transform = 'translateY(0)';
    heroContent.style.transform = 'translateY(0)';

    function updateHeroScroll(scrollY) {
      if (scrollY == null) scrollY = getScrollY();
      var budget = scrollBudget();
      var progress = Math.max(0, Math.min(1, scrollY / budget));

      /* Background crossfade: dark → bright */
      heroBgDark.style.opacity = 1 - progress;
      heroBgBright.style.opacity = progress;

      /* Title 1: fade out and stay; Title 2: fade in and slide up to center */
      var title1Opacity = 1 - (progress * 0.95);
      heroTitle.style.opacity = title1Opacity;
      heroTitle.style.transform = 'translateY(0)';
      
      /* Title 2: absolutely centered; starts 100px below center, slides up to center */
      var title2StartY = 100;
      var title2EndY = 0;
      var title2TranslateY = title2StartY + (title2EndY - title2StartY) * progress;
      heroTitle2.style.opacity = progress;
      heroTitle2.style.transform = 'translate(-50%, calc(-50% + ' + title2TranslateY + 'px))';

      heroScrollTicking = false;
    }

    function onScrollHero(ev) {
      if (!heroScrollTicking) {
        requestAnimationFrame(function () {
          var scrollY = typeof ev === 'number' ? ev : (ev && typeof ev.scroll === 'number' ? ev.scroll : getScrollY());
          updateHeroScroll(scrollY);
        });
        heroScrollTicking = true;
      }
    }

    if (lenis) {
      lenis.on('scroll', onScrollHero);
    } else {
      window.addEventListener('scroll', onScrollHero, { passive: true });
    }
    window.addEventListener('resize', function () {
      updateHeroScroll();
    });
    updateHeroScroll();
  }

  /* Butterfly: move from stone toward right as user scrolls through sections */
  var decoration = document.querySelector('.decoration');
  var decorationRope = document.querySelector('.decoration__rope');
  if (decoration) {
    var butterflyTicking = false;
    function updateButterflyPosition(scrollY) {
      if (scrollY == null) scrollY = getScrollY();
      var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var progress = maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0;
      decoration.style.setProperty('--butterfly-progress', String(progress));
      
      /* Set data attribute for CSS to detect when at top (progress = 0) */
      if (progress === 0) {
        decoration.setAttribute('data-butterfly-progress', '0');
      } else {
        decoration.removeAttribute('data-butterfly-progress');
      }
      
      /* Hide rope when scrolling down, show when near top (second last scroll) */
      if (decorationRope) {
        var scrollThreshold = 100; /* Show rope when within 100px of top */
        if (scrollY > scrollThreshold) {
          decorationRope.classList.add('decoration__rope--hidden');
        } else {
          decorationRope.classList.remove('decoration__rope--hidden');
        }
      }
      
      butterflyTicking = false;
    }
    function onScrollButterfly(ev) {
      if (!butterflyTicking) {
        requestAnimationFrame(function () {
          var scrollY = typeof ev === 'number' ? ev : (ev && typeof ev.scroll === 'number' ? ev.scroll : getScrollY());
          updateButterflyPosition(scrollY);
        });
        butterflyTicking = true;
      }
    }
    if (lenis) {
      lenis.on('scroll', onScrollButterfly);
    } else {
      window.addEventListener('scroll', onScrollButterfly, { passive: true });
    }
    window.addEventListener('resize', function () { updateButterflyPosition(); });
    updateButterflyPosition();
  }

  /* Footer in view: hide decoration (fade), header (slide up), CTA (slide out) */
  var footer = document.querySelector('.footer');
  if (footer && 'IntersectionObserver' in window) {
    var footerObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            document.body.classList.add('in-footer');
            if (ctaFloating) ctaFloating.classList.remove('cta-floating--visible');
          } else {
            document.body.classList.remove('in-footer');
            if (ctaFloating && getScrollY() > 120) {
              ctaFloating.classList.add('cta-floating--visible');
            }
          }
        });
      },
      { rootMargin: '0px 0px 0px 0px', threshold: 0.1 }
    );
    footerObserver.observe(footer);
  }

  /* Floating CTA: hidden on load, slide in on first scroll, slide out in footer; light mode over section everyone / spacious */
  if (ctaFloating) {
    var scrollThreshold = 120;
    var ticking = false;
    var sectionSpacious = document.querySelector('.section--spacious');
    var sectionEveryone = document.querySelector('.section--everyone');

    function updateCtaFloating() {
      var scrollY = getScrollY();
      var inFooter = document.body.classList.contains('in-footer');

      if (inFooter) {
        ctaFloating.classList.remove('cta-floating--visible');
      } else if (scrollY > scrollThreshold) {
        ctaFloating.classList.add('cta-floating--visible');
      } else {
        ctaFloating.classList.remove('cta-floating--visible');
      }

      /* Light mode only when viewport center is inside section everyone or spacious (dark bg); dark mode in aligned, blurred, hero, etc. */
      var inDarkBgSection = false;
      if (sectionSpacious || sectionEveryone) {
        var vh = window.innerHeight;
        var viewportCenterY = vh / 2;
        [sectionSpacious, sectionEveryone].forEach(function (section) {
          if (!section) return;
          var r = section.getBoundingClientRect();
          if (r.top <= viewportCenterY && r.bottom > viewportCenterY) inDarkBgSection = true;
        });
      }
      if (inDarkBgSection) {
        ctaFloating.classList.add('cta-floating--light');
      } else {
        ctaFloating.classList.remove('cta-floating--light');
      }

      ticking = false;
    }

    function onScrollCta() {
      if (!ticking) {
        requestAnimationFrame(updateCtaFloating);
        ticking = true;
      }
    }

    if (lenis) {
      lenis.on('scroll', onScrollCta);
    } else {
      window.addEventListener('scroll', onScrollCta, { passive: true });
    }
    updateCtaFloating();
  }

  /* Section & footer scroll-in: reveal only when scrolling down (once per section), no reverse animation on scroll up */
  var scrollRevealEls = document.querySelectorAll('.section, .footer');
  if (scrollRevealEls.length && 'IntersectionObserver' in window) {
    var scrollRevealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
          }
          /* Never remove is-in-view so sections stay revealed when scrolling back up */
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    scrollRevealEls.forEach(function (el) {
      scrollRevealObserver.observe(el);
    });
  }

  /* Space paragraph: reveal words one paragraph after another, only when scrolling down (never reverse) */
  var blurredCols = document.querySelectorAll('.blurred-cols');
  if (blurredCols.length && 'IntersectionObserver' in window) {
    var wordStaggerMs = 50;
    var gapBetweenParagraphsMs = 400;
    var pendingSecond = Object.create(null);

    function setParagraphInView(paragraph, inView) {
      var words = paragraph.querySelectorAll('.space-word');
      if (inView) {
        paragraph.classList.add('is-in-view');
        words.forEach(function (word, i) {
          word.style.transitionDelay = (i * wordStaggerMs) + 'ms';
        });
      }
      /* Never remove is-in-view so words stay revealed when scrolling back up */
    }

    function isContainerInView(container) {
      var rect = container.getBoundingClientRect();
      return rect.bottom > window.innerHeight * 0.05 && rect.top < window.innerHeight * 0.95;
    }

    var spaceContainerObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var container = entry.target;
          var paragraphs = container.querySelectorAll('.space-paragraph');
          if (!entry.isIntersecting) return;
          /* Only reveal when already revealed (skip re-trigger when scrolling back down) */
          if (paragraphs.length >= 1 && !paragraphs[0].classList.contains('is-in-view')) {
            setParagraphInView(paragraphs[0], true);
          }
          if (paragraphs.length >= 2 && !paragraphs[1].classList.contains('is-in-view')) {
            var firstWordCount = paragraphs[0].querySelectorAll('.space-word').length;
            var delay = firstWordCount * wordStaggerMs + gapBetweenParagraphsMs;
            if (pendingSecond[container]) {
              clearTimeout(pendingSecond[container]);
            }
            var id = setTimeout(function () {
              delete pendingSecond[container];
              if (isContainerInView(container)) {
                var paras = container.querySelectorAll('.space-paragraph');
                if (paras[1]) setParagraphInView(paras[1], true);
              }
            }, delay);
            pendingSecond[container] = id;
          }
        });
      },
      { rootMargin: '0px 0px -5% 0px', threshold: 0.1 }
    );
    blurredCols.forEach(function (col) {
      spaceContainerObserver.observe(col);
    });
  }
})();
