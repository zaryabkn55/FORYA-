import { useStore } from '../lib/store';
import { Icon } from './Icon';

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <span className="toast-dot">
            <Icon name="check" size={15} stroke={2} />
          </span>
          <span>
            {t.text} {t.wink && <span className="wink">{t.wink}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
