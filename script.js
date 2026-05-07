const introScreen = document.getElementById("intro-screen");
const siteShell = document.getElementById("site-shell");
const accessibilityToggle = document.getElementById("accessibility-toggle");
const accessibilityPanel = document.getElementById("accessibility-panel");
const closePanelButton = document.getElementById("close-panel");
const scrollProgressBar = document.getElementById("scroll-progress-bar");

const revealElements = document.querySelectorAll(".reveal-on-scroll");
const storageKey = "asiseng-accessibility-settings";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.scrollTo(0, 0);

const state = {
  fontScale: 100,
  highContrast: false,
  readableFont: false,
  underlineLinks: false,
  stopMotion: false,
};

const bodyClassMap = {
  highContrast: "accessibility-high-contrast",
  readableFont: "accessibility-readable-font",
  underlineLinks: "accessibility-underline-links",
  stopMotion: "accessibility-stop-motion",
};

function applyAccessibilityState() {
  document.documentElement.style.setProperty("--font-size-base", `${state.fontScale}%`);
  document.body.classList.toggle(bodyClassMap.highContrast, state.highContrast);
  document.body.classList.toggle(bodyClassMap.readableFont, state.readableFont);
  document.body.classList.toggle(bodyClassMap.underlineLinks, state.underlineLinks);
  document.body.classList.toggle(bodyClassMap.stopMotion, state.stopMotion);
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadAccessibilityState() {
  const savedState = localStorage.getItem(storageKey);
  if (!savedState) {
    return;
  }

  try {
    Object.assign(state, JSON.parse(savedState));
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function setPanelState(isOpen) {
  if (!accessibilityPanel || !accessibilityToggle) {
    return;
  }

  accessibilityPanel.hidden = !isOpen;
  accessibilityToggle.setAttribute("aria-expanded", String(isOpen));
}

function handleAccessibilityAction(action) {
  switch (action) {
    case "increase-text":
      state.fontScale = Math.min(state.fontScale + 10, 150);
      break;
    case "decrease-text":
      state.fontScale = Math.max(state.fontScale - 10, 90);
      break;
    case "toggle-contrast":
      state.highContrast = !state.highContrast;
      break;
    case "toggle-readable-font":
      state.readableFont = !state.readableFont;
      break;
    case "toggle-underline-links":
      state.underlineLinks = !state.underlineLinks;
      break;
    case "toggle-stop-motion":
      state.stopMotion = !state.stopMotion;
      break;
    case "reset-accessibility":
      state.fontScale = 100;
      state.highContrast = false;
      state.readableFont = false;
      state.underlineLinks = false;
      state.stopMotion = false;
      break;
    default:
      return;
  }

  applyAccessibilityState();
}

function initRevealOnScroll() {
  if (!revealElements.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function initIntro() {
  if (!introScreen || !siteShell) {
    return;
  }

  window.setTimeout(() => {
    introScreen.classList.add("is-hidden");
    siteShell.classList.add("is-ready");
  }, 2000);
}

function smoothScrollTo(targetY) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = 820;
  let startTime = null;

  function easeInOutQuart(progress) {
    return progress < 0.5
      ? 8 * progress * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 4) / 2;
  }

  function step(timestamp) {
    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutQuart(progress));

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function initSmoothAnchors() {
  const anchors = document.querySelectorAll('a[href^="#"]');

  anchors.forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      const target = href ? document.querySelector(href) : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      const headerOffset = document.querySelector(".site-header")?.offsetHeight ?? 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 24;
      smoothScrollTo(Math.max(0, targetTop));
      history.replaceState(null, "", href);
    });
  });
}

function initScrollEffects() {
  let ticking = false;

  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (scrollProgressBar) {
      scrollProgressBar.style.width = `${progress}%`;
    }

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(update);
  }

  requestUpdate();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) {
    handleAccessibilityAction(actionTarget.dataset.action);
  }

  if (
    accessibilityPanel &&
    !accessibilityPanel.hidden &&
    !accessibilityPanel.contains(event.target) &&
    event.target !== accessibilityToggle
  ) {
    setPanelState(false);
  }
});

if (accessibilityToggle) {
  accessibilityToggle.addEventListener("click", () => {
    const isOpen = accessibilityPanel ? accessibilityPanel.hidden : false;
    setPanelState(isOpen);
  });
}

if (closePanelButton) {
  closePanelButton.addEventListener("click", () => setPanelState(false));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setPanelState(false);
  }
});

loadAccessibilityState();
applyAccessibilityState();
initRevealOnScroll();
initIntro();
initSmoothAnchors();
initScrollEffects();

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});
