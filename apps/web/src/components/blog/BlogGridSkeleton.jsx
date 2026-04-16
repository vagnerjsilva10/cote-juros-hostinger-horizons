import React from 'react';

function BlogGridSkeleton({ items = 6 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[24px] border border-border bg-white">
          <div className="h-52 animate-pulse bg-slate-100" />
          <div className="space-y-4 p-6">
            <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="h-6 animate-pulse rounded-[12px] bg-slate-200" />
            <div className="h-5 animate-pulse rounded-[12px] bg-slate-100" />
            <div className="h-5 w-2/3 animate-pulse rounded-[12px] bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default BlogGridSkeleton;
