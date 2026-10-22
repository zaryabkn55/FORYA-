import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * For embedded previews (VITE_ROUTER=memory). Some hosts treat any <a href="/..."> click inside their frame
 * as a real page load, which blanks the app. In-app links have their href moved to data-href (so the host
 * ignores them) and are routed in memory instead.
 */
export function LinkInterceptor() {
  const navigate = useNavigate();
  useEffect(() => {
    const strip = (root: ParentNode) =>
      root.querySelectorAll?.('a[href^="/"]').forEach((a) => {
        const href = a.getAttribute('href')!;
        if (href.startsWith('//')) return;
        a.setAttribute('data-href', href);
        a.removeAttribute('href');
        a.setAttribute('role', 'link');
        if (!a.hasAttribute('tabindex')) a.setAttribute('tabindex', '0');
      });
    strip(document);
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === 'attributes') strip(m.target.parentNode ?? document);
        m.addedNodes.forEach((n) => n instanceof Element && (n.matches('a[href^="/"]') ? strip(n.parentNode ?? document) : strip(n)));
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['href'] });

    const go = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[data-href]');
      if (!a) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      navigate(a.getAttribute('data-href')!);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && go(e);
    window.addEventListener('click', go, true);
    window.addEventListener('keydown', onKey, true);
    const style = document.createElement('style');
    style.textContent = 'a[data-href]{cursor:pointer}';
    document.head.appendChild(style);
    return () => {
      mo.disconnect();
      window.removeEventListener('click', go, true);
      window.removeEventListener('keydown', onKey, true);
      style.remove();
    };
  }, [navigate]);
  return null;
}
