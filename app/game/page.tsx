"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, Check, Clock3, Home, Play, RefreshCcw, Shuffle, Square, Wand2 } from "lucide-react";
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

const chineseNumbers: Record<string, number> = {
  一: 1,
  二: 2,
  兩: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10
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
  const comboText = `${action}${bodyPart}，持續 ${duration}。`;

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

function parseTimeValue(value: string): number | null {
  if (/^\d+$/.test(value)) return Number(value);
  if (value === "十") return 10;
  if (value.startsWith("十")) return 10 + (chineseNumbers[value.slice(1)] ?? 0);
  if (value.endsWith("十")) return (chineseNumbers[value.slice(0, 1)] ?? 0) * 10;
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (chineseNumbers[tens] ?? 1) * 10 + (chineseNumbers[ones] ?? 0);
  }
  return chineseNumbers[value] ?? null;
}

function parseTimerSeconds(text: string): number | null {
  const match = text.match(/(\d+|[一二兩三四五六七八九十]{1,3})\s*(秒|分鐘)/);
  if (!match) return null;

  const amount = parseTimeValue(match[1]);
  if (!amount) return null;

  return match[2] === "分鐘" ? amount * 60 : amount;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function playTimerSound(kind: "start" | "end") {
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const audio = new AudioContextClass();
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.connect(audio.destination);

  const playTone = (frequency: number, start: number, duration: number) => {
    const oscillator = audio.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + duration);
  };

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "start" ? 0.22 : 0.72));

  if (kind === "start") {
    playTone(660, now, 0.18);
  } else {
    playTone(660, now, 0.18);
    playTone(880, now + 0.2, 0.2);
    playTone(1046, now + 0.42, 0.24);
  }

  window.setTimeout(() => void audio.close(), kind === "start" ? 350 : 900);
}

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isComboOnly = searchParams.get("mode") === "combo";
  const initialLevel = useMemo(() => normalizeLevel(searchParams.get("level")), [searchParams]);
  const [currentLevel, setCurrentLevel] = useState<Level>(initialLevel);
  const [card, setCard] = useState<DisplayCard | null>(null);
  const timerSeconds = useMemo(() => (card ? parseTimerSeconds(card.displayText) : null), [card]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
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

  useEffect(() => {
    setRemainingSeconds(timerSeconds);
    setIsTimerRunning(false);
  }, [card?.id, timerSeconds]);

  useEffect(() => {
    if (!isTimerRunning || remainingSeconds === null) return;

    if (remainingSeconds <= 0) {
      setIsTimerRunning(false);
      playTimerSound("end");
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemainingSeconds((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [isTimerRunning, remainingSeconds]);

  const startTimer = () => {
    if (!timerSeconds) return;
    setRemainingSeconds((current) => (current === null || current <= 0 ? timerSeconds : current));
    setIsTimerRunning(true);
    playTimerSound("start");
  };

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
                {timerSeconds ? (
                  <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-black/25 p-4">
                    <div className="flex items-center gap-3">
                      <Clock3 aria-hidden="true" className="text-gold" size={22} />
                      <div>
                        <p className="text-xs text-stone-400">計時</p>
                        <p className="text-3xl font-semibold text-stone-50">
                          {formatTime(remainingSeconds ?? timerSeconds)}
                        </p>
                      </div>
                    </div>
                    <button
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold px-4 text-sm font-semibold text-stone-950 active:scale-[0.98] disabled:opacity-60"
                      disabled={isTimerRunning}
                      onClick={startTimer}
                      type="button"
                    >
                      <Play aria-hidden="true" size={16} />
                      {isTimerRunning ? "計時中" : remainingSeconds === 0 ? "再一次" : "開始"}
                    </button>
                  </div>
                ) : null}
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
