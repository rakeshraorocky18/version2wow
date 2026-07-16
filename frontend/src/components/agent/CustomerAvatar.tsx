import { getCustomerInitials } from '../../lib/agent/customerAvatar';

type CustomerAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
};

/**
 * Circular customer avatar — shows profile photo when available, otherwise initials.
 */
export default function CustomerAvatar({
  name,
  imageUrl,
  size = 64,
  className = '',
}: CustomerAvatarProps) {
  const initials = getCustomerInitials(name);
  const sizeStyle = { width: size, height: size };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={sizeStyle}
        className={`rounded-full object-cover border border-pink-100/80 shadow-sm flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={sizeStyle}
      className={`rounded-full bg-gradient-to-br from-wow-primary to-wow-primary-light text-white font-semibold flex items-center justify-center flex-shrink-0 border border-pink-100/80 shadow-sm ${className}`}
      aria-label={name}
    >
      <span style={{ fontSize: Math.max(12, Math.round(size * 0.35)) }}>{initials}</span>
    </div>
  );
}
