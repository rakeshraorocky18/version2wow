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

const FLYING_HEARTS = Array.from({ length: 14 }, (_, i) => i);

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
    <footer className="dp-footer">
      <div className="dp-footer__cycle-wrap" aria-hidden>
        <ul className="dp-footer__hearts">
          {FLYING_HEARTS.map((i) => (
            <li
              key={i}
              className={`dp-footer__heart ${i >= 10 ? 'dp-footer__heart--alt' : ''} ${i % 2 === 0 ? 'is-even' : 'is-odd'}`}
              style={{ animationDelay: `${0.2 + i * 0.3}s` }}
            />
          ))}
        </ul>
        <img src="/images/footer-cycle.png" alt="" className="dp-footer__cycle" />
      </div>

      <div className="dp-footer__content">
        {totalPages > 1 && (
          <nav className="dp-pagination" aria-label="Pagination">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className="dp-pagination__nav"
            >
              <ChevronLeft size={18} />
            </button>
            {pageItems.map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="dp-pagination__dots">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  className={`dp-pagination__page ${currentPage === item ? 'is-current' : ''}`}
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
              className="dp-pagination__nav"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}

        <p className="dp-footer__copyright">© 2026 WOW. All rights reserved.</p>
      </div>
    </footer>
  );
}
