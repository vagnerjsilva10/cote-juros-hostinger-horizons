import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ArticleCoverImage from '@/components/blog/ArticleCoverImage.jsx';
import { getArticlePath, getArticleSummary, getEditorialTitle, normalizeArticleData } from '@/lib/content/articles.js';

function BlogArticleCard({
  article,
  image,
  formatDate,
  compact = false,
  className,
  label = 'Ler artigo'
}) {
  const safeArticle = normalizeArticleData(article);
  const href = getArticlePath(safeArticle);
  const title = getEditorialTitle(safeArticle);

  return (
    <Link
      to={href}
      className={cn(
        'blog-article-card group block h-full rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        className
      )}
    >
      <Card className="blog-article-card-shell surface-card relative flex h-full flex-col overflow-hidden border-border transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)] group-focus-visible:border-primary/30">
        <ArticleCoverImage
          article={{ ...safeArticle, coverImage: image || safeArticle.coverImage }}
          className="blog-article-card-cover w-full"
          aspectRatio="16 / 10"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <CardContent className={cn('blog-article-card-content flex flex-1 flex-col gap-4', compact ? 'p-5' : 'p-6 md:p-7')}>
          <div className="blog-article-card-meta flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="max-w-full truncate">{safeArticle.category}</Badge>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {safeArticle.readTime || safeArticle.readingTime || 6} min
            </span>
          </div>

          <div className="blog-article-card-copy space-y-3">
            <h3 className={cn('blog-article-card-title text-balance text-foreground transition-colors group-hover:text-primary', compact ? 'text-lg' : 'text-xl')}>
              {title}
            </h3>
            <p className={cn('blog-article-card-summary text-muted-foreground', compact ? 'line-clamp-3 text-sm leading-6' : 'line-clamp-3 leading-7')}>
              {getArticleSummary(safeArticle)}
            </p>
          </div>

          <div className="blog-article-card-footer mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatDate(safeArticle.publishedAt)}
            </span>
            <span className="blog-article-card-link inline-flex items-center gap-2 font-medium text-primary">
              {label}
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default BlogArticleCard;
