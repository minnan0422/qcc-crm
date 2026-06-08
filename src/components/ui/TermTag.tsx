import { useTerm } from '@/hooks/useTerms';
import { StatusTag } from './StatusTag';

// 通过字典翻译 term_id 并按语义取色（§9.4 + §4.2）
export function TermTag({ id, dot = true }: { id?: number | null; dot?: boolean }) {
  const term = useTerm();
  if (id == null) return <span className="text-text-faint">—</span>;
  return <StatusTag kind={term.kind(id)} label={term.name(id)} dot={dot} />;
}

export function TermTags({ ids }: { ids?: number[] }) {
  if (!ids || ids.length === 0) return <span className="text-text-faint">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <TermTag key={id} id={id} dot={false} />
      ))}
    </span>
  );
}

export function TermText({ id }: { id?: number | null }) {
  const term = useTerm();
  return <span>{term.name(id)}</span>;
}
