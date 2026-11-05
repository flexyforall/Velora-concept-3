/* Velora — loader (Figma 635:8074)
 * 01  blank canvas, counter 0%
 * 02  left stroke of the mark rises in            18%
 * 03  peak of the mark                            35%
 * 04  right stroke                                54%
 * 05  mark complete                               78%
 * 06  rays complete                              100%
 * 07  mark slides left, "Velora" wordmark comes in, counter rises and fades
 * The run holds before 100% until the page (fonts, images) has loaded.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var loader = document.querySelector(".loader");
  if (!loader || !root.classList.contains("is-loading")) return;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  var logo = loader.querySelector(".loader__logo");
  var counter = loader.querySelector(".loader__counter");
  var marks = ["mark-l", "mark-c", "mark-r"].map(function (k) {
    return loader.querySelector('[data-part="' + k + '"]');
  });
  var letters = loader.querySelectorAll(".loader__letter");

  // timeline, ms
  var MARK_IN = [200, 550, 900];   // start of each stroke
  var MARK_DUR = 450;
  var HOLD_AT = 1500;              // 78% — wait here for window.load
  var FULL_AT = 1750;              // 100%
  var WORD_AT = 1900;              // frame 07
  var WORD_DUR = 650;
  var LEAVE_AT = 2900;
  // counter keyframes [time, value] — matches frames 01–06
  var COUNT = [[0, 0], [550, 18], [900, 35], [1250, 54], [HOLD_AT, 78], [FULL_AT, 100]];

  var loaded = document.readyState === "complete";
  window.addEventListener("load", function () { loaded = true; });

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function range(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function countAt(t) {
    for (var i = 1; i < COUNT.length; i++) {
      if (t <= COUNT[i][0]) {
        var a = COUNT[i - 1], b = COUNT[i];
        return a[1] + (b[1] - a[1]) * range(t, a[0], b[0]);
      }
    }
    return 100;
  }

  var start = null;
  var held = 0;          // time spent waiting for load
  var last = null;

  function frame(now) {
    if (start === null) { start = now; last = now; }
    var dt = now - last; last = now;
    var t = now - start - held;
    // hold at 78% until the page has loaded
    if (!loaded && t > HOLD_AT) { held += dt; t = HOLD_AT; }

    // strokes: rise 10px and fade in (frames 02–04)
    for (var i = 0; i < marks.length; i++) {
      var k = easeOut(range(t, MARK_IN[i], MARK_IN[i] + MARK_DUR));
      marks[i].style.opacity = k;
      marks[i].style.transform = "translateY(" + 10 * (1 - k) + "px)";
    }

    counter.textContent = Math.round(countAt(t)) + "%";

    // frame 07: mark moves left so the full logo is centered, wordmark appears
    var w = easeInOut(range(t, WORD_AT, WORD_AT + WORD_DUR));
    logo.style.left = "calc(50% + " + (158.5 - 159 * w) + "px)"; // 02–06: +158.5px → 07: −0.5px
    for (var j = 0; j < letters.length; j++) {
      var kl = easeOut(range(t, WORD_AT + 120 + j * 60, WORD_AT + 520 + j * 60));
      letters[j].style.opacity = kl;
      letters[j].style.transform = "translateY(" + 10 * (1 - kl) + "px)";
    }
    var c = easeOut(range(t, WORD_AT, WORD_AT + 400));
    counter.style.opacity = 1 - c;
    counter.style.transform = "translate(-50%, " + (-10 * c) + "px)";

    // logo fades out on the white canvas, then the loader is gone at once
    var out = range(t, LEAVE_AT - 320, LEAVE_AT - 40);
    logo.style.opacity = 1 - out;

    if (t >= LEAVE_AT) {
      loader.classList.add("is-leaving");
      root.classList.add("is-revealing");      // hero UI animates in, text is already there
      root.classList.remove("is-loading");
      setTimeout(function () { root.classList.remove("is-revealing"); }, 2000);
      window.dispatchEvent(new Event("resize")); // let the page re-measure without the scroll lock
      loader.remove();
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
