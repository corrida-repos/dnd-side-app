import { useEffect, useState, type ReactNode } from 'react';

export function Card({ title, children, actions, className = '' }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="card-head">
          {title && <h2>{title}</h2>}
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Num({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  suffix,
  width = 5,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: ReactNode;
  suffix?: string;
  width?: number;
}) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => setTxt(String(value)), [value]);
  const input = (
    <span className="num">
      <input
        type="number"
        inputMode="decimal"
        value={txt}
        step={step}
        min={min}
        max={max}
        style={{ width: `${width + 3.5}ch` }}
        onChange={(e) => {
          setTxt(e.target.value);
          const n = parseFloat(e.target.value);
          if (!Number.isNaN(n)) {
            let v = n;
            if (min != null) v = Math.max(min, v);
            if (max != null) v = Math.min(max, v);
            onChange(v);
          }
        }}
        onBlur={() => setTxt(String(value))}
      />
      {suffix && <span className="suffix">{suffix}</span>}
    </span>
  );
  return label ? (
    <label className="field">
      <span className="field-label">{label}</span>
      {input}
    </label>
  ) : (
    input
  );
}

export function Text({ value, onChange, label, placeholder, wide }: { value: string; onChange: (v: string) => void; label?: ReactNode; placeholder?: string; wide?: boolean }) {
  const input = <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={wide ? 'wide' : ''} />;
  return label ? (
    <label className={`field ${wide ? 'grow' : ''}`}>
      <span className="field-label">{label}</span>
      {input}
    </label>
  ) : (
    input
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly (T | { value: T; label: string })[];
  label?: ReactNode;
}) {
  const sel = (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
  return label ? (
    <label className="field">
      <span className="field-label">{label}</span>
      {sel}
    </label>
  ) : (
    sel
  );
}

export function Toggle({ checked, onChange, label, title }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; title?: string }) {
  return (
    <label className="toggle" title={title}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Pill({ tone = 'info', children, title }: { tone?: 'info' | 'warn' | 'bad' | 'good' | 'muted'; children: ReactNode; title?: string }) {
  return (
    <span className={`pill pill-${tone}`} title={title}>
      {children}
    </span>
  );
}

export function Meter({ value, max, tone }: { value: number; max: number; tone?: 'good' | 'warn' | 'bad' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const t = tone ?? (pct >= 100 ? 'good' : pct >= 50 ? 'warn' : 'bad');
  return (
    <span className="meter" role="meter" aria-valuenow={value} aria-valuemax={max}>
      <span className={`meter-fill meter-${t}`} style={{ width: `${pct}%` }} />
    </span>
  );
}

export function ExhaustionBadge({ level }: { level: number }) {
  if (level <= 0) return <Pill tone="muted">Exh 0</Pill>;
  return <Pill tone={level >= 4 ? 'bad' : 'warn'}>{level >= 6 ? 'Dead' : `Exh ${level}`}</Pill>;
}

export function Rule({ children }: { children: ReactNode }) {
  return <p className="rule">{children}</p>;
}
