import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: any) => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  isSubmitting?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'warning',
  requiresInput = false,
  inputLabel = 'Justification / Reason',
  inputPlaceholder = 'Enter required operational explanation...',
  isSubmitting = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requiresInput && !inputValue.trim()) {
      setInputError('This field is mandatory for operational auditing.');
      return;
    }
    setInputError('');
    await onConfirm(inputValue.trim());
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: ShieldAlert,
          iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          btn: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          btn: 'bg-amber-600 hover:bg-amber-500 text-white focus:ring-amber-500',
        };
      default:
        return {
          icon: ShieldCheck,
          iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          btn: 'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500',
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${styles.iconColor}`}>
              <Icon size={22} />
            </div>
            <div>
              <h3 id="dialog-title" className="text-base font-semibold text-zinc-100 tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Audit-logged zero-trust operational command</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 text-xs text-zinc-300 leading-relaxed bg-zinc-950/50 p-3.5 rounded-lg border border-zinc-800/80">
          {description}
        </div>

        {/* Optional Input */}
        {requiresInput && (
          <div className="mt-4">
            <label className="block text-xs font-mono font-medium text-zinc-400 mb-1.5">
              {inputLabel} <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (inputError) setInputError('');
              }}
              placeholder={inputPlaceholder}
              disabled={isSubmitting}
              className="w-full text-xs font-mono px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
            />
            {inputError && <p className="mt-1 text-[11px] text-rose-400 font-mono">{inputError}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${styles.btn} ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Recording Audit...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
