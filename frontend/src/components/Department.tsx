import { useStore } from '../lib/store';
import { SHOPS_FOR_LABEL, type ShopsFor } from '../lib/types';
import { Modal } from './Overlay';

const OPTIONS: { value: ShopsFor; blurb: string }[] = [
  { value: 'women', blurb: 'Dresses, tailoring, knitwear and more, cut for women.' },
  { value: 'men', blurb: 'Suiting, shirts, outerwear and more, cut for men.' },
];

/** Two-way switch between womenswear and menswear. */
export function DepartmentSwitch({ compact }: { compact?: boolean }) {
  const { department, setDepartment, toast } = useStore();
  return (
    <div className={`dept-switch ${compact ? 'is-compact' : ''}`} role="radiogroup" aria-label="Shopping for">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={department === o.value}
          className={department === o.value ? 'is-active' : ''}
          onClick={() => {
            if (department === o.value) return;
            setDepartment(o.value);
            toast(`Showing ${SHOPS_FOR_LABEL[o.value].toLowerCase()}.`);
          }}
        >
          {SHOPS_FOR_LABEL[o.value]}
        </button>
      ))}
    </div>
  );
}

/** Asked once, for accounts that signed up before FORYA had departments (or via Google / Apple). */
export function DepartmentGate() {
  const { needsDepartment, setDepartment } = useStore();
  if (!needsDepartment) return null;
  return (
    <Modal title="What do you" wink="shop for?" onClose={() => setDepartment('women')} width={520}>
      <p className="body" style={{ marginTop: -8 }}>
        FORYA only shows you clothes cut for you. You can change this any time from your account menu.
      </p>
      <div className="dept-cards">
        {OPTIONS.map((o) => (
          <button key={o.value} className="dept-card" onClick={() => setDepartment(o.value)}>
            <span className="h3">{SHOPS_FOR_LABEL[o.value]}</span>
            <span className="small">{o.blurb}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
