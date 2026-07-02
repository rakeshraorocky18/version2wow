import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type FooterPaginationContextValue = {
  totalPages: number;
  setTotalPages: (pages: number) => void;
};

const FooterPaginationContext = createContext<FooterPaginationContextValue | null>(null);

export function FooterPaginationProvider({ children }: { children: ReactNode }) {
  const [totalPages, setTotalPages] = useState(1);
  const value = useMemo(() => ({ totalPages, setTotalPages }), [totalPages]);
  return <FooterPaginationContext.Provider value={value}>{children}</FooterPaginationContext.Provider>;
}

export function useFooterPagination() {
  const ctx = useContext(FooterPaginationContext);
  if (!ctx) {
    throw new Error('useFooterPagination must be used within FooterPaginationProvider');
  }
  return ctx;
}
