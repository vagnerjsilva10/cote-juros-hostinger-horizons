import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cotejuros_cookie_consent';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      setIsVisible(!window.localStorage.getItem(STORAGE_KEY));
    } catch {
      setIsVisible(true);
    }
  }, []);

  const closeConsent = (value) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Consent still closes if storage is unavailable.
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Política de cookies">
      <div className="cookie-consent-icon" aria-hidden="true">
        <span />
      </div>
      <div className="cookie-consent-copy">
        <strong>Política de cookies</strong>
        <p>
          Usamos cookies essenciais para manter o site seguro e, com seu consentimento, cookies de análise para melhorar sua experiência.
          Veja a <Link to="/politica-de-privacidade">Política de Privacidade</Link> e os <Link to="/termos-de-uso">Termos de Uso</Link>.
        </p>
      </div>
      <div className="cookie-consent-actions">
        <button type="button" className="cookie-consent-button secondary" onClick={() => closeConsent('rejected')}>
          Recusar
        </button>
        <button type="button" className="cookie-consent-button" onClick={() => closeConsent('accepted')}>
          Aceitar cookies
        </button>
      </div>
    </div>
  );
}
