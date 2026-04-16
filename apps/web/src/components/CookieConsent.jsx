import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cotejuros_cookie_consent';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      setIsVisible(window.localStorage.getItem(STORAGE_KEY) !== 'accepted');
    } catch {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // Consent still closes if storage is unavailable.
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <div className="cookie-consent-icon" aria-hidden="true">
        <span />
      </div>
      <div className="cookie-consent-copy">
        <strong>Usamos cookies</strong>
        <p>
          Utilizamos cookies para melhorar sua experiência, analisar navegação e manter o site funcionando com segurança.
          Veja nossa <Link to="/politica-de-privacidade">Política de Privacidade</Link>.
        </p>
      </div>
      <button type="button" className="cookie-consent-button" onClick={acceptCookies}>
        Aceitar cookies
      </button>
    </div>
  );
}
