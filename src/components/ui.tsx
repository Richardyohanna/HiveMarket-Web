import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function PageShell({ title, subtitle, children, maxWidth = 'max-w-md' }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--hive-background)] px-4 py-12 sm:px-6">
      <div className={`mx-auto ${maxWidth}`}>
        <a href="/" className="mb-6 inline-block text-sm font-semibold text-[#008100]">
          ← Back to HiveMarket
        </a>
        <div className="rounded-2xl border border-[var(--hive-border)] bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-[#17191c]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[#4b5158]">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-[#17191c]">{children}</label>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[var(--hive-border)] px-3.5 py-2.5 text-[15px] text-[#17191c] outline-none transition focus:border-[#008100] focus:ring-2 focus:ring-[#008100]/15 disabled:bg-gray-50 ${props.className || ''}`}
    />
  );
}

export function PrimaryButton({
  isLoading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || isLoading}
      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-[#008100] px-4 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#006d24] disabled:cursor-not-allowed disabled:opacity-60 ${props.className || ''}`}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-lg border border-[var(--hive-border)] bg-white px-4 py-2.5 text-[15px] font-semibold text-[#17191c] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 ${props.className || ''}`}
    />
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin text-current ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-800">
      {message}
    </div>
  );
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--hive-background)]">
      <div className="flex items-center gap-3 text-[#4b5158]">
        <Spinner className="h-5 w-5" />
        <span>{label}</span>
      </div>
    </div>
  );
}
