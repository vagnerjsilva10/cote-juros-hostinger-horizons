import React from 'react';

function BlogArticleSkeleton() {
  return (
    <section className="page-shell blog-article-skeleton py-10 md:py-12">
      <div className="space-y-6">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="h-12 w-full max-w-4xl animate-pulse rounded-[18px] bg-slate-200" />
        <div className="h-6 w-full max-w-3xl animate-pulse rounded-[14px] bg-slate-100" />
        <div className="h-[280px] animate-pulse rounded-[24px] bg-slate-100 md:h-[420px]" />
        <div className="blog-article-skeleton-card space-y-4 rounded-[24px] border border-border bg-white p-6 md:p-10">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-5 animate-pulse rounded-[10px] bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BlogArticleSkeleton;
