/* TOESHEE — shared site behaviour.
   Requires assets/motion.js (window.Motion UMD) loaded first.
   All entrance states are applied from JS so content stays visible
   without JS or under prefers-reduced-motion. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var M = window.Motion || {};
  var animate = M.animate;
  var inView = M.inView;
  var motionOK = !!(animate && inView) && !reduceMotion;

  if (motionOK) document.documentElement.classList.add('motion-ok');

  /* ── Nav scrolled state ── */
  var nav = document.querySelector('.nav');
  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Mobile menu ── */
  var burger = document.querySelector('.nav__burger');
  var mobileMenu = document.getElementById('mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-locked', open);
    });
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        mobileMenu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-locked');
      }
    });
  }

  /* ── Dropdown keyboard support (hover handled in CSS) ── */
  document.querySelectorAll('.dropdown > .nav__link').forEach(function (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', function () {
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.dropdown > .nav__link[aria-expanded="true"]')
        .forEach(function (t) { t.setAttribute('aria-expanded', 'false'); t.blur(); });
    }
  });

  /* ── Entrance choreography ── */
  if (motionOK) {
    var EASE = [0.16, 1, 0.3, 1];

    /* Hero sequence: signal line draws, then content rises in order. */
    document.querySelectorAll('[data-reveal-line]').forEach(function (scope) {
      var line = scope.querySelector('.signal');
      if (line) animate(line, { scaleX: [0, 1] }, { duration: 0.9, easing: EASE });
    });

    /* Content must never be gated on a scroll trigger: only elements
       fully below the fold are pre-hidden, and only from JS. */
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      var delay = parseFloat(el.getAttribute('data-reveal')) || 0;
      var hero = el.hasAttribute('data-hero');
      var run = function () {
        animate(el, { opacity: [0, 1], y: [26, 0] }, { duration: 0.7, delay: delay, easing: EASE });
      };
      if (hero) {
        el.style.opacity = '0';
        run();
        return;
      }
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.style.opacity = '0';
        inView(el, function () { run(); }, { margin: '0px 0px -10% 0px' });
      }
    });

    /* Count-up figures: <span data-count="96" data-suffix="%" data-decimals="0"> */
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      inView(el, function () {
        animate(function (p) {
          el.textContent = prefix + (target * p).toFixed(decimals) + suffix;
        }, { duration: 1.4, easing: EASE });
      }, { margin: '0px 0px -10% 0px' });
    });
  } else {
    /* Static fallback: render final values. */
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = el.getAttribute('data-count');
      el.textContent = (el.getAttribute('data-prefix') || '') + target + (el.getAttribute('data-suffix') || '');
    });
  }

  /* ── Contact form ── */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      var consent = form.querySelector('input[type="checkbox"][required]');
      if (consent && !consent.checked) {
        valid = false;
        consent.focus();
      }
      form.querySelectorAll('.field input[required], .field textarea[required]').forEach(function (input) {
        var field = input.closest('.field');
        var bad = !input.value.trim() ||
          (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
        field.classList.toggle('is-invalid', bad);
        if (bad) valid = false;
      });
      if (!valid) return;
      var success = form.querySelector('.form-success');
      var button = form.querySelector('button[type="submit"]');
      if (button) { button.disabled = true; button.textContent = 'Sending…'; }
      window.setTimeout(function () {
        if (success) success.classList.add('is-visible');
        if (button) { button.textContent = 'Message sent'; }
        form.querySelectorAll('input, textarea').forEach(function (i) {
          if (i.type !== 'checkbox') i.value = '';
          else i.checked = false;
        });
      }, 600);
    });
    form.querySelectorAll('.field input, .field textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        input.closest('.field').classList.remove('is-invalid');
      });
    });
  }
})();
