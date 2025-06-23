'use client';

import { useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';

export function UrlParamEffects() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const referralCodeFromUrl = searchParams.get('ref');
    if (referralCodeFromUrl) {
      if (
        referralCodeFromUrl.length > 3 &&
        referralCodeFromUrl.length < 50 &&
        /^[a-zA-Z0-9-_]+$/.test(referralCodeFromUrl)
      ) {
        try {
          localStorage.setItem('referral_code', referralCodeFromUrl);
          console.log(
            `[UrlParamEffects] Referral code "${referralCodeFromUrl}" from URL saved to localStorage.`
          );
        } catch (error) {
          console.error(
            '[UrlParamEffects] Error saving referral code from URL to localStorage:',
            error
          );
        }
      } else {
        console.warn(
          `[UrlParamEffects] Invalid referral code format in URL: "${referralCodeFromUrl}". Not saving.`
        );
      }
    }
  }, [searchParams, pathname]);

  return null; // This component does not render any UI itself
}
