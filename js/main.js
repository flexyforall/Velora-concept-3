/* Velora — Concept 3
 * 1) Scales the 1440px canvas down on narrower screens (layout stays 1:1 with Figma).
 * 2) Scroll storyboard for the products panel (Figma section 884:3776):
 *    home-2  panel rises into view; white dots travel from the symbol along the lines
 *    home-3  each dot reaches its spot and the product node pops in, new dots keep flowing
 *    home-4  panel grows to full-bleed and pins; from here the rest plays on its own
 *            (not with the scroll): the nodes bump and vanish, then the request card,
 *            the lines through the symbol, the result window and the menu come in
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
  var H2 = 0.497; // panel top (in viewport heights) in Figma frame home-2
  var lines = Array.prototype.map.call(document.querySelectorAll(".net__line"), function (el, i) {
    var x = +el.dataset.x, y = +el.dataset.y, dx = +el.dataset.dx, dy = +el.dataset.dy;
    // how far along the line the dot is in home-2
    var f = Math.sqrt(dx * dx + dy * dy) / Math.sqrt(x * x + y * y);
    var t1 = 0.4 - i * 0.018;            // arrival (panel top, in vh) — staggered
    var t0 = (H2 - f * t1) / (1 - f);    // departure, so the dot sits at (dx, dy) in home-2
    return {
      el: el, x: x, y: y, dx: dx, dy: dy, f: f, t0: t0, t1: t1, i: i,
      lead: el.querySelector(".net__lead"),
      flow: el.querySelector(".net__flow"),
      node: el.querySelector(".node")
    };
  });
  var card = document.querySelector(".anim-left");
  var win = document.querySelector(".anim-up");
  var tabs = document.querySelector(".anim-up-sm");
  var heroInner = document.querySelector(".hero__inner");
  var beamIn = document.querySelector(".beam--in");
  var beamOut = document.querySelector(".beam--out");
  var pulseIn = document.querySelector(".pulse--in");
  var pulseOut = document.querySelector(".pulse--out");
  var linesLayer = document.querySelector(".stage--3-lines");
  var contentLayer = document.querySelector(".stage--3-content");
  var beamsLayer = document.querySelector(".stage--3-beams");
  var tabsLayer = document.querySelector(".stage--3-tabs");
  var symbol = document.querySelector(".symbol");
  var LINE_HALF_H = 354;   // vertical reach of the line fan from the symbol (home-4)
  var LINE_HALF_W = 734;   // horizontal reach

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function range(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function easeOutBack(t) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  // "bump": swell to 1.18, then collapse to 0
  function bump(t) { return t < 0.35 ? 1 + 0.18 * easeOut(t / 0.35) : 1.18 * (1 - easeIn((t - 0.35) / 0.65)); }

  function updateLine(L, topVh, p) {
    // lead dot: center → home-2 spot → node, driven by scroll
    var k = range(topVh, L.t0, L.t1);
    var px, py;
    if (k <= L.f) { var a = k / L.f; px = L.dx * a; py = L.dy * a; }
    else { var b = (k - L.f) / (1 - L.f); px = lerp(L.dx, L.x, b); py = lerp(L.dy, L.y, b); }
    L.lead.style.transform = "translate(calc(-50% + " + px + "px), calc(-50% + " + py + "px))";
    L.lead.style.opacity = range(topVh, L.t0, L.t0 - 0.03) * (1 - range(topVh, L.t1 + 0.012, L.t1)) * (1 - range(p, 0, 0.05));

    // node pops in when the dot arrives …
    var pop = range(topVh, L.t1, L.t1 - 0.045);
    // … and bumps away once the panel is pinned
    var bk = range(p, 0.03 + L.i * 0.025, 0.17 + L.i * 0.025);
    var s = bk > 0 ? bump(bk) : easeOutBack(pop);
    L.node.style.setProperty("--s", Math.max(0, s));
    L.node.style.opacity = range(pop, 0, 0.3) * (1 - range(bk, 0.7, 1));

    // new dots keep flowing along the line while the node is shown
    var fo = range(topVh, L.t1 - 0.02, L.t1 - 0.06) * (1 - range(bk, 0, 0.4));
    L.flow.style.opacity = fo;
    // start the few runs when the node shows up; reset once it is gone so it can replay
    if (fo > 0.01) L.el.classList.add("is-flowing");
    else if (fo === 0) L.el.classList.remove("is-flowing");
  }

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
    pin = Math.round(Math.max(420, vh * 0.55)); // short hold on the final frame before it scrolls away
    root.style.setProperty("--stage-h", stageH + "px");
    root.style.setProperty("--pin", pin + "px");
    update();
  }

  function setStage3(o) {
    for (var i = 0; i < stage3.length; i++) stage3[i].style.opacity = o;
  }

  // --- full-screen state: the rest plays on its own, not with the scroll ---
  var PLAY_END = 0.82;           // where the timeline below is complete
  var PLAY_MS = 4000;            // ms for p: 0 → 1 (so ~3.3s to PLAY_END)
  var BACK_MS = 1400;            // faster when rewinding
  var play = { p: 0, target: 0, raf: 0, last: 0 };
  var lastTop = 0;

  function lock(on) { root.classList.toggle("is-locked", on); }

  function step(now) {
    var dt = Math.min(64, now - (play.last || now));
    play.last = now;
    var dir = play.target > play.p ? 1 : -1;
    play.p += dir * dt / (dir > 0 ? PLAY_MS : BACK_MS);
    if ((dir > 0 && play.p >= play.target) || (dir < 0 && play.p <= play.target)) {
      play.p = play.target;
      play.raf = 0;
      lock(false);
      render(lastTop);
      return;
    }
    render(lastTop);
    play.raf = requestAnimationFrame(step);
  }

  function setTarget(target, withLock) {
    if (play.target === target && (play.raf || play.p === target)) return;
    play.target = target;
    if (withLock && target > play.p) lock(true);
    if (!play.raf) { play.last = 0; play.raf = requestAnimationFrame(step); }
  }

  function update() {
    if (reduceMotion.matches) return;
    // rect values → canvas px, whatever the browser's zoom model is
    var s = sticky.getBoundingClientRect();
    var scale = s.height / sticky.offsetHeight || 1;
    var top = section.getBoundingClientRect().top / scale;
    lastTop = top;

    if (top <= 0.5 && top > -pin) setTarget(PLAY_END, true);       // panel is full-screen: play
    else if (top <= -pin) { play.p = play.target = PLAY_END; }     // already past it
    // scrolling back up: the sequence stays played (no rewind)

    render(top);
  }

  function render(top) {
    // --- hero parallax: content runs 70.5px ahead of the scroll (home-1 → home-2)
    var heroShift = range(window.scrollY / zoom, 0, 246.5);
    heroInner.style.transform = "translateY(" + (-70.5 * heroShift) + "px)";

    // --- with the scroll: dots travel, nodes pop (home-2 → home-3) ---
    var topVh = top / vh;
    var p = play.p;
    for (var i = 0; i < lines.length; i++) updateLine(lines[i], topVh, p);
    var net2 = range(topVh, 0.42, 0.32); // line layout switches to the home-3 network
    stage1.style.opacity = (1 - net2) * (1 - range(p, 0, 0.05));

    // --- with the scroll: panel grows to full-bleed (home-3 → home-4) ---
    var g = ease(range(top, vh * 0.3, 0));
    // --- with the scroll, leaving: the panel narrows by 30px on each side ---
    var n = ease(range(top, -pin, -pin - vh * 0.5));
    var inset = lerp(START.inset, 0, g) + 30 * n;
    var panelH = lerp(START.height, stageH, g);
    panel.style.setProperty("--inset", inset + "px");
    panel.style.setProperty("--panel-h", panelH + "px");

    // content drifts up a little as the panel leaves (home-4 → home-5)
    var shift = -60 * n;
    var sy = "translate(-50%, calc(-50% + " + shift + "px))";
    symbol.style.transform = sy;
    contentLayer.style.transform = sy;
    beamsLayer.style.transform = sy;
    tabsLayer.style.transform = "translateY(" + shift + "px)";
    // lines always run past the panel edges
    var reach = Math.max(1,
      (panelH / 2 + Math.abs(shift) + 40) / LINE_HALF_H,
      ((CANVAS - 2 * inset) / 2 + 40) / LINE_HALF_W);
    linesLayer.style.transform = sy + " scale(" + reach + ")";
    panel.style.setProperty("--radius", (lerp(START.radius, 0, g) + START.radius * n) + "px");

    // --- on its own (time): nodes bump away, interface comes in (home-4) ---
    stage2.style.opacity = net2 * (1 - ease(range(p, 0.1, 0.28)));
    setStage3(ease(range(p, 0.16, 0.3)));

    // request card → line to the symbol → line to the result → result window → menu
    var kc = range(p, 0.2, 0.36);
    card.style.transform = "translateX(" + (-56 * (1 - easeOutBack(kc))) + "px)";
    card.style.opacity = range(kc, 0, 0.3);

    var bi = easeOut(range(p, 0.36, 0.46));
    beamIn.style.transform = "scaleX(" + bi + ")";
    pulseIn.style.opacity = range(p, 0.44, 0.47);
    pulseIn.classList.toggle("is-running", p >= 0.44);

    var bo = easeOut(range(p, 0.47, 0.57));
    beamOut.style.transform = "scaleX(" + bo + ")";
    pulseOut.style.opacity = range(p, 0.55, 0.58);
    pulseOut.classList.toggle("is-running", p >= 0.55);

    var kw = range(p, 0.56, 0.72);
    win.style.transform = "translateY(calc(-50% + " + (64 * (1 - easeOutBack(kw))) + "px)) scale(" + lerp(0.94, 1, easeOut(kw)) + ")";
    win.style.opacity = range(kw, 0, 0.3);

    var kt = range(p, 0.66, 0.8);
    tabs.style.transform = "translateX(-50%) translateY(" + (40 * (1 - easeOutBack(kt))) + "px)";
    tabs.style.opacity = range(kt, 0, 0.3);
  }

  function resetFinal() {
    heroInner.style.transform = "";
    ["--inset", "--panel-h", "--radius"].forEach(function (v) { panel.style.removeProperty(v); });
    stage1.style.opacity = stage2.style.opacity = "";
    setStage3("");
    card.style.transform = win.style.transform = tabs.style.transform = "";
    card.style.opacity = win.style.opacity = tabs.style.opacity = "";
    beamIn.style.transform = beamOut.style.transform = "";
    pulseIn.style.opacity = pulseOut.style.opacity = "";
    root.style.removeProperty("--stage-h");
    root.style.removeProperty("--pin");
    symbol.style.transform = contentLayer.style.transform = beamsLayer.style.transform = tabsLayer.style.transform = linesLayer.style.transform = "";
    if (play.raf) cancelAnimationFrame(play.raf);
    play.raf = 0;
    lock(false);
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

  // Product menu: changes only on click
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabButtons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("tab--active", on);
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
    });
  });

  init();
})();
