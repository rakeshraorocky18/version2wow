import { Lock, UserRound } from 'lucide-react';

interface Props {
  className?: string;
  label?: string;
  compact?: boolean;
}

export default function ProfilePhotoLocked({ className = '', label, compact = false }: Props) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#F9EEF5] to-[#F3EEFF] ${className}`}
    >
      <div className={`relative flex items-center justify-center rounded-full bg-white/80 shadow-inner ${compact ? 'h-14 w-14' : 'h-20 w-20'}`}>
        <UserRound size={compact ? 28 : 40} className="text-[#D4A8BC]" strokeWidth={1.2} />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#B66A8A] text-white shadow-md">
          <Lock size={12} />
        </span>
      </div>
      {!compact && (
        <p className="mt-3 max-w-[140px] text-center text-xs font-medium leading-relaxed text-[#9A5776]">
          {label || 'Photo visible after mutual match'}
        </p>
      )}
    </div>
  );
}
