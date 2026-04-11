import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/PageHero.jsx';

function TermosUsoPage() {
  const sections = [
    ['Aceitação', 'Ao acessar a plataforma, o usuário concorda com estes termos e com o uso adequado dos recursos disponibilizados.'],
    ['Serviços', 'A Cote Juros oferece comparação de produtos financeiros, simulações, conteúdo educativo e direcionamento para parceiros.'],
    ['Responsabilidades do usuário', 'O usuário deve fornecer informações verdadeiras, proteger seus acessos e utilizar a plataforma de forma lícita.'],
    ['Limites da plataforma', 'A Cote Juros não concede crédito diretamente e não substitui a verificação final junto às instituições financeiras.'],
    ['Propriedade intelectual', 'Conteúdos, estrutura visual, marca e tecnologia da plataforma são protegidos por direitos aplicáveis.'],
    ['Contato', 'Para dúvidas sobre os termos, escreva para legal@cotejuros.com.br.']
  ];

  return (
    <>
      <Helmet>
        <title>Termos de uso - Cote Juros</title>
      </Helmet>

      <PageHero
        badge="Termos"
        title="Termos de uso apresentados com a mesma objetividade visual."
        subtitle={`Última atualização: ${new Date().toLocaleDateString('pt-BR')}`}
      />

      <section className="page-section bg-background">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl space-y-10">
            {sections.map(([title, copy]) => (
              <div key={title} className="rounded-[16px] border border-border bg-background-secondary p-8">
                <h3 className="mb-3">{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default TermosUsoPage;
