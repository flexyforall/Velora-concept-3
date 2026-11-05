/* Velora — Concept 3
 * 1) Scales the 1440px canvas down on narrower screens (layout stays 1:1 with Figma).
 * 2) Scroll storyboard for the products panel (Figma section 884:3776):
 *    home-2  panel rises into view, bare network
 *    home-3  product nodes appear around the Velora symbol
 *    home-4  panel grows to full-bleed, product window, link card and tabs come in
 */
(function () {
  "use strict";

  var CANVAS = 1440;
  var START = { inset: 36, height: 659, radius: 4 }; // home-2 / home-3 panel
  var root = document.documentElement;
  var zoom = 1;
  var vh = 812;      // viewport height in canvas px
  var stageH = 812;  // final panel height (full viewport)
  var pin = 1200;    // scroll distance the panel stays pinned

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var section = document.querySelector(".products");
  var sticky = document.querySelector(".products__sticky");
  var panel = document.querySelector(".panel");
  var stage1 = document.querySelector(".stage--1");
  var stage2 = document.querySelector(".stage--2");
  var stage3 = document.querySelectorAll(".stage--3");
  var nodes = document.querySelectorAll(".stage--2 .node");
  var card = document.querySelector(".anim-left");
  var win = document.querySelector(".anim-up");
  var tabs = document.querySelector(".anim-up-sm");
  var heroInner = document.querySelector(".hero__inner");

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function range(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function applyZoom() {
    zoom = Math.min(1, window.innerWidth / CANVAS);
    root.style.zoom = zoom === 1 ? "" : String(zoom);
  }

  function layout() {
    applyZoom();
    vh = window.innerHeight / zoom;
    if (reduceMotion.matches) {
      root.style.removeProperty("--stage-h");
      return;
    }
    stageH = Math.round(clamp(vh, 700, 1000));
    pin = Math.round(Math.max(1000, vh * 1.4));
    root.style.setProperty("--stage-h", stageH + "px");
    root.style.setProperty("--pin", pin + "px");
    update();
  }

  function setStage3(o) {
    for (var i = 0; i < stage3.length; i++) stage3[i].style.opacity = o;
  }

  function update() {
    if (reduceMotion.matches) return;
    // rect values → canvas px, whatever the browser's zoom model is
    var s = sticky.getBoundingClientRect();
    var scale = s.height / sticky.offsetHeight || 1;
    var top = section.getBoundingClientRect().top / scale;

    // --- hero parallax: content runs 70.5px ahead of the scroll (home-1 → home-2)
    var heroShift = range(window.scrollY / zoom, 0, 246.5);
    heroInner.style.transform = "translateY(" + (-70.5 * heroShift) + "px)";

    // --- before the pin: panel rises (home-2 → home-3) ---
    var rise = ease(range(top, vh * 0.48, vh * 0.3)); // 0 → 1 while the panel comes up
    stage1.style.opacity = 1 - rise;
    stage2.style.opacity = rise;
    for (var i = 0; i < nodes.length; i++) {
      var k = ease(range(top, vh * (0.48 - i * 0.02), vh * (0.38 - i * 0.02)));
      nodes[i].style.transform = "scale(" + (0.6 + 0.4 * k) + ")";
      nodes[i].style.opacity = k;
    }

    // --- approaching the top: panel grows to full-bleed (home-3 → home-4) ---
    var g = ease(range(top, vh * 0.3, 0));
    panel.style.setProperty("--inset", lerp(START.inset, 0, g) + "px");
    panel.style.setProperty("--panel-h", lerp(START.height, stageH, g) + "px");
    panel.style.setProperty("--radius", lerp(START.radius, 0, g) + "px");

    // --- pinned: network gives way to the product composition (home-4) ---
    var p = clamp(-top / pin, 0, 1);
    var out2 = ease(range(p, 0.04, 0.3));
    stage2.style.opacity = rise * (1 - out2);

    setStage3(ease(range(p, 0.1, 0.36)));
    var kc = ease(range(p, 0.16, 0.46));
    var kw = ease(range(p, 0.22, 0.56));
    var kt = ease(range(p, 0.32, 0.66));
    card.style.transform = "translateX(" + (-48 * (1 - kc)) + "px)";
    win.style.transform = "translateY(calc(-50% + " + (56 * (1 - kw)) + "px))";
    win.style.opacity = kw;
    tabs.style.transform = "translateX(-50%) translateY(" + (32 * (1 - kt)) + "px)";
    tabs.style.opacity = kt;
  }

  function resetFinal() {
    heroInner.style.transform = "";
    ["--inset", "--panel-h", "--radius"].forEach(function (v) { panel.style.removeProperty(v); });
    stage1.style.opacity = stage2.style.opacity = "";
    setStage3("");
    card.style.transform = win.style.transform = tabs.style.transform = "";
    win.style.opacity = tabs.style.opacity = "";
    root.style.removeProperty("--stage-h");
    root.style.removeProperty("--pin");
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
