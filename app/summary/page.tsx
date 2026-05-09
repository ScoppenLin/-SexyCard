"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

type GameStats = {
  level: 1 | 2 | 3;
  totalDraws: number;
  completed: number;
  skipped: number;
  swapped: number;
  startedAt: string;
  endedAt?: string;
};

const fallbackStats: GameStats = {
  level: 1,
  totalDraws: 0,
  completed: 0,
  skipped: 0,
  swapped: 0,
  startedAt: new Date().toISOString()
};

export default function SummaryPage() {
  const [stats, setStats] = useState<GameStats>(fallbackStats);

  useEffect(() => {
    const saved = window.localStorage.getItem("velvetCards.lastGame");
    if (!saved) return;

    try {
      setStats(JSON.parse(saved) as GameStats);
    } catch {
      setStats(fallbackStats);
    }
  }, []);

  const completionRate = useMemo(() => {
    const decided = stats.completed + stats.skipped;
    if (decided === 0) return 0;
    return Math.round((stats.completed / decided) * 100);
  }, [stats.completed, stats.skipped]);

  return (
    <main className="safe-screen px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-md flex-col justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-gold/80">Summary</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-50">今晚的結算</h1>
          <p className="mt-4 text-base leading-7 text-stone-300">
            這局紀錄已保存在本機瀏覽器。關掉頁面也不會上傳到任何地方。
          </p>
        </div>

        <div className="my-8 rounded-[1.75rem] border border-gold/25 bg-stone-950/65 p-5 shadow-card backdrop-blur">
          <div className="grid grid-cols-2 gap-3">
            <SummaryStat label="總抽卡數" value={stats.totalDraws} />
            <SummaryStat label="完成數" value={stats.completed} />
            <SummaryStat label="跳過數" value={stats.skipped} />
            <SummaryStat label="換牌數" value={stats.swapped} />
          </div>
          <div className="mt-4 rounded-2xl border border-gold/20 bg-gradient-to-br from-wine/50 to-plum/70 p-5">
            <p className="text-sm text-stone-300">完成率</p>
            <p className="mt-2 text-5xl font-semibold text-gold">{completionRate}%</p>
            <div className="mt-4 h-2 rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-3">
          <Link
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold to-[#8f6528] px-5 text-base font-semibold text-stone-950 active:scale-[0.99]"
            href={`/game?level=${stats.level}`}
          >
            <RotateCcw aria-hidden="true" size={19} />
            再玩一局
          </Link>
          <Link
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-gold/15 bg-stone-950/65 px-5 text-base font-semibold text-stone-100 active:scale-[0.99]"
            href="/"
          >
            <Home aria-hidden="true" size={19} />
            回首頁
          </Link>
        </div>
      </section>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gold/12 bg-black/[0.22] p-4">
      <p className="text-3xl font-semibold text-stone-50">{value}</p>
      <p className="mt-2 text-sm text-stone-400">{label}</p>
    </div>
  );
}
