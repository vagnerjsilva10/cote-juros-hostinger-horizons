import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHero from '@/components/PageHero.jsx';
import SeoHead from '@/components/SeoHead.jsx';
import { brandPages, homeBreadcrumb } from '@/seo/brandSeo.js';

const questions = [
  {
    question: 'A Cote Juros empresta dinheiro?',
    answer: 'Não. A Cote Juros não é banco e não concede crédito diretamente. A plataforma ajuda você a comparar caminhos possíveis antes de contratar.'
  },
  {
    question: 'Preciso pagar algo antecipado?',
    answer: 'Não. A Cote Juros não cobra valor antecipado para você iniciar a comparação.'
  },
  {
    question: 'Isso garante aprovação?',
    answer: 'Não. A aprovação depende da análise da instituição financeira responsável pela oferta.'
  },
  {
    question: 'Quais produtos posso comparar?',
    answer: 'Você encontra caminhos para empréstimos, cartões, financiamentos, ferramentas financeiras e conteúdos de apoio à decisão.'
  },
  {
    question: 'Como a Cote Juros ajuda na decisão?',
    answer: 'A plataforma organiza informações de valor, prazo, perfil e custo para reduzir ruído antes do próximo passo.'
  }
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: questions.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
};

function FaqPage() {
  const breadcrumbs = [homeBreadcrumb, { name: 'Perguntas frequentes', path: brandPages.faq.path }];

  return (
    <>
      <SeoHead
        title={brandPages.faq.title}
        description={brandPages.faq.description}
        path={brandPages.faq.path}
        breadcrumbs={breadcrumbs}
        structuredData={[faqSchema]}
      />

      <PageHero
        centered
        breadcrumbs={breadcrumbs}
        badge="Perguntas frequentes"
        title="Respostas diretas para comparar com mais tranquilidade."
        subtitle="Entenda o papel da Cote Juros, o que não prometemos e como seguir sem cobrança antecipada."
      />

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl space-y-4">
            {questions.map((item) => (
              <article key={item.question} className="interactive-card p-6">
                <h2 className="text-xl text-foreground">{item.question}</h2>
                <p className="mt-3 text-base leading-7 text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-start justify-between gap-4 rounded-[20px] border border-border bg-background-secondary p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-foreground">Quer começar pela comparação?</p>
              <p className="mt-1 text-sm text-muted-foreground">Veja opções com mais contexto antes de decidir.</p>
            </div>
            <Link to="/emprestimos">
              <Button>
                Ver minhas opções
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default FaqPage;
