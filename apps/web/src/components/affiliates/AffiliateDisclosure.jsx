import React from 'react';

function AffiliateDisclosure({ text, className = '' }) {
  if (!text) return null;

  return (
    <p className={`text-xs leading-5 text-muted-foreground ${className}`.trim()}>
      {text}
    </p>
  );
}

export default AffiliateDisclosure;
