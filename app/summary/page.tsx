"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

type GameStats = {
  level: 1 | 2 | 3;
  mode?: "level" | "combo";
  totalDraws: number;
  maleCompleted: number;
  femaleCompleted: number;
  maleSkipped: number;
  femaleSkipped: number;
  startedAt: string;
  endedAt?: string;
};

const fallbackStats: GameStats = {
  level: 1,
  mode: "level",
  totalDraws: 0,
  maleCompleted: 0,
  femaleCompleted: 0,
  maleSkipped: 0,
  femaleSkipped: 0,
  startedAt: new Date().toISOString()
};

function normalizeStats(value: unknown): GameStats {
  if (!value || typeof value !== "object") return fallbackStats;

  const stats = value as Partial<GameStats> & {
    completed?: number;
    skipped?: number;
  };

  const maleCompleted = stats.maleCompleted ?? stats.completed ?? 0;
  const femaleCompleted = stats.femaleCompleted ?? 0;
  const maleSkipped = stats.maleSkipped ?? stats.skipped ?? 0;
  const femaleSkipped = stats.femaleSkipped ?? 0;

  return {
    level: stats.level === 2 || stats.level === 3 ? stats.level : 1,
    mode: stats.mode === "combo" ? "combo" : "level",
    totalDraws: stats.totalDraws ?? 0,
    maleCompleted,
    femaleCompleted,
    maleSkipped,
    femaleSkipped,
    startedAt: stats.startedAt ?? new Date().toISOString(),
    endedAt: stats.endedAt
  };
}

export default function SummaryPage() {
  const [stats, setStats] = useState<GameStats>(fallbackStats);

  useEffect(() => {
    const saved = window.localStorage.getItem("velvetCards.lastGame");
    if (!saved) return;

    try {
      setStats(normalizeStats(JSON.parse(saved)));
    } catch {
      setStats(fallbackStats);
    }
  }, []);

  const completed = stats.maleCompleted + stats.femaleCompleted;
  const skipped = stats.maleSkipped + stats.femaleSkipped;
  const replayHref = stats.mode === "combo" ? "/game?mode=combo" : `/game?level=${stats.level}`;

  const completionRate = useMemo(() => {
    const decided = completed + skipped;
    if (decided === 0) return 0;
    return Math.round((completed / decided) * 100);
  }, [completed, skipped]);

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
            <SummaryStat label="完成數" value={completed} />
            <SummaryStat label="跳過數" value={skipped} />
            <SummaryStat label="男生完成" value={stats.maleCompleted} />
            <SummaryStat label="女生完成" value={stats.femaleCompleted} />
            <SummaryStat label="男生跳過" value={stats.maleSkipped} />
            <SummaryStat label="女生跳過" value={stats.femaleSkipped} />
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
            href={replayHref}
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
