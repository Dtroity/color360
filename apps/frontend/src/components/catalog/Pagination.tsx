import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

const buildPages = (current: number, total: number): (number | '...')[] => {
  const maxButtons = 7;
  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [];
  const showLeftEllipsis = current > 4;
  const showRightEllipsis = current < total - 3;

  pages.push(1);
  if (showLeftEllipsis) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let p = start; p <= end; p++) pages.push(p);

  if (showRightEllipsis) pages.push('...');
  pages.push(total);

  // Ensure max length
  // If near the start, fill early pages
  if (!showLeftEllipsis) {
    const extraStart = 2;
    while (pages.length < maxButtons - 1 && pages.includes('...')) {
      pages.splice(1, 0, extraStart);
      if (extraStart + 1 >= (typeof pages[pages.length - 2] === 'number' ? (pages[pages.length - 2] as number) : total - 1)) break;
    }
  }
  // If near the end, fill trailing pages
  if (!showRightEllipsis) {
    const lastBeforeTotal = total - 1;
    while (pages.length < maxButtons - 1 && pages.includes('...')) {
      pages.splice(pages.length - 1, 0, lastBeforeTotal);
      if (lastBeforeTotal - 1 <= (typeof pages[1] === 'number' ? (pages[1] as number) : 2)) break;
    }
  }

  return pages.slice(0, maxButtons);
};

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
    onPageChange?.(page);
  };

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  const pages = buildPages(currentPage, totalPages);

  const baseBtn: React.CSSProperties = {
    minWidth: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    border: '1px solid #d9d9d9',
    background: '#fff',
    cursor: 'pointer',
    padding: '0 8px',
  };
  const activeBtn: React.CSSProperties = {
    ...baseBtn,
    borderColor: '#1677ff',
    color: '#1677ff',
    background: '#e6f4ff',
    fontWeight: 600,
  };
  const disabledBtn: React.CSSProperties = {
    ...baseBtn,
    color: '#bfbfbf',
    cursor: 'not-allowed',
    background: '#fafafa',
  };

  return (
    <nav className="catalog-pagination" aria-label="Пагинация" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button type="button" onClick={() => changePage(currentPage - 1)} disabled={prevDisabled} style={prevDisabled ? disabledBtn : baseBtn}>
        Назад
      </button>

      {pages.map((p, idx) => (
        p === '...'
          ? (
            <span key={`dots-${idx}`} style={{ padding: '0 6px', color: '#8c8c8c' }}>…</span>
          )
          : (
            <button
              key={p}
              type="button"
              onClick={() => changePage(p as number)}
              style={p === currentPage ? activeBtn : baseBtn}
            >
              {p}
            </button>
          )
      ))}

      <button type="button" onClick={() => changePage(currentPage + 1)} disabled={nextDisabled} style={nextDisabled ? disabledBtn : baseBtn}>
        Вперед
      </button>
    </nav>
  );
};

export { Pagination };
export default Pagination;
