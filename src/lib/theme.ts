// Fixed code only: no request data or secrets are interpolated into the pre-paint script.
export const themeBootScript = `(()=>{let t;try{t=localStorage.getItem('bsm-theme')}catch{}document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()`;
export function themeSnapshot() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
export function subscribeTheme(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    let saved;
    try {
      saved = localStorage.getItem("bsm-theme");
    } catch {}
    document.documentElement.dataset.theme =
      saved === "light" || saved === "dark"
        ? saved
        : media.matches
          ? "dark"
          : "light";
    notify();
  };
  media.addEventListener("change", sync);
  window.addEventListener("storage", sync);
  window.addEventListener("bsm-theme-change", notify);
  sync();
  return () => {
    media.removeEventListener("change", sync);
    window.removeEventListener("storage", sync);
    window.removeEventListener("bsm-theme-change", notify);
  };
}
export function toggleTheme() {
  const next = themeSnapshot() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("bsm-theme", next);
  } catch {}
  window.dispatchEvent(new Event("bsm-theme-change"));
}
