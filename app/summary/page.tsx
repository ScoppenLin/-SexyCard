"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

type AppLang = "zh" | "en" | "id" | "vi" | "ja" | "ko";

type GameStats = {
  level: 1 | 2 | 3;
  mode?: "level" | "combo";
  totalDraws: number;
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
  totalDraws: string;
}> = {
  zh: {
    eyebrow: "Summary",
    title: "今晚的結算",
    body: "這局只記錄抽了幾張牌，資料保存在本機瀏覽器，不會上傳到任何地方。",
    replay: "再玩一局",
    home: "回首頁",
    totalDraws: "總抽牌數"
  },
  en: {
    eyebrow: "Summary",
    title: "Tonight's Summary",
    body: "This session only tracks how many cards were drawn. It stays in this browser and is not uploaded anywhere.",
    replay: "Play again",
    home: "Home",
    totalDraws: "Total cards drawn"
  },
  id: {
    eyebrow: "Ringkasan",
    title: "Ringkasan malam ini",
    body: "Sesi ini hanya mencatat jumlah kartu yang diambil. Datanya tetap di browser ini dan tidak diunggah.",
    replay: "Main lagi",
    home: "Beranda",
    totalDraws: "Total kartu"
  },
  vi: {
    eyebrow: "Tổng kết",
    title: "Tổng kết tối nay",
    body: "Phiên này chỉ ghi lại số lá đã rút. Dữ liệu ở trong trình duyệt này và không được tải lên.",
    replay: "Chơi lại",
    home: "Trang chủ",
    totalDraws: "Tổng lá đã rút"
  },
  ja: {
    eyebrow: "Summary",
    title: "今夜のまとめ",
    body: "このセッションでは引いたカード数だけを記録します。データはこのブラウザ内に残り、アップロードされません。",
    replay: "もう一度",
    home: "ホーム",
    totalDraws: "引いたカード数"
  },
  ko: {
    eyebrow: "Summary",
    title: "오늘 밤 요약",
    body: "이번 세션은 뽑은 카드 수만 기록합니다. 데이터는 이 브라우저에만 남고 업로드되지 않습니다.",
    replay: "다시 하기",
    home: "홈",
    totalDraws: "총 뽑은 카드"
  }
};

const fallbackStats: GameStats = {
  level: 1,
  mode: "level",
  totalDraws: 0,
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

  const stats = value as Partial<GameStats>;

  return {
    level: stats.level === 2 || stats.level === 3 ? stats.level : 1,
    mode: stats.mode === "combo" ? "combo" : "level",
    totalDraws: stats.totalDraws ?? 0,
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

  const replayHref = stats.mode === "combo" ? "/game?mode=combo" : `/game?level=${stats.level}`;
  const text = copy[language];

  return (
    <main className="safe-screen px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-md flex-col justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-gold/80">{text.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-50">{text.title}</h1>
          <p className="mt-4 text-base leading-7 text-stone-300">{text.body}</p>
        </div>

        <div className="my-8 rounded-[1.75rem] border border-gold/25 bg-stone-950/65 p-6 text-center shadow-card backdrop-blur">
          <p className="text-sm uppercase tracking-[0.22em] text-stone-400">{text.totalDraws}</p>
          <p className="mt-4 text-7xl font-semibold text-gold">{stats.totalDraws}</p>
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
