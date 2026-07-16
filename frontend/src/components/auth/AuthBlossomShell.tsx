import type { ReactNode } from 'react';

interface AuthBlossomShellProps {
  children: ReactNode;
}

/** Soft pink cherry-blossom auth backdrop matching the login/signup mockups. */
export default function AuthBlossomShell({ children }: AuthBlossomShellProps) {
  return (
    <div className="auth-blossom-shell relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="auth-blossom-petals pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}
