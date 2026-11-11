import React from 'react';

interface EducationalTipProps {
  title: string;
  children: React.ReactNode;
  variant?: 'indigo' | 'emerald' | 'amber';
}

export function EducationalTip({
  title,
  children,
  variant = 'indigo',
}: EducationalTipProps) {
  const styles = {
    indigo: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
    emerald: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
    amber: 'bg-amber-50/80 border-amber-200 text-amber-950',
  };

  const badgeStyles = {
    indigo: 'bg-indigo-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-600 text-white',
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${styles[variant]}`}>
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide ${badgeStyles[variant]}`}
        >
          Explicação simples
        </span>
        <div className="space-y-1 text-sm leading-relaxed">
          <p className="font-bold">{title}</p>
          <div className="opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}
