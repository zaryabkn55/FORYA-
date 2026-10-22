import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

function useEscape(onClose: () => void) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
}

export function Drawer({ title, onClose, children, footer }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEscape(onClose);
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div className="eyebrow">{title}</div>
          <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>,
    document.body,
  );
}

export function Modal({ title, wink, onClose, children, width }: { title: string; wink?: string; onClose: () => void; children: ReactNode; width?: number }) {
  useEscape(onClose);
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal-wrap">
        <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ width: width ? `min(${width}px, 100%)` : undefined }}>
          <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 24 }}>
            <h2 className="h2">
              {title} {wink && <span className="wink">{wink}</span>}
            </h2>
            <button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close">
              <Icon name="close" size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
