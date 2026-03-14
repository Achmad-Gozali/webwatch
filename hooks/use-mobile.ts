// PATH: hooks/use-mobile.ts  ← rename dari .tsx ke .ts (tidak ada JSX)
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Fix: initial undefined → hindari hydration mismatch SSR vs client
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}