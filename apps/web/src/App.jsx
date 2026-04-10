
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

// Pages
import HomePage from '@/pages/HomePage.jsx';
import EmprestimosPage from '@/pages/EmprestimosPage.jsx';
import CartoesPage from '@/pages/CartoesPage.jsx';
import FinanciamentoPage from '@/pages/FinanciamentoPage.jsx';
import FerramentasPage from '@/pages/FerramentasPage.jsx';
import DiagnosticoPage from '@/pages/DiagnosticoPage.jsx';
import BlogPage from '@/pages/BlogPage.jsx';
import SobreNosPage from '@/pages/SobreNosPage.jsx';
import ContatoPage from '@/pages/ContatoPage.jsx';
import PoliticaPrivacidadePage from '@/pages/PoliticaPrivacidadePage.jsx';
import TermosUsoPage from '@/pages/TermosUsoPage.jsx';
import SeoLandingPage from '@/pages/SeoLandingPage.jsx';
import CoteFinanceAIPage from '@/pages/CoteFinanceAIPage.jsx';
import MotionHeroPage from '@/pages/MotionHeroPage.jsx';

import { Toaster } from '@/components/ui/sonner';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const seoPagesData = [
    {
      path: "/emprestimo-para-negativado",
      title: "Empréstimo para Negativado: Compare e Consiga Crédito - Cote Juros",
      description: "Conseguir empréstimo com nome sujo é possível. Compare opções com garantia ou consignado e encontre as menores taxas.",
      heading: "Empréstimo para Negativado Seguro e Online",
      content: [
        "Estar negativado não significa que você não pode ter acesso a crédito. Muitas instituições financeiras oferecem linhas específicas para quem está com restrições no CPF, embora as taxas de juros costumem ser mais elevadas para compensar o risco.",
        "As modalidades mais comuns para negativados são o empréstimo consignado (descontado na folha de pagamento), que possui as menores taxas do mercado, e o empréstimo com garantia de veículo ou imóvel.",
        "Antes de fechar negócio, tome cuidado com fraudes: nenhuma instituição financeira séria cobra valores antecipados para liberar crédito. Use nosso comparador para encontrar opções confiáveis e seguras."
      ],
      type: "loans"
    },
    {
      path: "/cartao-sem-anuidade",
      title: "Melhores Cartões de Crédito Sem Anuidade - Cote Juros",
      description: "Não pague taxas! Compare e solicite os melhores cartões de crédito sem anuidade com limite alto e aprovação na hora.",
      heading: "Cartões Sem Anuidade para o seu Perfil",
      content: [
        "Pagar anuidade de cartão de crédito é coisa do passado. Com a ascensão dos bancos digitais, diversas instituições oferecem cartões totalmente isentos de tarifas e com excelentes benefícios.",
        "Além da economia anual, muitos desses cartões oferecem programas de cashback, descontos em parceiros, cartões virtuais para compras seguras online e controle total via aplicativo.",
        "Para escolher o melhor, avalie quais benefícios fazem sentido para a sua rotina. Utilize nossa ferramenta gratuita para comparar as opções disponíveis e solicitar o seu agora mesmo."
      ],
      type: "cards"
    }
  ];

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/emprestimos" element={<AppLayout><EmprestimosPage /></AppLayout>} />
        <Route path="/cartoes-de-credito" element={<AppLayout><CartoesPage /></AppLayout>} />
        <Route path="/financiamento" element={<AppLayout><FinanciamentoPage /></AppLayout>} />
        <Route path="/ferramentas" element={<AppLayout><FerramentasPage /></AppLayout>} />
        <Route path="/diagnostico-financeiro" element={<AppLayout><DiagnosticoPage /></AppLayout>} />
        <Route path="/blog" element={<AppLayout><BlogPage /></AppLayout>} />
        <Route path="/sobre-nos" element={<AppLayout><SobreNosPage /></AppLayout>} />
        <Route path="/contato" element={<AppLayout><ContatoPage /></AppLayout>} />
        <Route path="/politica-de-privacidade" element={<AppLayout><PoliticaPrivacidadePage /></AppLayout>} />
        <Route path="/termos-de-uso" element={<AppLayout><TermosUsoPage /></AppLayout>} />
        <Route path="/cote-finance-ai" element={<AppLayout><CoteFinanceAIPage /></AppLayout>} />
        <Route path="/motion-hero" element={<AppLayout><MotionHeroPage /></AppLayout>} />
        
        {/* Dynamic SEO Pages */}
        {seoPagesData.map(page => (
          <Route 
            key={page.path} 
            path={page.path} 
            element={
              <AppLayout>
                <SeoLandingPage 
                  title={page.title}
                  description={page.description}
                  heading={page.heading}
                  content={page.content}
                  type={page.type}
                />
              </AppLayout>
            } 
          />
        ))}

        {/* Fallback Catch-all Route for the rest of SEO pages */}
        {[
          '/emprestimo-online', '/emprestimo-rapido', '/cartao-com-milhas', 
          '/como-aumentar-score', '/melhores-emprestimos', '/melhores-cartoes'
        ].map(path => (
          <Route 
            key={path} 
            path={path} 
            element={
              <AppLayout>
                <SeoLandingPage 
                  title="Conteúdo Especializado - Cote Juros"
                  description="Encontre a melhor oferta financeira para o seu perfil. Compare taxas e economize."
                  heading="Descubra a melhor opção para você"
                  content={[
                    "A Cote Juros analisa dezenas de instituições financeiras para entregar a melhor oferta para o seu bolso.",
                    "Comparamos as taxas, prazos e condições para que você possa tomar a melhor decisão, sem complicação e 100% grátis."
                  ]}
                  type="all"
                />
              </AppLayout>
            } 
          />
        ))}

        <Route path="*" element={
          <AppLayout>
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <h1 className="mb-4 text-foreground">Página não encontrada</h1>
              <p className="text-foreground-secondary text-lg mb-8">A página que você está procurando não existe ou foi movida.</p>
              <a href="/" className="text-primary font-bold hover:underline">Voltar para o Início</a>
            </div>
          </AppLayout>
        } />
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  );
}

export default App;
