"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

type AppLang = "zh" | "en" | "id" | "vi" | "ja" | "ko";

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

const languageCodes = new Set<AppLang>(["zh", "en", "id", "vi", "ja", "ko"]);

const copy: Record<AppLang, {
  eyebrow: string;
  title: string;
  body: string;
  replay: string;
  home: string;
  stats: {
    totalDraws: string;
    completed: string;
    skipped: string;
    maleCompleted: string;
    femaleCompleted: string;
    maleSkipped: string;
    femaleSkipped: string;
    completionRate: string;
  };
}> = {
  zh: {
    eyebrow: "Summary",
    title: "今晚的結算",
    body: "這局紀錄已保存在本機瀏覽器。關掉頁面也不會上傳到任何地方。",
    replay: "再玩一局",
    home: "回首頁",
    stats: {
      totalDraws: "總抽卡數",
      completed: "完成數",
      skipped: "跳過數",
      maleCompleted: "男生完成",
      femaleCompleted: "女生完成",
      maleSkipped: "男生跳過",
      femaleSkipped: "女生跳過",
      completionRate: "完成率"
    }
  },
  en: {
    eyebrow: "Summary",
    title: "Tonight's Summary",
    body: "This session is saved only in this browser. Closing the page will not upload it anywhere.",
    replay: "Play again",
    home: "Home",
    stats: {
      totalDraws: "Total draws",
      completed: "Completed",
      skipped: "Skipped",
      maleCompleted: "Male completed",
      femaleCompleted: "Female completed",
      maleSkipped: "Male skipped",
      femaleSkipped: "Female skipped",
      completionRate: "Completion rate"
    }
  },
  id: {
    eyebrow: "Ringkasan",
    title: "Ringkasan malam ini",
    body: "Catatan permainan ini hanya tersimpan di browser ini. Menutup halaman tidak akan mengunggah apa pun.",
    replay: "Main lagi",
    home: "Beranda",
    stats: {
      totalDraws: "Total kartu",
      completed: "Selesai",
      skipped: "Dilewati",
      maleCompleted: "Pria selesai",
      femaleCompleted: "Wanita selesai",
      maleSkipped: "Pria lewati",
      femaleSkipped: "Wanita lewati",
      completionRate: "Tingkat selesai"
    }
  },
  vi: {
    eyebrow: "Tổng kết",
    title: "Tổng kết tối nay",
    body: "Phiên chơi này chỉ được lưu trong trình duyệt hiện tại. Đóng trang sẽ không tải dữ liệu lên đâu cả.",
    replay: "Chơi lại",
    home: "Trang chủ",
    stats: {
      totalDraws: "Tổng lượt rút",
      completed: "Hoàn thành",
      skipped: "Bỏ qua",
      maleCompleted: "Nam hoàn thành",
      femaleCompleted: "Nữ hoàn thành",
      maleSkipped: "Nam bỏ qua",
      femaleSkipped: "Nữ bỏ qua",
      completionRate: "Tỷ lệ hoàn thành"
    }
  },
  ja: {
    eyebrow: "Summary",
    title: "今夜のまとめ",
    body: "この記録はこのブラウザだけに保存されます。ページを閉じてもどこにもアップロードされません。",
    replay: "もう一度",
    home: "ホーム",
    stats: {
      totalDraws: "総カード数",
      completed: "完了数",
      skipped: "スキップ数",
      maleCompleted: "男性完了",
      femaleCompleted: "女性完了",
      maleSkipped: "男性スキップ",
      femaleSkipped: "女性スキップ",
      completionRate: "完了率"
    }
  },
  ko: {
    eyebrow: "Summary",
    title: "오늘 밤 요약",
    body: "이번 기록은 이 브라우저에만 저장됩니다. 페이지를 닫아도 어디에도 업로드되지 않습니다.",
    replay: "다시 하기",
    home: "홈",
    stats: {
      totalDraws: "총 뽑기",
      completed: "완료",
      skipped: "건너뜀",
      maleCompleted: "남성 완료",
      femaleCompleted: "여성 완료",
      maleSkipped: "남성 건너뜀",
      femaleSkipped: "여성 건너뜀",
      completionRate: "완료율"
    }
  }
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

function languageFromLocale(locale?: string | null): AppLang | null {
  const normalized = locale?.toLowerCase() ?? "";
  if (!normalized) return null;
  if (normalized.startsWith("zh")) return "zh";

  const primary = normalized.split(/[-_]/)[0] as AppLang;
  return languageCodes.has(primary) ? primary : null;
}

function detectBrowserLanguage(): AppLang {
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const locale of browserLanguages) {
    const language = languageFromLocale(locale);
    if (language) return language;
  }

  return "en";
}

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
  const [language, setLanguage] = useState<AppLang>("en");

  useEffect(() => {
    setLanguage(detectBrowserLanguage());

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
  const text = copy[language];

  const completionRate = useMemo(() => {
    const decided = completed + skipped;
    if (decided === 0) return 0;
    return Math.round((completed / decided) * 100);
  }, [completed, skipped]);

  return (
    <main className="safe-screen px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-md flex-col justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-gold/80">{text.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-50">{text.title}</h1>
          <p className="mt-4 text-base leading-7 text-stone-300">
            {text.body}
          </p>
        </div>

        <div className="my-8 rounded-[1.75rem] border border-gold/25 bg-stone-950/65 p-5 shadow-card backdrop-blur">
          <div className="grid grid-cols-2 gap-3">
            <SummaryStat label={text.stats.totalDraws} value={stats.totalDraws} />
            <SummaryStat label={text.stats.completed} value={completed} />
            <SummaryStat label={text.stats.skipped} value={skipped} />
            <SummaryStat label={text.stats.maleCompleted} value={stats.maleCompleted} />
            <SummaryStat label={text.stats.femaleCompleted} value={stats.femaleCompleted} />
            <SummaryStat label={text.stats.maleSkipped} value={stats.maleSkipped} />
            <SummaryStat label={text.stats.femaleSkipped} value={stats.femaleSkipped} />
          </div>
          <div className="mt-4 rounded-2xl border border-gold/20 bg-gradient-to-br from-wine/50 to-plum/70 p-5">
            <p className="text-sm text-stone-300">{text.stats.completionRate}</p>
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
            {text.replay}
          </Link>
          <Link
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-gold/15 bg-stone-950/65 px-5 text-base font-semibold text-stone-100 active:scale-[0.99]"
            href="/"
          >
            <Home aria-hidden="true" size={19} />
            {text.home}
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
