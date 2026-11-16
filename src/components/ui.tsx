import React from 'react';
import { cn } from '../lib/utils';
import { Check } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* বাটন                                                                       */
/* -------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-orange-500 text-black hover:bg-orange-400 active:scale-[0.985] shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset] font-semibold',
  secondary: 'bg-zinc-800 text-zinc-50 hover:bg-zinc-700 border border-white/10',
  ghost: 'text-zinc-300 hover:text-white hover:bg-white/5',
  outline: 'border border-white/15 text-zinc-100 hover:bg-white/5 hover:border-white/25',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150',
      'disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]',
      BUTTON_VARIANTS[variant],
      BUTTON_SIZES[size],
      fullWidth && 'w-full',
      className
    )}
  >
    {loading && (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )}
    {children}
  </button>
);

/* -------------------------------------------------------------------------- */
/* কার্ড                                                                      */
/* -------------------------------------------------------------------------- */

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div
    {...rest}
    className={cn(
      'rounded-2xl border border-white/[0.08] bg-zinc-900/40 backdrop-blur-sm',
      className
    )}
  >
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/* ইনপুট                                                                      */
/* -------------------------------------------------------------------------- */

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** shows a green tick when the field value is valid */
  valid?: boolean;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, valid, className, id, ...rest }, ref) => {
    const inputId = id || rest.name || label;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[12.5px] font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            {...rest}
            className={cn(
              'w-full rounded-xl border bg-zinc-950/60 pl-3.5 text-sm text-zinc-100 placeholder:text-zinc-600',
              'h-11 transition-colors focus:border-orange-500/70 focus:outline-none focus:ring-1 focus:ring-orange-500/30',
              error ? 'border-red-500/60' : valid ? 'border-emerald-500/50 pr-10' : 'border-white/10',
              className
            )}
          />
          {valid && !error && (
            <span className="pointer-events-none absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 animate-fade-in">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          )}
        </div>
        {error ? (
          <p className="text-[11.5px] text-red-400">{error}</p>
        ) : hint ? (
          <p className="text-[11.5px] text-zinc-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Field.displayName = 'Field';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, hint, error, className, id, ...rest }, ref) => {
    const inputId = id || rest.name || label;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[12.5px] font-medium text-zinc-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          {...rest}
          className={cn(
            'w-full resize-none rounded-xl border bg-zinc-950/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600',
            'transition-colors focus:border-orange-500/70 focus:outline-none focus:ring-1 focus:ring-orange-500/30',
            error ? 'border-red-500/60' : 'border-white/10',
            className
          )}
        />
        {error ? (
          <p className="text-[11.5px] text-red-400">{error}</p>
        ) : hint ? (
          <p className="text-[11.5px] text-zinc-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
>(({ label, className, children, ...rest }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-[12.5px] font-medium text-zinc-300">{label}</label>}
    <select
      ref={ref}
      {...rest}
      className={cn(
        'h-11 w-full appearance-none rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 text-sm text-zinc-100',
        'transition-colors focus:border-orange-500/70 focus:outline-none focus:ring-1 focus:ring-orange-500/30',
        className
      )}
    >
      {children}
    </select>
  </div>
));
Select.displayName = 'Select';

/* -------------------------------------------------------------------------- */
/* ব্যাজ                                                                      */
/* -------------------------------------------------------------------------- */

type BadgeTone = 'neutral' | 'orange' | 'green' | 'red' | 'blue' | 'amber';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-white/[0.06] text-zinc-300 border-white/10',
  orange: 'bg-orange-500/12 text-orange-300 border-orange-500/25',
  green: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
  red: 'bg-red-500/12 text-red-300 border-red-500/25',
  blue: 'bg-sky-500/12 text-sky-300 border-sky-500/25',
  amber: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
};

export const Badge: React.FC<{
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}> = ({ tone = 'neutral', className, children }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5',
      BADGE_TONES[tone],
      className
    )}
  >
    {children}
  </span>
);

/* -------------------------------------------------------------------------- */
/* মোডাল                                                                      */
/* -------------------------------------------------------------------------- */

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ open, onClose, title, description, children, footer, size = 'md' }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0e0e11] shadow-2xl animate-slide-up sm:rounded-2xl',
          widths[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            {title && <h3 className="truncate text-base font-semibold text-white">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-white/[0.06] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* খালি অবস্থা                                                                */
/* -------------------------------------------------------------------------- */

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
    {icon && <div className="mb-3 text-zinc-600">{icon}</div>}
    <p className="text-sm font-medium text-zinc-200">{title}</p>
    {description && <p className="mt-1 max-w-sm text-xs text-zinc-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* -------------------------------------------------------------------------- */
/* টোস্ট                                                                      */
/* -------------------------------------------------------------------------- */

export const Toast: React.FC<{ message: string | null; tone?: 'success' | 'error' }> = ({
  message,
  tone = 'success',
}) => {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex justify-center px-4 sm:bottom-8">
      <div
        className={cn(
          'animate-slide-up rounded-xl border px-4 py-2.5 text-sm shadow-2xl backdrop-blur-md',
          tone === 'success'
            ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
            : 'border-red-500/30 bg-red-950/90 text-red-200'
        )}
      >
        {message}
      </div>
    </div>
  );
};
