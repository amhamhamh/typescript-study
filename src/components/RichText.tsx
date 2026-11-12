import type { ReactNode } from 'react';

/** 본문 문자열 안의 `코드`와 **강조** 표기를 요소로 바꿉니다. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  const nodes: ReactNode[] = parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}><RichText text={part.slice(2, -2)} /></strong>;
    }
    return part;
  });
  return <>{nodes}</>;
}
