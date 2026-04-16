import React from 'react';
import { Link } from 'react-router-dom';

class BlogRouteBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[blog-route-boundary]', error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="page-shell py-16 md:py-20">
        <div className="mx-auto max-w-2xl rounded-[24px] border border-border bg-white p-8 text-center shadow-[var(--shadow-sm)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Blog Cote Juros</p>
          <h1 className="mt-4 text-3xl text-foreground">Não foi possível carregar este conteúdo</h1>
          <p className="mt-3 text-base text-muted-foreground">
            A rota encontrou um erro inesperado. O restante do portal segue estável, e você pode tentar abrir o artigo novamente.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center justify-center rounded-[12px] bg-[#111827] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Tentar novamente
            </button>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center rounded-[12px] border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background-secondary"
            >
              Voltar para o blog
            </Link>
          </div>
        </div>
      </section>
    );
  }
}

export default BlogRouteBoundary;

