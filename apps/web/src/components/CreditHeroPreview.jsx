import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { normalizeMojibake } from '@/lib/textEncoding.js';

const formatCurrency = (value) => {
  const digits = String(value).replace(/\D/g, '');
  const amount = Number(digits || 0);

  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
};

function CreditHeroPreview({ focusSignal = 0, onContinue }) {
  const t = normalizeMojibake;
  const [desiredAmount, setDesiredAmount] = useState('R$ 12.000');
  const [monthlyIncome, setMonthlyIncome] = useState('R$ 4.500');
  const [isNegative, setIsNegative] = useState(true);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!focusSignal) return;

    setIsHighlighted(true);
    window.setTimeout(() => setIsHighlighted(false), 1200);

    if (firstInputRef.current) {
      firstInputRef.current.focus();
      firstInputRef.current.select();
    }
  }, [focusSignal]);

  const footerItems = useMemo(() => [t('Sem compromisso'), t('Sem cobrança antecipada')], [t]);

  return (
    <motion.div
      id="hero-credit-preview"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.4, 0, 0.2, 1] }}
      className={`hero-card hero-preview-panel relative overflow-hidden ${isHighlighted ? 'hero-preview-active' : ''}`}
    >
      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="hero-preview-step">{t('Simulação inicial')}</p>
            <h3 className="hero-card-title">{t('Veja caminhos possíveis')}</h3>
            <p className="hero-card-subtitle">{t('Preencha o básico para continuar com mais clareza.')}</p>
          </div>
          <div className="hero-preview-badge">1 de 3</div>
        </div>

        <div className="hero-progress-shell">
          <motion.div
            className="hero-progress-bar"
            initial={{ width: 0 }}
            animate={{ width: '36%' }}
            transition={{ duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        <div className="form-stack">
          <label>
            <span className="form-label">Valor desejado</span>
            <input
              ref={firstInputRef}
              type="text"
              inputMode="numeric"
              value={desiredAmount}
              onChange={(event) => setDesiredAmount(formatCurrency(event.target.value))}
              className="form-control"
              aria-label="Valor desejado"
            />
          </label>

          <label>
            <span className="form-label">Renda mensal</span>
            <input
              type="text"
              inputMode="numeric"
              value={monthlyIncome}
              onChange={(event) => setMonthlyIncome(formatCurrency(event.target.value))}
              className="form-control"
              aria-label="Renda mensal"
            />
          </label>

          <div>
            <span className="form-label">Negativado?</span>
            <div className="hero-toggle-shell" role="tablist" aria-label="Nome negativado">
              <button
                type="button"
                onClick={() => setIsNegative(true)}
                className={`hero-toggle-option ${isNegative ? 'is-active' : ''}`}
                aria-pressed={isNegative}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setIsNegative(false)}
                className={`hero-toggle-option ${!isNegative ? 'is-active' : ''}`}
                aria-pressed={!isNegative}
              >
                {t('Não')}
              </button>
            </div>
          </div>
        </div>

        <div className="hero-card-footer">
          {footerItems.map((item) => (
            <div key={item} className="hero-card-benefit">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#16C784]" />
              {item}
            </div>
          ))}
        </div>

        <button type="button" onClick={onContinue} className="submit-btn hero-preview-cta">
          {t('Ver minhas opções agora')}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default CreditHeroPreview;
