import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, CheckSquare, Lightbulb, ListChecks, Send, Sparkles, Target } from 'lucide-react';
import { aiApi } from '@/api/crm';
import { useUI } from '@/store/ui';
import { Button } from '@/components/ui/primitives';
import type { AiReport } from '@/types';

// §8 AiPanel：贯穿 线索/客户/商机/合同 详情的统一 AI 助手面板
export function AiPanel({
  businessType,
  businessId,
  stageId,
}: {
  businessType: 0 | 1 | 2 | 3;
  businessId: number;
  stageId?: number;
}) {
  const toast = useUI((s) => s.toast);
  const [report, setReport] = useState<AiReport | null>(null);
  const [converted, setConverted] = useState<Set<string>>(new Set());
  const [chat, setChat] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const gen = useMutation({
    mutationFn: () => aiApi.generate(businessType, businessId, stageId),
    onSuccess: (r) => setReport(r),
  });

  const convert = (id: string, text: string) => {
    setConverted((s) => new Set(s).add(id));
    toast(`已转为待办：${text}`, 'success');
  };

  const ask = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setChat((c) => [...c, { role: 'user', text: q }]);
    setInput('');
    setTimeout(() => {
      setChat((c) => [
        ...c,
        { role: 'ai', text: '基于已生成报告：' + q + ' —— 建议优先推进高优先级行动项，并在 3 日内同步客户决策人。' },
      ]);
    }, 600);
  };

  const c = report?.content;

  return (
    <div className="flex h-full flex-col">
      {/* 生成区 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-[#8B5CF6] text-white">
            <Sparkles size={15} />
          </span>
          <div>
            <div className="text-sm font-semibold text-text">AI 助手</div>
            <div className="text-xs text-text-faint">按当前阶段生成结构化分析</div>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => gen.mutate()} disabled={gen.isPending}>
          <Sparkles size={13} />
          {gen.isPending ? '生成中…' : report ? '重新生成' : '一键生成分析'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!report && !gen.isPending && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-text-weak">
            <Sparkles className="text-text-faint" size={28} />
            <p>点击「一键生成分析」，AI 将输出要点 / 风险 / 建议 / 行动项</p>
          </div>
        )}
        {gen.isPending && (
          <div className="space-y-3">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-20 w-full" />
          </div>
        )}

        {c && (
          <div className="space-y-5">
            <p className="rounded-md bg-primary-weak/60 p-3 text-sm leading-relaxed text-text">{c.summary}</p>

            <Section icon={<ListChecks size={15} className="text-primary" />} title="关键要点">
              <ul className="list-disc space-y-1 pl-5 text-sm text-text-weak">
                {c.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </Section>

            <Section icon={<AlertTriangle size={15} className="text-warning" />} title="风险提示">
              <ul className="list-disc space-y-1 pl-5 text-sm text-text-weak">
                {c.risks.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </Section>

            <Section icon={<Lightbulb size={15} className="text-success" />} title="建议">
              <ul className="list-disc space-y-1 pl-5 text-sm text-text-weak">
                {c.suggestions.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </Section>

            {/* 行动项一键转待办 §8-3 */}
            <Section icon={<Target size={15} className="text-danger" />} title="行动项（可转待办）">
              <div className="space-y-2">
                {c.actionItems.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-text">{a.text}</span>
                    <Button
                      size="sm"
                      variant={converted.has(a.id) ? 'ghost' : 'default'}
                      onClick={() => convert(a.id, a.text)}
                      disabled={converted.has(a.id)}
                    >
                      <CheckSquare size={13} />
                      {converted.has(a.id) ? '已转待办' : '转待办'}
                    </Button>
                  </div>
                ))}
              </div>
            </Section>

            {/* 报告对话 §8-4 */}
            <Section icon={<Send size={15} className="text-primary" />} title="针对报告追问">
              <div className="space-y-2">
                {chat.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === 'user'
                        ? 'ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-1.5 text-sm text-white'
                        : 'max-w-[85%] rounded-lg bg-bg px-3 py-1.5 text-sm text-text'
                    }
                  >
                    {m.text}
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && ask()}
                    placeholder="继续追问，如「下一步怎么推进？」"
                    className="h-9 flex-1 rounded-md border border-border px-3 text-sm outline-none focus:border-primary"
                  />
                  <Button variant="primary" size="md" onClick={ask}>
                    <Send size={14} />
                  </Button>
                </div>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
