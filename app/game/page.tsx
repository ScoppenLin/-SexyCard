"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, Check, Home, RefreshCcw, Shuffle, Square, Wand2 } from "lucide-react";
import cardsData from "@/data/cards.json";
import actions from "@/data/actions.json";
import bodyParts from "@/data/bodyParts.json";
import durations from "@/data/durations.json";

type Level = 1 | 2 | 3;

type Card = {
  id: string;
  level: Level;
  mode: string;
  type: string;
  title: string;
  text: string;
  tags: string[];
};

type DisplayCard = Card & {
  displayText: string;
  comboText?: string;
};

type GameStats = {
  level: Level;
  totalDraws: number;
  completed: number;
  skipped: number;
  swapped: number;
  startedAt: string;
  endedAt?: string;
};

const cards = cardsData as unknown as Card[];

const levelNames: Record<Level, string> = {
  1: "暖身模式",
  2: "升溫模式",
  3: "火辣模式"
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildDisplayCard(card: Card): DisplayCard {
  if (card.type !== "combo") {
    return { ...card, displayText: card.text };
  }

  const action = randomItem(actions);
  const bodyPart = randomItem(bodyParts);
  const duration = randomItem(durations);
  const comboText = `${action}${bodyPart}，持續 ${duration}。過程中任一方都可以調整、暫停或跳過。`;

  return {
    ...card,
    displayText: comboText,
    comboText
  };
}

function drawCard(level: Level, previousId?: string): DisplayCard {
  const pool = cards.filter((card) => card.level === level && card.type !== "combo");
  const candidates = pool.length > 1 ? pool.filter((card) => card.id !== previousId) : pool;
  return buildDisplayCard(randomItem(candidates));
}

function drawComboCard(previousId?: string): DisplayCard {
  const pool = cards.filter((card) => card.type === "combo");
  const candidates = pool.length > 1 ? pool.filter((card) => card.id !== previousId) : pool;
  return buildDisplayCard(randomItem(candidates));
}

function normalizeLevel(value: string | null): Level {
  if (value === "2") return 2;
  if (value === "3") return 3;
  return 1;
}

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isComboOnly = searchParams.get("mode") === "combo";
  const initialLevel = useMemo(() => normalizeLevel(searchParams.get("level")), [searchParams]);
  const [currentLevel, setCurrentLevel] = useState<Level>(initialLevel);
  const [card, setCard] = useState<DisplayCard | null>(null);
  const [stats, setStats] = useState<GameStats>({
    level: initialLevel,
    totalDraws: 0,
    completed: 0,
    skipped: 0,
    swapped: 0,
    startedAt: new Date().toISOString()
  });

  const pullCard = useCallback((level: Level, previousId?: string) => {
    const nextCard = isComboOnly ? drawComboCard(previousId) : drawCard(level, previousId);
    setCard(nextCard);
    setStats((current) => ({
      ...current,
      level,
      totalDraws: current.totalDraws + 1
    }));
  }, [isComboOnly]);

  useEffect(() => {
    pullCard(initialLevel);
  }, [initialLevel, pullCard]);

  useEffect(() => {
    window.localStorage.setItem("velvetCards.currentGame", JSON.stringify(stats));
  }, [stats]);

  const complete = () => {
    setStats((current) => ({ ...current, completed: current.completed + 1 }));
    pullCard(currentLevel, card?.id);
  };

  const skip = () => {
    setStats((current) => ({ ...current, skipped: current.skipped + 1 }));
    pullCard(currentLevel, card?.id);
  };

  const swap = () => {
    setStats((current) => ({ ...current, swapped: current.swapped + 1 }));
    pullCard(currentLevel, card?.id);
  };

  const lowerLevel = () => {
    const nextLevel = currentLevel === 3 ? 2 : 1;
    setCurrentLevel(nextLevel);
    pullCard(nextLevel, card?.id);
  };

  const endGame = () => {
    const finalStats = { ...stats, endedAt: new Date().toISOString() };
    window.localStorage.setItem("velvetCards.lastGame", JSON.stringify(finalStats));
    router.push("/summary");
  };

  return (
    <main className="safe-screen px-4 py-4">
      <section className="mx-auto flex min-h-[calc(100svh-32px)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between gap-3 py-2">
          <Link
            aria-label="回首頁"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/15 bg-stone-950/70 text-gold"
            href="/"
          >
            <Home aria-hidden="true" size={20} />
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold/75">
              {isComboOnly ? "Combo" : `Level ${currentLevel}`}
            </p>
            <h1 className="text-lg font-semibold text-stone-50">
              {isComboOnly ? "組合牌模式" : levelNames[currentLevel]}
            </h1>
          </div>
          <button
            aria-label="結束遊戲"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-red-300/20 bg-red-950/30 text-red-100"
            onClick={endGame}
            type="button"
          >
            <Square aria-hidden="true" size={17} />
          </button>
        </header>

        <div className="grid grid-cols-4 gap-2 py-3 text-center">
          <Stat label="抽卡" value={stats.totalDraws} />
          <Stat label="完成" value={stats.completed} />
          <Stat label="跳過" value={stats.skipped} />
          <Stat label="換牌" value={stats.swapped} />
        </div>

        <article className="my-4 flex flex-1 flex-col justify-between rounded-[1.75rem] border border-gold/25 bg-gradient-to-br from-stone-950 via-plum to-velvet p-6 shadow-card">
          {card ? (
            <>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-gold">
                    {card.type === "combo" ? "Combo" : card.type}
                  </span>
                  {card.tags.slice(0, 2).map((tag) => (
                    <span className="rounded-full bg-stone-50/10 px-3 py-1 text-xs text-stone-300" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mt-8 text-4xl font-semibold leading-tight text-stone-50">{card.title}</h2>
                <p className="mt-7 text-2xl font-medium leading-relaxed text-stone-100">{card.displayText}</p>
              </div>
              <p className="mt-8 border-t border-gold/15 pt-5 text-sm leading-6 text-stone-300">
                保持可溝通。任何一方不舒服時，這張牌自動改成擁抱、喝水或休息。
              </p>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-stone-300">抽牌中...</div>
          )}
        </article>

        <div className="grid grid-cols-2 gap-3 pb-3">
          <ActionButton icon={Check} label="完成" onClick={complete} tone="gold" />
          <ActionButton icon={Shuffle} label="跳過" onClick={skip} tone="dark" />
          <ActionButton icon={RefreshCcw} label="換一張" onClick={swap} tone="dark" />
          <ActionButton
            icon={isComboOnly ? Wand2 : ArrowDown}
            label={isComboOnly ? "組合中" : "降一級"}
            onClick={lowerLevel}
            tone="dark"
            disabled={isComboOnly || currentLevel === 1}
          />
        </div>

        <button
          className="mb-2 min-h-12 rounded-2xl border border-red-300/25 bg-red-950/35 px-5 text-base font-semibold text-red-50 active:scale-[0.99]"
          onClick={endGame}
          type="button"
        >
          結束遊戲
        </button>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gold/12 bg-stone-950/50 px-2 py-3">
      <p className="text-lg font-semibold text-stone-50">{value}</p>
      <p className="mt-1 text-xs text-stone-400">{label}</p>
    </div>
  );
}

function ActionButton({
  disabled,
  icon: Icon,
  label,
  onClick,
  tone
}: {
  disabled?: boolean;
  icon: ElementType;
  label: string;
  onClick: () => void;
  tone: "gold" | "dark";
}) {
  const toneClass =
    tone === "gold"
      ? "border-gold/30 bg-gradient-to-br from-gold to-[#8f6528] text-stone-950"
      : "border-gold/15 bg-stone-950/65 text-stone-100";

  return (
    <button
      className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-base font-semibold shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35 ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" size={19} />
      {label}
    </button>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<main className="safe-screen px-5 py-6 text-stone-100">載入中...</main>}>
      <GameContent />
    </Suspense>
  );
}
