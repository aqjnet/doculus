(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;

  /* Entrance animations are opt-in: without this class everything stays visible. */
  if (!reduceMotion) root.classList.add("anim");

  /* ---- Year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = "© " + new Date().getFullYear();

  /* ---- Nav scroll state + progress bar ---- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("scrolled", y > 24);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    }
    updateStepsLine();
    updateActiveNav();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Active nav link ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var navSections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  function updateActiveNav() {
    var pos = window.scrollY + window.innerHeight * 0.35;
    var current = null;
    navSections.forEach(function (sec) { if (sec.offsetTop <= pos) current = sec; });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", !!current && a.getAttribute("href") === "#" + current.id);
    });
  }

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    toggle.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
  }
  toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });

  /* ---- Reveal on scroll (staggered) ---- */
  var reveals = document.querySelectorAll(".reveal, .hero-title .word");
  if (root.classList.contains("anim") && "IntersectionObserver" in window) {
    var groupIndex = new WeakMap();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var parent = e.target.parentElement;
        var idx = groupIndex.get(parent) || 0;
        groupIndex.set(parent, idx + 1);
        e.target.style.setProperty("--d", Math.min(idx * 0.08, 0.4) + "s");
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
    /* Failsafe: whatever hasn't animated within 3s becomes visible anyway. */
    setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add("in"); });
    }, 3000);
  }

  /* ---- Animated counters ---- */
  var stats = document.querySelectorAll(".stat-num[data-count]");
  function animateCount(el) {
    var target = parseFloat(el.dataset.count) || 0;
    var suffix = el.dataset.suffix || "";
    var start = null, dur = 1300;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); statIO.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { statIO.observe(el); });
  }

  /* ---- Steps progress line (scroll-linked) ---- */
  var steps = document.getElementById("steps");
  function updateStepsLine() {
    if (!steps || reduceMotion) return;
    var r = steps.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh * 0.85 - r.top) / (r.height + vh * 0.3);
    p = Math.max(0, Math.min(1, p));
    steps.style.setProperty("--steps-p", p.toFixed(3));
  }

  /* ---- CAD crosshair with coordinate readout ---- */
  var crossV = document.querySelector(".cross-v");
  var crossH = document.querySelector(".cross-h");
  var readout = document.getElementById("cross-readout");
  if (crossV && crossH && readout && finePointer && !reduceMotion) {
    root.classList.add("cursor-on");
    var rafPending = false, px = 0, py = 0;
    window.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () {
        rafPending = false;
        crossV.style.transform = "translateX(" + px + "px)";
        crossH.style.transform = "translateY(" + py + "px)";
        readout.style.left = px + "px";
        readout.style.top = py + "px";
        readout.textContent =
          "X " + String(px).padStart(4, "0") + " · Y " + String(py + Math.round(window.scrollY)).padStart(4, "0");
      });
    }, { passive: true });
  }

  /* ---- Drafting canvas: lines being drawn on the board ---- */
  var canvas = document.getElementById("bg-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var w, h, dpr;
    var GRID = 24;
    var lines = [];
    var lastSpawn = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function snap(v) { return Math.round(v / GRID) * GRID; }

    function spawnLine(now) {
      var horizontal = Math.random() < 0.5;
      var len = GRID * (3 + Math.floor(Math.random() * 10));
      var x = snap(Math.random() * (w - len));
      var y = snap(Math.random() * (h - len));
      var accent = Math.random() < 0.18;
      lines.push({
        x1: x, y1: y,
        x2: horizontal ? x + len : x,
        y2: horizontal ? y : y + len,
        born: now,
        draw: 900 + Math.random() * 600,   /* draw duration */
        hold: 2600 + Math.random() * 2000, /* fully visible */
        fade: 1400,                        /* fade out */
        accent: accent,
        ticks: Math.random() < 0.4        /* end ticks, like a dimension line */
      });
    }

    function step(now) {
      ctx.clearRect(0, 0, w, h);

      if (now - lastSpawn > 520 && lines.length < 14) {
        lastSpawn = now;
        spawnLine(now);
      }

      for (var i = lines.length - 1; i >= 0; i--) {
        var L = lines[i];
        var age = now - L.born;
        var total = L.draw + L.hold + L.fade;
        if (age > total) { lines.splice(i, 1); continue; }

        var p = Math.min(age / L.draw, 1);            /* draw progress */
        var alpha = age > L.draw + L.hold
          ? 1 - (age - L.draw - L.hold) / L.fade      /* fading */
          : 1;
        var base = L.accent ? "255,122,26" : "242,241,236";
        var a = (L.accent ? 0.35 : 0.10) * alpha;

        var cx = L.x1 + (L.x2 - L.x1) * p;
        var cy = L.y1 + (L.y2 - L.y1) * p;

        ctx.strokeStyle = "rgba(" + base + "," + a + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.x1 + 0.5, L.y1 + 0.5);
        ctx.lineTo(cx + 0.5, cy + 0.5);
        ctx.stroke();

        /* end ticks (dimension-line style) */
        if (L.ticks) {
          ctx.beginPath();
          if (L.y1 === L.y2) {
            ctx.moveTo(L.x1 + 0.5, L.y1 - 4); ctx.lineTo(L.x1 + 0.5, L.y1 + 4);
            if (p === 1) { ctx.moveTo(L.x2 + 0.5, L.y2 - 4); ctx.lineTo(L.x2 + 0.5, L.y2 + 4); }
          } else {
            ctx.moveTo(L.x1 - 4, L.y1 + 0.5); ctx.lineTo(L.x1 + 4, L.y1 + 0.5);
            if (p === 1) { ctx.moveTo(L.x2 - 4, L.y2 + 0.5); ctx.lineTo(L.x2 + 4, L.y2 + 0.5); }
          }
          ctx.stroke();
        }

        /* pen point while drawing */
        if (p < 1) {
          ctx.fillStyle = "rgba(" + base + "," + Math.min(a * 3, 0.8) + ")";
          ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
        }
      }
      requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(step);
  }

  onScroll();
})();
