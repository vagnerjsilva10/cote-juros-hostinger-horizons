import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight } from 'lucide-react';

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
  const [desiredAmount, setDesiredAmount] = useState('R$ 12.000');
  const [monthlyIncome, setMonthlyIncome] = useState('R$ 4.500');
  const [isNegative, setIsNegative] = useState(true);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!focusSignal) return;

    setIsHighlighted(true);
    window.setTimeout(() => setIsHighlighted(false), 1400);

    if (firstInputRef.current) {
      firstInputRef.current.focus();
      firstInputRef.current.select();
    }
  }, [focusSignal]);

  const trustItems = useMemo(() => ['Sem compromisso', 'Sem cobrança para começar'], []);

  return (
    <motion.div
      id="hero-credit-preview"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className={`hero-simulation-card hero-preview-panel relative overflow-hidden rounded-[22px] border border-border bg-white p-5 sm:p-6 ${isHighlighted ? 'hero-preview-active' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent)]" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/75">Veja caminhos possíveis</p>
            <h3 className="mt-1.5 text-[1rem] font-medium text-slate-900">Comece pelo essencial</h3>
          </div>
          <div className="rounded-full border border-primary/10 bg-primary/[0.04] px-2.5 py-1 text-[11px] font-medium text-primary">
            30%
          </div>
        </div>

        <div className="hero-progress-shell">
          <motion.div
            className="hero-progress-bar"
            initial={{ width: 0 }}
            animate={{ width: '30%' }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="hero-preview-field">
            <span className="hero-preview-label">Valor desejado</span>
            <input
              ref={firstInputRef}
              type="text"
              inputMode="numeric"
              value={desiredAmount}
              onChange={(event) => setDesiredAmount(formatCurrency(event.target.value))}
              className="hero-preview-input"
              aria-label="Valor desejado"
            />
          </label>

          <label className="hero-preview-field">
            <span className="hero-preview-label">Renda mensal</span>
            <input
              type="text"
              inputMode="numeric"
              value={monthlyIncome}
              onChange={(event) => setMonthlyIncome(formatCurrency(event.target.value))}
              className="hero-preview-input"
              aria-label="Renda mensal"
            />
          </label>
        </div>

        <div className="hero-preview-field">
          <div className="flex items-center justify-between gap-4">
            <span className="hero-preview-label mb-0">Negativado?</span>

            <div className="hero-toggle-shell" role="tablist" aria-label="Negativado">
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
                Não
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {trustItems.map((item) => (
            <div key={item} className="flex items-center gap-2 text-[13px] text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
              {item}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="hero-preview-cta flex h-12 w-full items-center justify-center gap-2 rounded-[12px] text-sm font-medium text-white"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default CreditHeroPreview;
