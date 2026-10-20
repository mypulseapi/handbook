import { FileClock } from 'lucide-react';
import { historyUrl, lastModified } from '@/lib/doc-history';
import type { Language } from '@/lib/i18n';

/**
 * When this page last changed, and a way to read everything that changed before that.
 *
 * Renders nothing when git has no date for the file, which happens for an untracked page and in
 * a shallow checkout. Showing nothing is correct there; a fabricated date would read as fact.
 */
export function PageHistory({ contentPath, lang }: { contentPath: string; lang: Language }) {
  const iso = lastModified(contentPath);
  if (!iso) return null;

  const label = lang === 'vi' ? 'Cập nhật lần cuối' : 'Last updated';
  const linkLabel = lang === 'vi' ? 'Xem lịch sử thay đổi' : 'View change history';
  const formatted = new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));

  return (
    <div className="text-fd-muted-foreground mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-6 text-sm">
      <span>
        {label} <time dateTime={iso}>{formatted}</time>
      </span>
      <a
        href={historyUrl(contentPath)}
        rel="noreferrer noopener"
        target="_blank"
        className="hover:text-fd-accent-foreground inline-flex items-center gap-1.5 underline underline-offset-4"
      >
        <FileClock className="size-3.5" />
        {linkLabel}
      </a>
    </div>
  );
}
