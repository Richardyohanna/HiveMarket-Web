import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

type ShareActionsProps = {
  url: string;
  title: string;
  text: string;
  compact?: boolean;
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard access is unavailable in this browser.');
}

export default function ShareActions({ url, title, text, compact = false }: ShareActionsProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buttonClass = compact
    ? 'inline-flex items-center gap-1.5 rounded-lg border border-[var(--hive-border)] px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50'
    : 'inline-flex items-center gap-2 rounded-lg border border-[var(--hive-border)] px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50';

  async function share() {
    setNotice(null);
    setError(null);
    if (!navigator.share) {
      try {
        await copyText(url);
        setNotice('Sharing is unavailable here. Link copied.');
      } catch {
        setError('Sharing and clipboard access are unavailable. Copy the link below.');
      }
      return;
    }

    try {
      await navigator.share({ title, text, url });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
      setError('Could not open the share interface. Use Copy link instead.');
    }
  }

  async function copyLink() {
    setNotice(null);
    setError(null);
    try {
      await copyText(url);
      setNotice('Link copied to clipboard.');
    } catch {
      setError('Could not access the clipboard. Copy the link below.');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void share()} className={buttonClass} aria-label={`Share ${title}`}>
        <Share2 size={compact ? 15 : 17} /> Share
      </button>
      <button type="button" onClick={() => void copyLink()} className={buttonClass} aria-label={`Copy link to ${title}`}>
        {notice?.includes('copied') ? <Check size={compact ? 15 : 17} /> : <Copy size={compact ? 15 : 17} />}
        Copy link
      </button>
      {(notice || error) && (
        <p role={error ? 'alert' : 'status'} className={`basis-full text-xs ${error ? 'text-red-700' : 'text-green-800'}`}>
          {error || notice}
          {error && <span className="mt-1 block break-all select-all">{url}</span>}
        </p>
      )}
    </div>
  );
}
