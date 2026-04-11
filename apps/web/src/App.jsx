import React, { useEffect, useState } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

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

import AdminAuthGuard from '@/admin/AdminAuthGuard.jsx';
import AdminLayout from '@/admin/AdminLayout.jsx';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage.jsx';
import AdminOffersPage from '@/pages/admin/AdminOffersPage.jsx';
import AdminBanksPage from '@/pages/admin/AdminBanksPage.jsx';
import AdminPartnersPage from '@/pages/admin/AdminPartnersPage.jsx';
import AdminArticlesPage from '@/pages/admin/AdminArticlesPage.jsx';
import AdminSeoPagesPage from '@/pages/admin/AdminSeoPagesPage.jsx';
import AdminLeadsPage from '@/pages/admin/AdminLeadsPage.jsx';
import AdminTestimonialsPage from '@/pages/admin/AdminTestimonialsPage.jsx';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage.jsx';

import { seoFallbackPaths as seedFallbackPaths, seoPages as seedSeoPages } from '@/platform/seed/portalSeed.js';
import { portalApi } from '@/platform/services/portalApi.js';
import { Toaster } from '@/components/ui/sonner';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AdminRoute({ title, children }) {
  return (
    <AdminAuthGuard>
      <AdminLayout title={title}>{children}</AdminLayout>
    </AdminAuthGuard>
  );
}

function App() {
  const [seoPages, setSeoPages] = useState(seedSeoPages);
  const [seoFallbackPaths, setSeoFallbackPaths] = useState(seedFallbackPaths);

  useEffect(() => {
    Promise.all([portalApi.getSeoPages(), portalApi.getSeoFallbackPaths()])
      .then(([pages, fallbackPaths]) => {
        if (Array.isArray(pages) && pages.length) setSeoPages(pages);
        if (Array.isArray(fallbackPaths) && fallbackPaths.length) setSeoFallbackPaths(fallbackPaths);
      })
      .catch(() => {
        // keep seed fallback
      });
  }, []);

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

        <Route path="/admin/login" element={<AdminAuthGuard />} />
        <Route path="/admin" element={<AdminRoute title="Dashboard"><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/offers" element={<AdminRoute title="Offer Management"><AdminOffersPage /></AdminRoute>} />
        <Route path="/admin/banks" element={<AdminRoute title="Bank Management"><AdminBanksPage /></AdminRoute>} />
        <Route path="/admin/partners" element={<AdminRoute title="Partner Management"><AdminPartnersPage /></AdminRoute>} />
        <Route path="/admin/articles" element={<AdminRoute title="Article Management"><AdminArticlesPage /></AdminRoute>} />
        <Route path="/admin/seo-pages" element={<AdminRoute title="SEO Page Management"><AdminSeoPagesPage /></AdminRoute>} />
        <Route path="/admin/leads" element={<AdminRoute title="Lead Management"><AdminLeadsPage /></AdminRoute>} />
        <Route path="/admin/testimonials" element={<AdminRoute title="Testimonials"><AdminTestimonialsPage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute title="Settings"><AdminSettingsPage /></AdminRoute>} />

        {seoPages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={
              <AppLayout>
                <SeoLandingPage
                  title={page.title}
                  description={page.description}
                  heading={page.heroCopy || page.heading}
                  content={Array.isArray(page.content) ? page.content : [page.description].filter(Boolean)}
                  type={page.type}
                />
              </AppLayout>
            }
          />
        ))}

        {seoFallbackPaths.map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <AppLayout>
                <SeoLandingPage
                  title="Conteudo Especializado - Cote Juros"
                  description="Encontre a melhor oferta financeira para o seu perfil. Compare taxas e economize."
                  heading="Descubra a melhor opcao para voce"
                  content={[
                    'A Cote Juros analisa dezenas de instituicoes financeiras para entregar a melhor oferta para o seu bolso.',
                    'Comparamos taxas, prazos e condicoes para que voce tome a melhor decisao de forma gratuita.'
                  ]}
                  type="all"
                />
              </AppLayout>
            }
          />
        ))}

        <Route
          path="*"
          element={
            <AppLayout>
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <h1 className="mb-4 text-foreground">Pagina nao encontrada</h1>
                <p className="text-slate-600 text-lg mb-8">A pagina que voce esta procurando nao existe ou foi movida.</p>
                <a href="/" className="text-primary font-bold hover:underline">Voltar para o Inicio</a>
              </div>
            </AppLayout>
          }
        />
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  );
}

export default App;
