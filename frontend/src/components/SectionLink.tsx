import { MouseEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Link to a section of the home page (e.g. "how") that works with any router, including the in-memory one used for previews. */
export function SectionLink({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const go = (e: MouseEvent) => {
    e.preventDefault();
    const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (pathname === '/') scroll();
    else {
      navigate('/');
      setTimeout(scroll, 120);
    }
  };
  return (
    <a href={`#${id}`} className={className} onClick={go}>
      {children}
    </a>
  );
}
