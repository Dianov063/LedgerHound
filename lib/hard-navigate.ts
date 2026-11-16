/** A full document navigation. In its own module so tests can replace it (jsdom does not navigate). */
export function hardNavigate(url: string): void {
  window.location.assign(url);
}
