import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/PageHero.jsx';

function PoliticaPrivacidadePage() {
  const sections = [
    ['Introducao', 'A Cote Juros esta comprometida com o tratamento responsavel de dados pessoais e com uma comunicacao clara sobre como essas informacoes sao utilizadas.'],
    ['Coleta', 'Podemos coletar dados de identificacao, informacoes financeiras fornecidas pelo usuario, dados de navegacao e dados relacionados a simulacoes realizadas na plataforma.'],
    ['Uso', 'As informacoes sao utilizadas para gerar comparacoes mais aderentes, melhorar a experiencia da plataforma, apoiar comunicacoes relevantes e cumprir exigencias legais.'],
    ['Compartilhamento', 'Nao vendemos dados pessoais. O compartilhamento ocorre apenas quando necessario para operacao, parceiros autorizados ou obrigacao legal.'],
    ['Direitos', 'O usuario pode solicitar acesso, correcao, exclusao, revogacao de consentimento e outros direitos previstos em lei.'],
    ['Contato', 'Em caso de duvidas, entre em contato pelo e-mail privacidade@cotejuros.com.br.']
  ];

  return (
    <>
      <Helmet>
        <title>Politica de privacidade - Cote Juros</title>
      </Helmet>

      <PageHero
        badge="Privacidade"
        title="Uma politica de privacidade tao clara quanto a interface."
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

export default PoliticaPrivacidadePage;
