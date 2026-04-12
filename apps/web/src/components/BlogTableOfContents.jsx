import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function BlogTableOfContents({ items = [] }) {
  if (!items.length) return null;

  return (
    <Card className="border-border bg-white">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          <h2 className="text-base text-foreground">Neste artigo</h2>
        </div>
        <ol className="space-y-3 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="transition-colors hover:text-primary">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default BlogTableOfContents;
