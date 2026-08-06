import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ProfilePhotoViewerProps {
  open: boolean;
  imageUrl: string;
  agentName: string;
  onClose: () => void;
}

export default function ProfilePhotoViewer({
  open,
  imageUrl,
  agentName,
  onClose,
}: ProfilePhotoViewerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`${agentName}'s profile picture`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-4 text-white sm:px-7 sm:py-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold sm:text-base">{agentName}</p>
          <p className="text-xs text-white/65">Profile picture</p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="ml-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
          aria-label="Close profile picture"
          title="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <img
        src={imageUrl}
        alt={`${agentName}'s profile picture`}
        className="max-h-[78vh] max-w-[92vw] select-none rounded-2xl object-contain shadow-2xl sm:max-w-[78vw]"
      />

      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white/55">
        Press Esc or click outside to close
      </p>
    </div>
  );
}
