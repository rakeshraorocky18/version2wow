import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFooterPagination } from '../context/FooterPaginationContext';

function buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | 'ellipsis')[] = [1];
  if (current > 3) items.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    if (!items.includes(i)) items.push(i);
  }
  if (current < total - 2) items.push('ellipsis');
  if (!items.includes(total)) items.push(total);
  return items;
}

export default function AppFooter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { totalPages } = useFooterPagination();
  const currentPage = Math.min(Math.max(1, Number(searchParams.get('page') || '1')), totalPages);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    const next = new URLSearchParams(searchParams);
    if (nextPage === 1) {
      next.delete('page');
    } else {
      next.set('page', String(nextPage));
    }
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <footer className="datepress-footer relative mt-8 overflow-hidden rounded-2xl border border-[#EEDDE6] bg-gradient-to-r from-[#EEF4F8] via-[#F8F4F7] to-[#FCECF3] px-4 pb-24 pt-6 shadow-[0_12px_32px_-24px_rgba(118,54,82,0.3)] sm:px-6 sm:pb-28">
      <div className="pointer-events-none absolute left-0 top-0 hidden h-40 w-20 bg-[linear-gradient(180deg,rgba(220,232,242,0.85),transparent)] sm:block" />
      <div className="pointer-events-none absolute right-0 top-0 hidden h-40 w-20 bg-[linear-gradient(180deg,rgba(252,220,233,0.85),transparent)] sm:block" />

      <div className="pointer-events-none absolute bottom-0 right-0 z-[1] hidden h-44 w-56 sm:block">
        <svg viewBox="0 0 320 240" className="h-full w-full" aria-hidden>
          <path d="M120 230 C 185 185, 250 145, 305 55" fill="none" stroke="#2D141C" strokeWidth="5" strokeLinecap="round" />
          {[
            [210, 150], [228, 138], [248, 124], [268, 108], [288, 88], [192, 168], [172, 182], [152, 196],
          ].map((p, idx) => (
            <circle key={idx} cx={p[0]} cy={p[1]} r="5" fill="#D81B60" />
          ))}
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-xl text-center">
        {totalPages > 1 && (
          <div className="mb-4 flex items-center justify-center gap-3 text-sm font-semibold text-[#3B3038]">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className="datepress-page-nav text-[#5D5159] hover:text-[#2D252B] disabled:opacity-30 disabled:hover:text-[#5D5159]"
            >
              <ChevronLeft size={15} />
            </button>
            {pageItems.map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="text-xs text-[#3D3037]">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  className={`datepress-page-pill ${currentPage === item ? 'is-active' : ''}`}
                  aria-current={currentPage === item ? 'page' : undefined}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="datepress-page-nav text-[#5D5159] hover:text-[#2D252B] disabled:opacity-30 disabled:hover:text-[#5D5159]"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        <p className="text-xs text-[#6B5A63]">© 2026 WOW. All rights reserved.</p>
      </div>

      <div className="footer-cycle-track pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-32 overflow-hidden sm:h-36">
        <img src="/images/footer-cycle.png" alt="" aria-hidden className="footer-cycle-scroll" />
      </div>
    </footer>
  );
}
