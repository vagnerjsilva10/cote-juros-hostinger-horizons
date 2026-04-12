import { useEffect } from 'react';

const ADSENSE_SCRIPT_ID = 'cj-adsense-script';
const ADSENSE_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2873725911890738';

export function AdSenseScript() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(ADSENSE_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.src = ADSENSE_SRC;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-cj-adsense', 'true');
    document.head.appendChild(script);
  }, []);

  return null;
}

export default AdSenseScript;
