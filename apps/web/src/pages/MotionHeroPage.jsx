import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowRight, Layers3, Sparkles, SquareDashedBottomCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

function MotionHeroPage() {
  const items = [
    {
      icon: Layers3,
      title: 'Ritmo visual mais calmo',
      copy: 'Uma demonstracao de como movimento sutil pode conviver com uma interface mais silenciosa.'
    },
    {
      icon: SquareDashedBottomCode,
      title: 'Espaco e alinhamento',
      copy: 'Mesmo em paginas experimentais, o sistema agora segue o mesmo contraste e a mesma tipografia.'
    },
    {
      icon: Sparkles,
      title: 'Microinteracoes discretas',
      copy: 'Animacoes curtas, elevacao minima e zero dependencia de cor vibrante.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Motion Hero - Cote Juros</title>
      </Helmet>

      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
        <div className="page-shell relative py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mx-auto max-w-4xl text-center"
          >
            <span className="section-eyebrow mb-6">Motion study</span>
            <h1 className="mx-auto mb-6 max-w-3xl">Uma pagina experimental, agora no mesmo sistema visual do restante do produto.</h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              O objetivo aqui nao e vender demais. E mostrar movimento leve, hierarquia de texto e composicao consistente.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg">
                Ver fluxo principal <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Explorar sistema
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-section bg-background-secondary">
        <div className="page-shell grid gap-5 md:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="rounded-[12px] border border-border bg-white p-8 shadow-[var(--shadow-sm)]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background-secondary">
                <item.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3>{item.title}</h3>
              <p className="mt-3">{item.copy}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

export default MotionHeroPage;
