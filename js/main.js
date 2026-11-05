/* Velora — Concept 3
 * 1) Scales the 1440px canvas down on narrower screens (layout stays 1:1 with Figma).
 * 2) Scroll storyboard for the products panel, following frames home-1 → home-5:
 *    network (home-2) → product nodes (home-3) → product window & tabs (home-4/5).
 */
(function () {
  "use strict";

  var CANVAS = 1440;
  var PANEL_H = 742;
  var NAV_H = 74;
  var root = document.documentElement;
  var zoom = 1;

  function applyZoom() {
    zoom = Math.min(1, window.innerWidth / CANVAS);
    root.style.zoom = zoom === 1 ? "" : String(zoom);
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var section = document.querySelector(".products");
  var sticky = document.querySelector(".products__sticky");
  var stage1 = document.querySelector(".stage--1");
  var stage2 = document.querySelector(".stage--2");
  var stage3 = document.querySelectorAll(".stage--3");
  var nodes = document.querySelectorAll(".stage--2 .node");
  var card = document.querySelector(".anim-left");
  var win = document.querySelector(".anim-up");
  var tabs = document.querySelector(".anim-up-sm");

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // 0 → 1 while t moves from a to b
  function range(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function layout() {
    applyZoom();
    if (reduceMotion.matches) return;
    // viewport height expressed in canvas pixels
    var vh = window.innerHeight / zoom;
    var top = Math.max(NAV_H, Math.round((vh - PANEL_H) / 2));
    // if the viewport is too short for the panel, pin it so its bottom is visible
    if (top + PANEL_H > vh) top = Math.min(NAV_H, Math.round(vh - PANEL_H - 16));
    root.style.setProperty("--stick-top", top + "px");
    root.style.setProperty("--pin", Math.round(Math.max(1200, vh * 1.8)) + "px");
    update();
  }

  function setStage3(o) {
    for (var i = 0; i < stage3.length; i++) stage3[i].style.opacity = o;
  }

  function update() {
    if (reduceMotion.matches) return;
    var r = section.getBoundingClientRect();
    var s = sticky.getBoundingClientRect();
    var travel = r.height - s.height;
    var p = travel > 0 ? clamp((s.top - r.top) / travel, 0, 1) : 1;

    // stage 1 — bare network (home-2)
    var o1 = 1 - range(p, 0.22, 0.34);
    stage1.style.opacity = o1;

    // stage 2 — product nodes (home-3)
    var in2 = ease(range(p, 0.22, 0.38));
    var out2 = ease(range(p, 0.56, 0.7));
    stage2.style.opacity = in2 * (1 - out2);
    for (var i = 0; i < nodes.length; i++) {
      var k = ease(range(p, 0.22 + i * 0.025, 0.36 + i * 0.025));
      nodes[i].style.transform = "scale(" + (0.6 + 0.4 * k) + ")";
      nodes[i].style.opacity = k;
    }

    // stage 3 — final composition (home-4 / home-5)
    var in3 = ease(range(p, 0.6, 0.78));
    setStage3(in3);
    var kc = ease(range(p, 0.62, 0.84));
    var kw = ease(range(p, 0.66, 0.9));
    var kt = ease(range(p, 0.72, 0.96));
    card.style.transform = "translateX(" + (-48 * (1 - kc)) + "px)";
    win.style.transform = "translateY(calc(-50% + " + (56 * (1 - kw)) + "px))";
    win.style.opacity = kw;
    tabs.style.transform = "translateX(-50%) translateY(" + (32 * (1 - kt)) + "px)";
    tabs.style.opacity = kt;
  }

  function resetFinal() {
    stage1.style.opacity = stage2.style.opacity = "";
    setStage3("");
    card.style.transform = win.style.transform = tabs.style.transform = "";
    win.style.opacity = tabs.style.opacity = "";
  }

  function init() {
    if (reduceMotion.matches) {
      root.classList.remove("is-animated");
      resetFinal();
    } else {
      root.classList.add("is-animated");
    }
    layout();
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener("resize", layout);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", init);

  // Product tabs: move the active state on click
  var tabButtons = document.querySelectorAll(".tab");
  Array.prototype.forEach.call(tabButtons, function (btn) {
    btn.addEventListener("click", function () {
      Array.prototype.forEach.call(tabButtons, function (b) {
        b.classList.toggle("tab--active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
    });
  });

  init();
})();
