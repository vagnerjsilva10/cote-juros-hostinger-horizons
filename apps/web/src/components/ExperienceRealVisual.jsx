function ExperienceRealVisual({ tag = 'Comparação real' }) {
  return (
    <div className="experience-visual">
      <div className="experience-panel-shell">
        <img
          src="/images/experience-panel-premium.png"
          alt="Painel visual de comparação de crédito"
          className="experience-panel-image"
        />
        <div className="experience-floating-badge">
          <span className="experience-floating-dot" />
          {tag}
        </div>
      </div>
    </div>
  );
}

export default ExperienceRealVisual;
