import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/PageHero.jsx';

function TermosUsoPage() {
  const sections = [
    ['Aceitacao', 'Ao acessar a plataforma, o usuario concorda com estes termos e com o uso adequado dos recursos disponibilizados.'],
    ['Servicos', 'A Cote Juros oferece comparacao de produtos financeiros, simulacoes, conteudo educativo e direcionamento para parceiros.'],
    ['Responsabilidades do usuario', 'O usuario deve fornecer informacoes verdadeiras, proteger seus acessos e utilizar a plataforma de forma licita.'],
    ['Limites da plataforma', 'A Cote Juros nao concede credito diretamente e nao substitui a verificacao final junto as instituicoes financeiras.'],
    ['Propriedade intelectual', 'Conteudos, estrutura visual, marca e tecnologia da plataforma sao protegidos por direitos aplicaveis.'],
    ['Contato', 'Para duvidas sobre os termos, escreva para legal@cotejuros.com.br.']
  ];

  return (
    <>
      <Helmet>
        <title>Termos de uso - Cote Juros</title>
      </Helmet>

      <PageHero
        badge="Termos"
        title="Termos de uso apresentados com a mesma objetividade visual."
        subtitle={`Ultima atualizacao: ${new Date().toLocaleDateString('pt-BR')}`}
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
