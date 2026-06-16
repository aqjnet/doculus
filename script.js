(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = "© " + new Date().getFullYear();

  /* ---- Nav scroll state ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    toggle.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
  }
  toggle.addEventListener("click", function () {
    setMenu(!menu.classList.contains("open"));
  });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Animated stat counters ---- */
  var stats = document.querySelectorAll(".stat-num[data-count]");
  function animateCount(el) {
    if (el.dataset.text) { el.textContent = el.dataset.text; return; }
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
  if ("IntersectionObserver" in window) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); statIO.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { statIO.observe(el); });
  } else {
    stats.forEach(animateCount);
  }

  /* ---- Card spotlight + tilt ---- */
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
      if (!reduceMotion) {
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        card.style.transform = "perspective(700px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
      }
    });
    card.addEventListener("pointerleave", function () { card.style.transform = ""; });
  });

  /* ---- Cursor glow (desktop, fine pointer only) ---- */
  var glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    window.addEventListener("pointermove", function (e) {
      glow.style.opacity = "1";
      glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
    });
    window.addEventListener("pointerleave", function () { glow.style.opacity = "0"; });
  }

  /* ---- Animated particle / node background ---- */
  var canvas = document.getElementById("bg-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var w, h, dpr, nodes = [];
    var mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(Math.floor((w * h) / 16000), 90);
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35
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

        // connect nearby nodes
        for (var j = i + 1; j < nodes.length; j++) {
          var m = nodes[j];
          var dx = n.x - m.x, dy = n.y - m.y;
          var dist = dx * dx + dy * dy;
          if (dist < 16000) {
            var a = (1 - dist / 16000) * 0.22;
            ctx.strokeStyle = "rgba(76, 201, 240," + a + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        // connect to mouse
        var mdx = n.x - mouse.x, mdy = n.y - mouse.y;
        var mdist = mdx * mdx + mdy * mdy;
        if (mdist < 26000) {
          var ma = (1 - mdist / 26000) * 0.5;
          ctx.strokeStyle = "rgba(123, 97, 255," + ma + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(150, 200, 255, 0.55)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    resize();
    step();
  }
})();
