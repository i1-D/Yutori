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

  /* Header: dark mode in hero (transparent + white), light mode elsewhere (white bg + black) */
  if (header && hero) {
    const headerHeight = 124;
    let ticking = false;

    function updateHeaderMode() {
      const y = headerHeight / 2;
      const r = hero.getBoundingClientRect();
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

  function getScrollY() {
    return lenis && typeof lenis.scroll === 'number' ? lenis.scroll : window.scrollY;
  }

  /* Hero parallax: background and text move at different speeds on scroll */
  if (hero && heroBgDark && heroBgBright && heroContent) {
    var heroParallaxTicking = false;
    
    function updateHeroParallax(scrollY) {
      if (scrollY == null) scrollY = getScrollY();
      
      var heroRect = hero.getBoundingClientRect();
      var heroTop = hero.offsetTop;
      var heroHeight = hero.offsetHeight;
      var viewportHeight = window.innerHeight;
      
      // Calculate scroll progress through hero section (0 = top of hero, 1 = bottom)
      var scrollProgress = Math.max(0, Math.min(1, (scrollY - heroTop + viewportHeight) / (heroHeight + viewportHeight)));
      
      // Only apply parallax while hero is visible or just scrolled past
      if (heroRect.bottom > -viewportHeight && heroRect.top < viewportHeight * 2) {
        // Background moves slower (0.6x speed) - creates depth effect
        // As user scrolls down, background moves up slower, creating parallax
        var bgOffset = scrollProgress * viewportHeight * 0.6;
        heroBgDark.style.transform = `translateY(${-bgOffset}px)`;
        heroBgBright.style.transform = `translateY(${-bgOffset}px)`;
        
        // Text moves even slower (0.4x speed) - stays more in place relative to viewport
        var textOffset = scrollProgress * viewportHeight * 0.4;
        heroContent.style.transform = `translateY(${-textOffset}px)`;
      } else {
        // Reset when hero is far out of view
        if (heroRect.bottom < -viewportHeight) {
          heroBgDark.style.transform = `translateY(${-viewportHeight * 0.6}px)`;
          heroBgBright.style.transform = `translateY(${-viewportHeight * 0.6}px)`;
          heroContent.style.transform = `translateY(${-viewportHeight * 0.4}px)`;
        } else {
          heroBgDark.style.transform = 'translateY(0)';
          heroBgBright.style.transform = 'translateY(0)';
          heroContent.style.transform = 'translateY(0)';
        }
      }
      
      heroParallaxTicking = false;
    }
    
    function onScrollHeroParallax(ev) {
      if (!heroParallaxTicking) {
        requestAnimationFrame(function () {
          var scrollY = typeof ev === 'number' ? ev : (ev && typeof ev.scroll === 'number' ? ev.scroll : getScrollY());
          updateHeroParallax(scrollY);
        });
        heroParallaxTicking = true;
      }
    }
    
    if (lenis) {
      lenis.on('scroll', onScrollHeroParallax);
    } else {
      window.addEventListener('scroll', onScrollHeroParallax, { passive: true });
    }
    window.addEventListener('resize', function () {
      updateHeroParallax();
    });
    updateHeroParallax();
  }

  /* Hero title scroll animation: reveal title-2 on scroll, reverse on scroll up */
  /* Also changes background from hero-dark to hero-bright on scroll */
  /* First scroll phase: page does not scroll – only title and background change. From second scroll, page scrolls. */
  if (hero && heroTitle && heroTitle2 && heroBgDark && heroBgBright) {
    var heroTitleTicking = false;
    var heroPhaseComplete = false;
    var heroProgress = 0;
    var HERO_PROGRESS_SENSITIVITY = 0.0018;

    // Set initial state - title-2 hidden, background dark
    heroTitle2.style.opacity = '0';
    heroTitle2.style.transform = 'translateY(100px)';
    heroBgDark.style.opacity = 1;
    heroBgBright.style.opacity = 0;

    function updateHeroStateFromProgress(p) {
      p = Math.max(0, Math.min(1, p));
      var title1Opacity = 1 - (p * 0.95);
      heroTitle.style.opacity = title1Opacity;
      heroTitle.style.transform = 'translateY(0)';
      heroTitle2.style.opacity = p;
      heroTitle2.style.transform = 'translateY(' + ((1 - p) * 100) + 'px)';
      heroBgDark.style.opacity = 1 - p;
      heroBgBright.style.opacity = p;
    }

    function onHeroWheel(ev) {
      var scrollY = getScrollY();
      if (heroPhaseComplete || scrollY > 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      heroProgress += ev.deltaY * HERO_PROGRESS_SENSITIVITY;
      heroProgress = Math.max(0, Math.min(1, heroProgress));
      updateHeroStateFromProgress(heroProgress);
      if (heroProgress >= 1) {
        heroPhaseComplete = true;
        var vh = window.innerHeight;
        var heroTop = hero.offsetTop;
        var heroHeight = hero.offsetHeight;
        var endScrollY = 0.6 * (heroHeight + vh) - vh + heroTop;
        endScrollY = Math.max(0, endScrollY);
        if (lenis && lenis.scrollTo) {
          lenis.scrollTo(endScrollY, { duration: 0.5, immediate: false });
        } else {
          window.scrollTo(0, endScrollY);
        }
      }
    }

    document.addEventListener('wheel', onHeroWheel, { capture: true, passive: false });

    var heroTouchStartY = 0;
    function onHeroTouchStart(ev) {
      if (getScrollY() === 0 && !heroPhaseComplete) heroTouchStartY = ev.touches[0].clientY;
    }
    function onHeroTouchMove(ev) {
      if (heroPhaseComplete || getScrollY() > 0) return;
      ev.preventDefault();
      var dy = heroTouchStartY - ev.touches[0].clientY;
      heroTouchStartY = ev.touches[0].clientY;
      heroProgress += dy * (HERO_PROGRESS_SENSITIVITY * 2);
      heroProgress = Math.max(0, Math.min(1, heroProgress));
      updateHeroStateFromProgress(heroProgress);
      if (heroProgress >= 1) {
        heroPhaseComplete = true;
        var vh = window.innerHeight;
        var heroTop = hero.offsetTop;
        var heroHeight = hero.offsetHeight;
        var endScrollY = 0.6 * (heroHeight + vh) - vh + heroTop;
        endScrollY = Math.max(0, endScrollY);
        if (lenis && lenis.scrollTo) {
          lenis.scrollTo(endScrollY, { duration: 0.5, immediate: false });
        } else {
          window.scrollTo(0, endScrollY);
        }
      }
    }
    document.addEventListener('touchstart', onHeroTouchStart, { passive: true });
    document.addEventListener('touchmove', onHeroTouchMove, { passive: false });
    
    function updateHeroTitleAnimation(scrollY) {
      if (scrollY == null) scrollY = getScrollY();
      
      var heroRect = hero.getBoundingClientRect();
      var heroTop = hero.offsetTop;
      var heroHeight = hero.offsetHeight;
      var viewportHeight = window.innerHeight;
      
      // After first-scroll phase: when user scrolls back to top, show initial state
      if (heroPhaseComplete && scrollY <= 0) {
        heroTitle.style.opacity = 1;
        heroTitle.style.transform = 'translateY(0)';
        heroTitle2.style.opacity = 0;
        heroTitle2.style.transform = 'translateY(100px)';
        heroBgDark.style.opacity = 1;
        heroBgBright.style.opacity = 0;
        heroTitleTicking = false;
        return;
      }
      
      // Calculate scroll progress through hero section (0 = top of hero, 1 = bottom)
      var scrollProgress = Math.max(0, Math.min(1, (scrollY - heroTop + viewportHeight) / (heroHeight + viewportHeight)));
      // Narrow band 0.5–0.6 so scrolling back up (title 2 → title 1) completes in one scroll
      var scrollDownEnd = 0.6;
      var scrollUpEnd = 0.5;   // below this = title 1 when scrolling back up
      
      var isAtTop = scrollProgress < scrollUpEnd || scrollY <= heroTop;
      
      // Only animate while hero is visible
      if (heroRect.bottom > -viewportHeight && heroRect.top < viewportHeight * 2) {
        if (isAtTop) {
          // At top of hero or scrolled back up - fully reset to original state
          heroTitle.style.opacity = 1;
          heroTitle.style.transform = 'translateY(0)';
          heroTitle2.style.opacity = 0;
          heroTitle2.style.transform = 'translateY(60px)';
          // Reset background to dark (fully visible dark, fully hidden bright)
          heroBgDark.style.opacity = 1;
          heroBgBright.style.opacity = 0;
        } else {
          // Transition zone: scrollProgress 0.5–0.6 so one scroll up returns to title 1
          var animationProgress = scrollProgress <= scrollUpEnd ? 0 : Math.min(1, (scrollProgress - scrollUpEnd) / (scrollDownEnd - scrollUpEnd));
          
          // Title 1: reduce opacity to 0.05 on scroll down, back to 1.0 on scroll up
          var title1Opacity = 1 - (animationProgress * 0.95);
          heroTitle.style.opacity = title1Opacity;
          heroTitle.style.transform = 'translateY(0)';
          
          // Title 2: reveal on scroll down, hide on scroll up - fade in/out and slide up/down
          var title2Opacity = animationProgress;
          var title2TranslateY = (1 - animationProgress) * 100;
          heroTitle2.style.opacity = title2Opacity;
          heroTitle2.style.transform = `translateY(${title2TranslateY}px)`;
          
          // Smooth crossfade between dark and bright backgrounds based on scroll progress
          // Dark fades out (1 -> 0), Bright fades in (0 -> 1) as animationProgress increases
          heroBgDark.style.opacity = 1 - animationProgress;
          heroBgBright.style.opacity = animationProgress;
        }
      } else {
        // Reset when hero is far out of view
        if (heroRect.bottom < -viewportHeight) {
          // Scrolled past hero - title 1 at 0.05 opacity, title 2 fully visible, bright background
          heroTitle.style.opacity = 0.05;
          heroTitle.style.transform = 'translateY(0)';
          heroTitle2.style.opacity = 1;
          heroTitle2.style.transform = 'translateY(0)';
          heroBgDark.style.opacity = 0;
          heroBgBright.style.opacity = 1;
        } else {
          // Before hero or scrolled back to top - show title 1 at full opacity only, dark background
          heroTitle.style.opacity = 1;
          heroTitle.style.transform = 'translateY(0)';
          heroTitle2.style.opacity = 0;
          heroTitle2.style.transform = 'translateY(100px)';
          heroBgDark.style.opacity = 1;
          heroBgBright.style.opacity = 0;
        }
      }

      heroTitleTicking = false;
    }
    
    function onScrollHeroTitle(ev) {
      if (!heroTitleTicking) {
        requestAnimationFrame(function () {
          var scrollY = typeof ev === 'number' ? ev : (ev && typeof ev.scroll === 'number' ? ev.scroll : getScrollY());
          updateHeroTitleAnimation(scrollY);
        });
        heroTitleTicking = true;
      }
    }
    
    if (lenis) {
      lenis.on('scroll', onScrollHeroTitle);
    } else {
      window.addEventListener('scroll', onScrollHeroTitle, { passive: true });
    }
    // Don't call updateHeroTitleAnimation on load - keep title-2 hidden until scroll
  }

  /* Butterfly: move from stone toward right as user scrolls through sections */
  var decoration = document.querySelector('.decoration');
  if (decoration) {
    var butterflyTicking = false;
    function updateButterflyPosition(scrollY) {
      if (scrollY == null) scrollY = window.scrollY;
      var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var progress = maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0;
      decoration.style.setProperty('--butterfly-progress', String(progress));
      butterflyTicking = false;
    }
    function onScrollButterfly(ev) {
      if (!butterflyTicking) {
        requestAnimationFrame(function () {
          var scrollY = typeof ev === 'number' ? ev : (ev && typeof ev.scroll === 'number' ? ev.scroll : window.scrollY);
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

  /* Floating CTA: hidden on load, slide in on first scroll, slide out in footer */
  if (ctaFloating) {
    var scrollThreshold = 120;
    var ticking = false;

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
  }

  /* Section & footer scroll-in: smooth ease-out reveal, re-trigger every time section enters view */
  var scrollRevealEls = document.querySelectorAll('.section, .footer');
  if (scrollRevealEls.length && 'IntersectionObserver' in window) {
    var scrollRevealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view');
          } else {
            entry.target.classList.remove('is-in-view');
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
