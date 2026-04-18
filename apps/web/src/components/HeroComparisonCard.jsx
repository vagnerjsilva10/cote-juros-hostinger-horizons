import React from 'react';
import { motion } from 'framer-motion';
import { normalizeMojibake } from '@/lib/textEncoding.js';

function HeroComparisonCard() {
  const t = normalizeMojibake;

  return (
    <motion.div
      id="hero-credit-preview"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.4, 0, 0.2, 1] }}
      className="hero-comparison-wrap"
    >
      <div className="hero-comparison-card" aria-hidden="true">
        <div className="hero-comparison-windowbar">
          <span />
          <span />
          <span />
        </div>

        <div className="hero-comparison-top">
          <div className="hero-main-stat">
            <div>
              <span className="hero-label">{t('Valor desejado')}</span>
              <strong className="hero-main-value">R$ 12.000</strong>
            </div>

            <div className="hero-progress">
              <div className="hero-progress-fill" />
            </div>
          </div>

          <div className="hero-side-col">
            <div className="hero-side-stat">
              <span className="hero-label">{t('Perfil')}</span>
              <strong className="hero-side-value">claro</strong>
            </div>

            <div className="hero-side-stat">
              <span className="hero-label">{t('Custo')}</span>
              <strong className="hero-side-value">{t('vis\u00edvel')}</strong>
            </div>
          </div>
        </div>

        <div className="hero-chart-block">
          <div className="hero-chart-grid" />

          <svg className="hero-chart-svg" viewBox="0 0 640 240" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroChartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7a85ff" />
                <stop offset="55%" stopColor="#5b6cff" />
                <stop offset="100%" stopColor="#58c7ff" />
              </linearGradient>
              <linearGradient id="heroChartArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(91,108,255,0.18)" />
                <stop offset="100%" stopColor="rgba(91,108,255,0)" />
              </linearGradient>
            </defs>

            <path
              className="hero-chart-area"
              d="M26,192 C86,192 118,172 176,156 C246,138 302,112 366,92 C432,72 500,72 612,48 L612,238 L26,238 Z"
            />
            <path
              className="hero-chart-path-glow"
              d="M26,192 C86,192 118,172 176,156 C246,138 302,112 366,92 C432,72 500,72 612,48"
            />
            <path
              className="hero-chart-path"
              d="M26,192 C86,192 118,172 176,156 C246,138 302,112 366,92 C432,72 500,72 612,48"
            />
            <circle className="hero-chart-point-ring" cx="612" cy="48" r="16" />
            <circle className="hero-chart-point" cx="612" cy="48" r="8" />
          </svg>

          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span className="hero-badge-text">{t('Compara\u00e7\u00e3o real')}</span>
          </div>
        </div>

        <div className="hero-bottom-pills">
          <span className="hero-bottom-pill pill-lilac" />
          <span className="hero-bottom-pill pill-cyan" />
          <span className="hero-bottom-pill pill-blue" />
        </div>
      </div>
    </motion.div>
  );
}

export default HeroComparisonCard;
