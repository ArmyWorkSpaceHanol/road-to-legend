import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function usePagination(total: number, resetKey: string, size = 10) {
  const [position, setPosition] = useState({ key: resetKey, page: 1 });
  // Reset on every filter transition, including returning to an earlier filter.
  if (position.key !== resetKey) setPosition({ key: resetKey, page: 1 });
  const pages = Math.max(1, Math.ceil(total / size));
  const page = position.key === resetKey ? Math.min(position.page, pages) : 1;
  return {
    page,
    pages,
    start: (page - 1) * size,
    size,
    setPage: (next: number) =>
      setPosition({ key: resetKey, page: Math.max(1, Math.min(next, pages)) }),
  };
}

export default function Pagination({
  page,
  pages,
  total,
  size,
  onChange,
  label,
}: {
  page: number;
  pages: number;
  total: number;
  size: number;
  onChange: (page: number) => void;
  label: string;
}) {
  if (!total) return null;
  return (
    <nav className="pagination" aria-label={label}>
      <span className="pagination-count" aria-live="polite">
        {(page - 1) * size + 1}–{Math.min(page * size, total)} / {total}개
      </span>
      <div>
        <button
          type="button"
          aria-label={`${label} 이전 페이지`}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
          .map((n, i, list) => (
            <span key={n}>
              {i > 0 && n - list[i - 1] > 1 && <span className="pagination-gap">…</span>}
              <button
                type="button"
                aria-label={`${label} ${n}페이지`}
                aria-current={n === page ? 'page' : undefined}
                onClick={() => onChange(n)}
              >
                {n}
              </button>
            </span>
          ))}
        <button
          type="button"
          aria-label={`${label} 다음 페이지`}
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </nav>
  );
}
