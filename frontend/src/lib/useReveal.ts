import { useEffect } from 'react';

/**
 * Scroll reveals. Anything marked `data-reveal` (itself) or `data-reveal-stagger` (its children)
 * rises into place the first time it comes near the viewport, then stops being watched. Honours
 * prefers-reduced-motion by showing everything at once, and does the same where the browser has no
 * IntersectionObserver — so content never depends on the animation to be visible.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-stagger]'));
    if (!nodes.length) return;

    const still = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
