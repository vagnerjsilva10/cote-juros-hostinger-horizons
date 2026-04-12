import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getArticleSummary, getEditorialTitle, normalizeArticleSlug } from '@/lib/content/articles.js';

function BlogArticleCard({
  article,
  image,
  formatDate,
  compact = false,
  className,
  label = 'Ler artigo'
}) {
  const slug = normalizeArticleSlug(article);
  const href = `/blog/${slug}`;
  const title = getEditorialTitle(article);

  return (
    <Link
      to={href}
      className={cn(
        'group block h-full rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
        className
      )}
    >
      <Card className="surface-card relative h-full overflow-hidden border-border transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)] group-focus-visible:border-primary/35">
        <div className={cn('overflow-hidden bg-slate-100', compact ? 'h-40' : 'h-52')}>
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <CardContent className={cn('flex h-full flex-col gap-4', compact ? 'p-5' : 'p-6 md:p-7')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="max-w-full truncate">{article.category}</Badge>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {article.readTime} min
            </span>
          </div>

          <div className="space-y-3">
            <h3 className={cn('text-balance text-foreground transition-colors group-hover:text-primary', compact ? 'text-lg' : 'text-xl')}>
              {title}
            </h3>
            <p className={cn('text-muted-foreground', compact ? 'line-clamp-3 text-sm leading-6' : 'line-clamp-3 leading-7')}>
              {getArticleSummary(article)}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatDate(article.publishDate)}
            </span>
            <span className="inline-flex items-center gap-2 font-medium text-primary">
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
