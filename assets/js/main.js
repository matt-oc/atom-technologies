(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Nav scroll state ---------------- */
  var nav = document.getElementById("siteNav");
  var navTicking = false;
  function updateNav() {
    if (window.scrollY > 24) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
    navTicking = false;
  }
  updateNav();
  window.addEventListener(
    "scroll",
    function () {
      if (!navTicking) {
        requestAnimationFrame(updateNav);
        navTicking = true;
      }
    },
    { passive: true }
  );

  /* ---------------- Footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal-up");
  if (prefersReducedMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Animated stat counters ---------------- */
  var counters = document.querySelectorAll(".js-count");
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var isDecimal = String(target).indexOf(".") !== -1;
    var duration = 1400;
    var start = null;

    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = isDecimal ? value.toFixed(1) : Math.round(value);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }

  if (counters.length && "IntersectionObserver" in window) {
    var countIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { countIo.observe(el); });
  }

  /* ---------------- Pause offscreen animations ---------------- */
  var animatedRegions = document.querySelectorAll(".hero-visual, .capability-strip");
  if (!prefersReducedMotion && "IntersectionObserver" in window && animatedRegions.length) {
    var animIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("anim-paused", !entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );
    animatedRegions.forEach(function (el) { animIo.observe(el); });
  }

  /* ---------------- Contact form: AJAX submit to Formspree ---------------- */
  var form = document.getElementById("contactForm");
  var statusBox = document.getElementById("formStatus");
  var submitBtn = document.getElementById("contactSubmit");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // If reCAPTCHA is present and configured, make sure it's completed.
      if (window.grecaptcha && document.querySelector(".g-recaptcha")) {
        var recaptchaResponse = window.grecaptcha.getResponse();
        if (!recaptchaResponse) {
          showStatus("Please confirm you're not a robot before sending.", "err");
          return;
        }
      }

      var originalBtnHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = "Sending…";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (response.ok) {
            showStatus("Thanks — your message is on its way. We'll be in touch shortly.", "ok");
            form.reset();
            if (window.grecaptcha) window.grecaptcha.reset();
          } else {
            return response.json().then(function (data) {
              var msg =
                data && data.errors && data.errors.length
                  ? data.errors.map(function (er) { return er.message; }).join(", ")
                  : "Something went wrong. Please try again or call us directly.";
              throw new Error(msg);
            });
          }
        })
        .catch(function (err) {
          showStatus(err.message || "Something went wrong. Please try again or call us directly.", "err");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        });
    });
  }

  function showStatus(message, type) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.className = "form-status " + (type === "ok" ? "status-ok" : "status-err");
  }
})();
