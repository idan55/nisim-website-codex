const introScreen = document.getElementById("intro-screen");
const siteShell = document.getElementById("site-shell");
const accessibilityToggle = document.getElementById("accessibility-toggle");
const accessibilityPanel = document.getElementById("accessibility-panel");
const closePanelButton = document.getElementById("close-panel");
const storageKey = "asiseng-accessibility-settings";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

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

function initIntro() {
  if (!introScreen || !siteShell) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.setTimeout(() => {
    introScreen.classList.add("is-hidden");
    siteShell.classList.add("is-ready");
  }, reduced ? 0 : 1200);
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
    setPanelState(accessibilityPanel ? accessibilityPanel.hidden : false);
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
initIntro();

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});
