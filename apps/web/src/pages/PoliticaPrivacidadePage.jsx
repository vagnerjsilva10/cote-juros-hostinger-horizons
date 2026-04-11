import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/PageHero.jsx';

function PoliticaPrivacidadePage() {
  const sections = [
    ['Introdução', 'A Cote Juros está comprometida com o tratamento responsável de dados pessoais e com uma comunicação clara sobre como essas informações são utilizadas.'],
    ['Coleta', 'Podemos coletar dados de identificação, informações financeiras fornecidas pelo usuário, dados de navegação e dados relacionados a simulações realizadas na plataforma.'],
    ['Uso', 'As informações são utilizadas para gerar comparações mais aderentes, melhorar a experiência da plataforma, apoiar comunicações relevantes e cumprir exigências legais.'],
    ['Compartilhamento', 'Não vendemos dados pessoais. O compartilhamento ocorre apenas quando necessário para operação, parceiros autorizados ou obrigação legal.'],
    ['Direitos', 'O usuário pode solicitar acesso, correção, exclusão, revogação de consentimento e outros direitos previstos em lei.'],
    ['Contato', 'Em caso de dúvidas, entre em contato pelo e-mail privacidade@cotejuros.com.br.']
  ];

  return (
    <>
      <Helmet>
        <title>Política de privacidade - Cote Juros</title>
      </Helmet>

      <PageHero
        badge="Privacidade"
        title="Uma política de privacidade tão clara quanto a interface."
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

export default PoliticaPrivacidadePage;
