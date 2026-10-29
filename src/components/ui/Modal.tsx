import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600';
export const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60 transition-colors';
export const ghostBtn =
  'inline-flex items-center justify-center gap-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors';

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-[11px] text-slate-500 mt-1 block">{hint}</span>}
    </label>
  );
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{message}</div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
         onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title}
           className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
      <div className="mx-auto w-11 h-11 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-3">{icon}</div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">{text}</p>
      {action}
    </div>
  );
}
