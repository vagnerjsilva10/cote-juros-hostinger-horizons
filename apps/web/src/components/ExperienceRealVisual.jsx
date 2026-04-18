function ExperienceRealVisual({ tag = 'Comparação real', t = (value) => value }) {
  return (
    <div className="editorial-visual-panel experience-panel" aria-hidden="true">
      <div className="experience-grid" />
      <div className="experience-sheen" />

      <div className="editorial-browser-bar experience-window-bar">
        <span />
        <span />
        <span />
      </div>

      <div className="experience-card experience-card-primary">
        <span className="experience-label">{t('valor desejado')}</span>
        <strong>R$ 12.000</strong>
        <div className="experience-progress">
          <div className="experience-progress-fill" />
        </div>
      </div>

      <div className="experience-side-stack">
        <div className="experience-card experience-card-profile">
          <span className="experience-label">{t('perfil')}</span>
          <strong>claro</strong>
        </div>

        <div className="experience-card experience-card-cost">
          <span className="experience-label">{t('custo')}</span>
          <strong>visível</strong>
        </div>
      </div>

      <div className="experience-chart">
        <div className="experience-chart-surface" />
        <svg className="experience-chart-svg" viewBox="0 0 640 220" preserveAspectRatio="none">
          <defs>
            <linearGradient id="experienceLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8E96FF" />
              <stop offset="55%" stopColor="#6676FF" />
              <stop offset="100%" stopColor="#4F61F6" />
            </linearGradient>
            <linearGradient id="experienceArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(107, 120, 255, 0.18)" />
              <stop offset="100%" stopColor="rgba(107, 120, 255, 0)" />
            </linearGradient>
            <filter id="experienceGlow" x="-30%" y="-80%" width="160%" height="260%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            className="experience-chart-area"
            d="M28,174 C92,174 132,150 194,138 C262,124 318,104 384,84 C454,62 520,70 612,44 L612,214 L28,214 Z"
          />
          <path
            className="experience-chart-line-glow"
            d="M28,174 C92,174 132,150 194,138 C262,124 318,104 384,84 C454,62 520,70 612,44"
            fill="none"
          />
          <path
            className="experience-chart-line"
            d="M28,174 C92,174 132,150 194,138 C262,124 318,104 384,84 C454,62 520,70 612,44"
            fill="none"
            stroke="url(#experienceLine)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line className="experience-chart-guide" x1="612" y1="44" x2="612" y2="194" />
          <circle className="experience-chart-dot-halo" cx="612" cy="44" r="14" />
          <circle className="experience-chart-dot" cx="612" cy="44" r="6.5" />
        </svg>

        <div className="experience-floating-badge">
          <span className="experience-floating-dot" />
          {tag}
        </div>
      </div>

      <div className="experience-mini-bars">
        <span className="experience-bar experience-bar-1" />
        <span className="experience-bar experience-bar-2" />
        <span className="experience-bar experience-bar-3" />
      </div>
    </div>
  );
}

export default ExperienceRealVisual;
