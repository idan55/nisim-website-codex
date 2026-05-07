const introScreen = document.getElementById("intro-screen");
const siteShell = document.getElementById("site-shell");
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");
const accessibilityToggle = document.getElementById("accessibility-toggle");
const accessibilityPanel = document.getElementById("accessibility-panel");
const closePanelButton = document.getElementById("close-panel");
const revealTargets = document.querySelectorAll("[data-reveal]");
const storageKey = "asiseng-accessibility-settings";

const media = {
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)"),
  desktop: window.matchMedia("(min-width: 960px)"),
};

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

function shouldReduceMotion() {
  return state.stopMotion || media.reducedMotion.matches;
}

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
  if (!savedState) return;

  try {
    Object.assign(state, JSON.parse(savedState));
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function setPanelState(isOpen) {
  if (!accessibilityPanel || !accessibilityToggle) return;
  accessibilityPanel.hidden = !isOpen;
  accessibilityToggle.setAttribute("aria-expanded", String(isOpen));
}

function setNavState(isOpen) {
  if (!mainNav || !navToggle) return;

  const nextState = Boolean(isOpen && !media.desktop.matches);
  mainNav.classList.toggle("is-open", nextState);
  navToggle.setAttribute("aria-expanded", String(nextState));
  navToggle.setAttribute("aria-label", nextState ? "סגירת תפריט" : "פתיחת תפריט");
  document.body.classList.toggle("nav-open", nextState);
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
  initRevealObserver();
}

function initIntro() {
  if (!introScreen || !siteShell) return;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection && connection.saveData);
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const introDelay = shouldReduceMotion() || saveData ? 0 : coarsePointer ? 380 : 720;

  window.setTimeout(() => {
    introScreen.classList.add("is-hidden");
    siteShell.classList.add("is-ready");
  }, introDelay);
}

let revealObserver;

function initRevealObserver() {
  if (!revealTargets.length) return;

  if (revealObserver) {
    revealObserver.disconnect();
  }

  if (shouldReduceMotion()) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  revealTargets.forEach((element) => element.classList.remove("is-visible"));

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
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

  if (
    mainNav &&
    navToggle &&
    mainNav.classList.contains("is-open") &&
    !mainNav.contains(event.target) &&
    event.target !== navToggle &&
    !navToggle.contains(event.target)
  ) {
    setNavState(false);
  }
});

if (navToggle) {
  navToggle.addEventListener("click", () => {
    setNavState(!mainNav.classList.contains("is-open"));
  });
}

if (mainNav) {
  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setNavState(false);
    }
  });
}

if (accessibilityToggle) {
  accessibilityToggle.addEventListener("click", () => {
    setPanelState(accessibilityPanel ? accessibilityPanel.hidden : false);
  });
}

if (closePanelButton) {
  closePanelButton.addEventListener("click", () => setPanelState(false));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setPanelState(false);
    setNavState(false);
  }
});

media.desktop.addEventListener("change", () => {
  setNavState(false);
});

media.reducedMotion.addEventListener("change", () => {
  initRevealObserver();
});

loadAccessibilityState();
applyAccessibilityState();
initIntro();
initRevealObserver();
