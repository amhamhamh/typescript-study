import type { Block } from '../content/types';
import { CodeBlock } from './CodeBlock';
import { RichText } from './RichText';

const calloutLabel = { tip: '팁', warn: '주의', bridge: '내 경험과 연결' } as const;

/** kind로 분기하면 블록마다 가진 속성이 정확히 좁혀집니다. */
export function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return <p><RichText text={block.text} /></p>;
    case 'list':
      return (
        <ul className="list">
          {block.items.map((item) => (
            <li key={item}><RichText text={item} /></li>
          ))}
        </ul>
      );
    case 'code':
      return <CodeBlock code={block.code} lang={block.lang} title={block.title} />;
    case 'compare':
      return (
        <figure className="compare">
          <div className="compare__grid">
            <CodeBlock code={block.js} lang="jsx" title={block.jsLabel ?? 'JavaScript'} tone="js" />
            <CodeBlock code={block.ts} lang="tsx" title={block.tsLabel ?? 'TypeScript'} tone="ts" />
          </div>
          {block.caption && <figcaption><RichText text={block.caption} /></figcaption>}
        </figure>
      );
    case 'callout':
      return (
        <aside className={`callout callout--${block.tone}`}>
          <p className="callout__label">{calloutLabel[block.tone]}</p>
          <p className="callout__title">{block.title}</p>
          <p><RichText text={block.text} /></p>
        </aside>
      );
    default: {
      // 새 블록 종류를 추가하고 여기서 처리하지 않으면 컴파일 오류가 납니다. (레슨 9)
      const unreachable: never = block;
      return unreachable;
    }
  }
}
