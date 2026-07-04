export default function MatchCardSkeleton() {
  return (
    <article className="dp-member-card dp-member-card--skeleton-rich" aria-hidden>
      <div className="dp-skeleton-block dp-skeleton-block--photo" />
      <div className="dp-skeleton-body">
        <div className="dp-skeleton-line dp-skeleton-line--title" />
        <div className="dp-skeleton-line dp-skeleton-line--sub" />
        <div className="dp-skeleton-line dp-skeleton-line--full" />
        <div className="dp-skeleton-line dp-skeleton-line--full" />
        <div className="dp-skeleton-line dp-skeleton-line--half" />
        <div className="dp-skeleton-tags">
          <span className="dp-skeleton-pill" />
          <span className="dp-skeleton-pill" />
          <span className="dp-skeleton-pill" />
        </div>
      </div>
      <div className="dp-skeleton-block dp-skeleton-block--action" />
    </article>
  );
}
