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
        e.target.style.setProperty("--d", Math.min(idx * 0.09, 0.45) + "s");
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
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null, dur = 1400;
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
    var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
    p = Math.max(0, Math.min(1, p));
    steps.style.setProperty("--steps-p", p.toFixed(3));
  }

  /* ---- Card spotlight + tilt ---- */
  document.querySelectorAll(".card, .step").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
      if (!reduceMotion && finePointer && card.classList.contains("card")) {
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
        card.style.transform = "perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
      }
    });
    card.addEventListener("pointerleave", function () { card.style.transform = ""; });
  });

  /* ---- Magnetic buttons ---- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + dx * 0.18 + "px," + dy * 0.22 + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 0.4s cubic-bezier(0.16,1,0.3,1)";
        el.style.transform = "";
        setTimeout(function () { el.style.transition = ""; }, 400);
      });
    });
  }

  /* ---- Custom cursor ---- */
  var dot = document.querySelector(".cursor-dot");
  var ring = document.querySelector(".cursor-ring");
  if (dot && ring && finePointer && !reduceMotion) {
    root.classList.add("cursor-on");
    var rx = -100, ry = -100, tx = -100, ty = -100;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px)";
    }, { passive: true });
    (function ringLoop() {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(ringLoop);
    })();
    document.querySelectorAll("a, button, .card, .tag-row li").forEach(function (el) {
      el.addEventListener("pointerenter", function () { ring.classList.add("is-hover"); });
      el.addEventListener("pointerleave", function () { ring.classList.remove("is-hover"); });
    });
  }

  /* ---- Hero parallax (logo drifts with pointer) ---- */
  var heroMark = document.getElementById("hero-mark");
  if (heroMark && finePointer && !reduceMotion) {
    window.addEventListener("pointermove", function (e) {
      var dx = (e.clientX / window.innerWidth - 0.5) * 14;
      var dy = (e.clientY / window.innerHeight - 0.5) * 10;
      heroMark.style.transform = "translate(" + dx + "px," + dy + "px)";
    }, { passive: true });
  }

  /* ---- Constellation canvas ---- */
  var canvas = document.getElementById("bg-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var w, h, dpr, nodes = [];
    var mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(Math.floor((w * h) / 15000), 100);
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: 1 + Math.random() * 1.2
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x, dy = n.y - m.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 17000) {
            ctx.strokeStyle = "rgba(76,201,240," + ((1 - d2 / 17000) * 0.20) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
        var mdx = n.x - mouse.x, mdy = n.y - mouse.y;
        var md2 = mdx * mdx + mdy * mdy;
        if (md2 < 30000) {
          ctx.strokeStyle = "rgba(123,97,255," + ((1 - md2 / 30000) * 0.5) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(160,205,255,0.55)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    resize();
    step();
  }

  onScroll();
})();
