import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPhotoUrl } from '../../lib/profileUtils';

type Props = {
  photos: string[];
  alt: string;
  gender?: string;
  lazy?: boolean;
};

export default function ProfilePhotoCarousel({ photos, alt, gender, lazy = true }: Props) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const hasMultiple = count > 1;

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  if (count === 0) {
    return (
      <div className="dp-photo-carousel__placeholder">
        <span>{gender === 'female' ? '👩' : '👨'}</span>
      </div>
    );
  }

  return (
    <div className="dp-photo-carousel">
      <img
        src={getPhotoUrl(photos[index])}
        alt={alt}
        className="dp-photo-carousel__img"
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />
      {hasMultiple && (
        <>
          <button
            type="button"
            className="dp-photo-carousel__nav dp-photo-carousel__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="dp-photo-carousel__nav dp-photo-carousel__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>
          <div className="dp-photo-carousel__dots">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`dp-photo-carousel__dot${i === index ? ' is-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
