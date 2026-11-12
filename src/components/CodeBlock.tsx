import { useMemo } from 'react';
import type { CodeLang } from '../content/types';
import { highlight } from '../lib/highlight';

interface CodeBlockProps {
  code: string;
  lang?: CodeLang;
  title?: string;
  tone?: 'js' | 'ts';
}

export function CodeBlock({ code, lang = 'ts', title, tone }: CodeBlockProps) {
  const html = useMemo(() => highlight(code, lang), [code, lang]);
  return (
    <figure className={`code${tone ? ` code--${tone}` : ''}`}>
      {title && <figcaption className="code__title">{title}</figcaption>}
      <pre tabIndex={0}>
        {/* highlight.js가 HTML 이스케이프를 처리한 결과입니다. */}
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </figure>
  );
}
