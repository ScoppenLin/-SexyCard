"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  Check,
  Clock3,
  Home,
  Play,
  Plus,
  Settings2,
  Shuffle,
  Square,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import cardsData from "@/data/cards.json";
import defaultActions from "@/data/actions.json";
import defaultBodyParts from "@/data/bodyParts.json";
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
  displayTextEn?: string;
  titleEn?: string;
  comboText?: string;
  comboScore?: number;
};

type GameStats = {
  level: Level;
  mode: "level" | "combo";
  totalDraws: number;
  maleCompleted: number;
  femaleCompleted: number;
  maleSkipped: number;
  femaleSkipped: number;
  startedAt: string;
  endedAt?: string;
};

const cards = cardsData as unknown as Card[];
const comboActionsStorageKey = "velvetCards.comboActions";
const comboBodyPartsStorageKey = "velvetCards.comboBodyParts";
type TimerAudioContext = AudioContext & { webkitAudioContext?: never };
type LocalizedText = string | {
  zh: string;
  en?: string;
  [language: string]: string | undefined;
};

type ComboItem = {
  label: LocalizedText;
  score: number;
};
type LanguageMode = "zh" | "zh-en";
type CardTranslation = {
  title: string;
  text: string;
};

const customComboItemScore = 5;
const languageModeStorageKey = "velvetCards.languageMode";

const levelNames: Record<Level, string> = {
  1: "暖身模式",
  2: "升溫模式",
  3: "火辣模式"
};

const cardTranslations: Record<string, CardTranslation> = {
  "l1-001": {
    title: "Three Things You Like",
    text: "Take turns naming three details you like about your partner tonight. After sharing, give them one slow hug."
  },
  "l1-002": {
    title: "Palm Warmth",
    text: "Hold your partner's hand for 60 seconds. Just look at each other, with no rush to speak."
  },
  "l1-003": {
    title: "Tonight's Boundaries",
    text: "Each person shares one thing they want to try tonight and one thing they want to keep off-limits."
  },
  "l1-004": {
    title: "Move Closer Slowly",
    text: "One person moves closer and stops where the other feels comfortable. Let a nod decide whether to come closer."
  },
  "l1-005": {
    title: "Soft Whisper",
    text: "Move close to your partner's ear and softly say one thing you have wanted to tell them today."
  },
  "l1-006": {
    title: "Scent Exchange",
    text: "Choose a scent or clothing detail on you and invite your partner to come close and notice it for 20 seconds."
  },
  "l1-007": {
    title: "Pause Word",
    text: "Decide tonight's pause word together. If either person says it, everything stops and turns into hugging or talking."
  },
  "l1-008": {
    title: "Shoulder And Neck Ease",
    text: "Relax your partner's shoulders and neck for 90 seconds. Let them adjust the pressure from 1 to 5."
  },
  "l1-009": {
    title: "Eye Contact",
    text: "Look at each other for 30 seconds. When it ends, each person shares the strongest feeling they noticed."
  },
  "l1-010": {
    title: "Warm-Up Combo",
    text: "The system will create a gentle task for you."
  },
  "l1-011": {
    title: "Comfort Score",
    text: "Each person rates their current relaxation from 1 to 5. The lower score gets to request one comfort adjustment."
  },
  "l1-012": {
    title: "Palm Pause",
    text: "Place your hand on your partner's palm for 30 seconds. Let them decide whether to hold, relax, or change position."
  },
  "l1-013": {
    title: "One Moment Of Longing",
    text: "Share the most recent moment when you wanted to be close to your partner. Be as specific as possible."
  },
  "l1-014": {
    title: "Pour Slowly",
    text: "Pour water or prepare a small item for your partner while keeping eye contact and a slow pace."
  },
  "l1-015": {
    title: "Today's Switch",
    text: "Each person shares one thing that would help them relax today. The other person only listens and repeats it back."
  },
  "l1-016": {
    title: "Hair Ends Or Fingertips",
    text: "Choose hair ends or fingertips and give your partner 45 seconds of very light touch."
  },
  "l1-017": {
    title: "Safety Signals",
    text: "Set three short responses together: continue, slower, pause. You can use them directly for every card after this."
  },
  "l1-018": {
    title: "Ten Centimeters Closer",
    text: "Sit ten centimeters closer for 20 seconds, then one person says whether they want to stay, move closer, or move back."
  },
  "l2-001": {
    title: "Only Honesty",
    text: "Say one small thing you want your partner to do more of tonight, and let them choose whether to accept."
  },
  "l2-002": {
    title: "Fingertip Route",
    text: "Use your fingertip to draw a slow route on your partner's arm or back and let them guess the pattern."
  },
  "l2-003": {
    title: "Three Steps Closer",
    text: "Move closer to your partner three times, pausing each time until they give clear consent."
  },
  "l2-004": {
    title: "One Command",
    text: "In a gentle but certain voice, ask your partner to do one simple and comfortable thing."
  },
  "l2-005": {
    title: "Slow Hug",
    text: "Hug your partner from the front or behind for 45 seconds and let your breathing slowly sync."
  },
  "l2-006": {
    title: "Like List",
    text: "Each person names three situations that turn them on more, then the other chooses one to keep talking about."
  },
  "l2-007": {
    title: "Dim The Lights",
    text: "Adjust the lighting, music, or sitting position so the space feels like it belongs only to the two of you."
  },
  "l2-008": {
    title: "Stop At The Edge",
    text: "Choose a comfortable kind of touch, continue for 30 seconds, then stop and let your partner decide whether to continue."
  },
  "l2-009": {
    title: "Tonight's Keywords",
    text: "Each person gives tonight one keyword, such as slow, naughty, sweet, or brave. Combine the two words into tonight's rule."
  },
  "l2-010": {
    title: "Heating-Up Combo",
    text: "The system will create a warmer task for you."
  },
  "l2-011": {
    title: "Preference Exchange",
    text: "Each person shares one pace they like and one they dislike. The other person confirms it in their own words."
  },
  "l2-012": {
    title: "Pause Three Seconds",
    text: "Choose a comfortable way to move closer. After each move, pause for three seconds and let your partner decide the next step."
  },
  "l2-013": {
    title: "Tonight's Tone",
    text: "Ask your partner to choose the tone they want to hear tonight: gentle, certain, playful, or a little naughty."
  },
  "l2-014": {
    title: "Switch The Lead",
    text: "For the next card, the person who is usually less active decides when to start and when to end."
  },
  "l2-015": {
    title: "Over The Fabric",
    text: "Over clothing, choose an agreed spot and stay there for 30 seconds. Let your partner decide pressure and distance."
  },
  "l2-016": {
    title: "One Invitation",
    text: "Use no more than ten words to invite your partner closer. They may accept, modify, or skip."
  },
  "l2-017": {
    title: "Change Position",
    text: "Change your sitting or standing position and look at each other from a new angle for 20 seconds."
  },
  "l2-018": {
    title: "How To Soothe Me",
    text: "Share how you want your partner to comfort you tonight if you become shy or nervous."
  },
  "l3-001": {
    title: "Bold Invitation",
    text: "Say one way you want your partner to lead you tonight, then let them set the timing and pace."
  },
  "l3-002": {
    title: "Temporarily Yours",
    text: "One person closes their eyes for 45 seconds while the other uses only voice to guide comfortable movement or stillness."
  },
  "l3-003": {
    title: "No Escaping",
    text: "Your partner asks three intimate questions and you answer honestly. Any question can be skipped with the pause word."
  },
  "l3-004": {
    title: "Unbearably Slow",
    text: "Choose an agreed intimate touch and slow it to half your usual speed for 60 seconds."
  },
  "l3-005": {
    title: "A Naughtier Name",
    text: "Each person chooses one nickname or form of address they accept tonight, only during the game."
  },
  "l3-006": {
    title: "Three-Minute Rule",
    text: "For the next three minutes, one person decides the pace. The other can say slower, pause, or continue at any time."
  },
  "l3-007": {
    title: "Countdown By The Ear",
    text: "Move close to your partner's ear and count slowly from 10 to 1, leaving a little silence between each number."
  },
  "l3-008": {
    title: "Command And Response",
    text: "One person gives an intimate command that is not explicit and can be done immediately. The other may accept, modify, or skip."
  },
  "l3-009": {
    title: "Hot Combo",
    text: "The system will create a bolder task for you."
  },
  "l3-010": {
    title: "Private Combo",
    text: "The system will create a task that belongs only to this moment."
  },
  "l3-011": {
    title: "Lead Declaration",
    text: "One person clearly but gently states the pace they want to lead next. The other confirms whether they accept."
  },
  "l3-012": {
    title: "Close, No Touch",
    text: "Move close enough to feel each other's breath and hold for 30 seconds, without touching yet."
  },
  "l3-013": {
    title: "Only Three Answers",
    text: "Your partner asks three questions about tonight's preferences. You can only answer like it, slower, or skip."
  },
  "l3-014": {
    title: "Ten Seconds In The Dark",
    text: "Dim the lights or close your eyes for 10 seconds. When you open them, name the first reason you want to be closer."
  },
  "l3-015": {
    title: "A Little Naughtier",
    text: "Turn your previous compliment into a bolder version. If your partner laughs, say it again."
  },
  "l3-016": {
    title: "You Call Stop",
    text: "Choose an agreed intimate way to move closer. The receiving person decides when to call stop."
  },
  "l3-017": {
    title: "Voice Only",
    text: "For the next 60 seconds, guide your partner only with your voice, without gestures. Let them choose whether to follow."
  },
  "l3-018": {
    title: "Final Choice",
    text: "Make a bold but adjustable invitation and let your partner keep the final choice."
  },
  "combo-001": {
    title: "Soft Light Combo",
    text: "The system will create an intimate task for you."
  },
  "combo-002": {
    title: "Tipsy Combo",
    text: "The system will create an intimate task for you."
  },
  "combo-003": {
    title: "Signal Combo",
    text: "The system will create an intimate task for you."
  },
  "combo-004": {
    title: "Late Night Combo",
    text: "The system will create an intimate task for you."
  },
  "combo-005": {
    title: "Black Gold Combo",
    text: "The system will create an intimate task for you."
  }
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

function clampScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return customComboItemScore;
  return Math.min(10, Math.max(1, Math.round(value)));
}

function localizedText(value: LocalizedText, language: "zh" | "en" = "zh"): string {
  if (typeof value === "string") return language === "zh" ? value : "";
  return value[language] ?? value.zh ?? "";
}

function comboLabelKey(item: ComboItem): string {
  return localizedText(item.label, "zh") || localizedText(item.label, "en");
}

function readLanguageMode(): LanguageMode {
  try {
    return window.localStorage.getItem(languageModeStorageKey) === "zh" ? "zh" : "zh-en";
  } catch {
    return "zh-en";
  }
}

function normalizeDefaultItems(value: unknown, fallbackScore = customComboItemScore): ComboItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ComboItem | null => {
      if (typeof item === "string") {
        const label = item.trim();
        return label ? { label, score: fallbackScore } : null;
      }

      if (typeof item === "object" && item !== null) {
        const record = item as { label?: unknown; text?: unknown; score?: unknown };
        const rawLabel = record.label ?? record.text ?? "";

        if (typeof rawLabel === "object" && rawLabel !== null) {
          const labelRecord = rawLabel as { zh?: unknown; en?: unknown };
          const zh = String(labelRecord.zh ?? "").trim();
          const en = String(labelRecord.en ?? "").trim();

          return zh || en ? { label: { zh: zh || en, en: en || undefined }, score: clampScore(record.score) } : null;
        }

        const label = String(rawLabel).trim();
        return label ? { label, score: clampScore(record.score) } : null;
      }

      return null;
    })
    .filter((item): item is ComboItem => item !== null);
}

const actionDefaults = normalizeDefaultItems(defaultActions);
const bodyPartDefaults = normalizeDefaultItems(defaultBodyParts);
const durationDefaults = normalizeDefaultItems(durations, 3);

function itemFromLabel(label: string, defaults: ComboItem[]): ComboItem {
  const defaultItem = defaults.find((item) => comboLabelKey(item) === label || localizedText(item.label, "en") === label);
  return defaultItem ?? { label, score: customComboItemScore };
}

function normalizeCustomList(value: unknown, fallback: ComboItem[]): ComboItem[] {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .map((item): ComboItem | null => {
      if (typeof item === "string") {
        const label = item.trim();
        return label ? itemFromLabel(label, fallback) : null;
      }

      if (typeof item === "object" && item !== null && "label" in item) {
        const rawLabel = (item as { label?: unknown }).label;
        const label = typeof rawLabel === "object" && rawLabel !== null
          ? String((rawLabel as { zh?: unknown; en?: unknown }).zh ?? (rawLabel as { en?: unknown }).en ?? "").trim()
          : String(rawLabel ?? "").trim();
        if (!label) return null;

        const defaultItem = fallback.find((candidate) => comboLabelKey(candidate) === label);
        if (defaultItem) return defaultItem;

        if (typeof rawLabel === "object" && rawLabel !== null) {
          const labelRecord = rawLabel as { zh?: unknown; en?: unknown };
          return {
            label: {
              zh: String(labelRecord.zh ?? labelRecord.en ?? "").trim(),
              en: String(labelRecord.en ?? "").trim() || undefined
            },
            score: clampScore((item as { score?: unknown }).score)
          };
        }

        return { label, score: clampScore((item as { score?: unknown }).score) };
      }

      return null;
    })
    .filter((item): item is ComboItem => item !== null);

  const deduped = Array.from(new Map(normalized.map((item) => [comboLabelKey(item), item])).values());

  return deduped.length ? deduped : fallback;
}

function serializeComboItems(items: ComboItem[]): ComboItem[] {
  return items.map((item) => ({ label: item.label, score: item.score }));
}

function readStoredList(key: string, fallback: ComboItem[]): ComboItem[] {
  try {
    return normalizeCustomList(JSON.parse(window.localStorage.getItem(key) ?? "null"), fallback);
  } catch {
    return fallback;
  }
}

function pickProgressiveComboParts(actions: ComboItem[], bodyParts: ComboItem[], durationOptions: ComboItem[], drawIndex: number) {
  const climb = Math.min(18, drawIndex * 0.75);
  const targetScore = 8 + climb + (Math.random() * 7 - 3.5);
  const combinations = actions.flatMap((action) =>
    bodyParts.flatMap((bodyPart) =>
      durationOptions.map((duration) => ({
        action,
        bodyPart,
        duration,
        score: action.score + bodyPart.score + duration.score
      }))
    )
  );
  const weightedCombinations = combinations.map((combination) => {
    const distance = Math.abs(combination.score - targetScore);
    const surpriseBonus = Math.random() < 0.16 ? 2.6 : 1;
    const highScoreLift = 1 + Math.max(0, combination.score - 10) * 0.03;

    return {
      combination,
      weight: (1 / Math.pow(distance + 1, 1.75)) * surpriseBonus * highScoreLift
    };
  });
  const totalWeight = weightedCombinations.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const item of weightedCombinations) {
    cursor -= item.weight;
    if (cursor <= 0) return item.combination;
  }

  return weightedCombinations[weightedCombinations.length - 1].combination;
}

function buildDisplayCard(
  card: Card,
  comboActions = actionDefaults,
  comboBodyParts = bodyPartDefaults,
  drawIndex = 0
): DisplayCard {
  const translation = cardTranslations[card.id];

  if (card.type !== "combo") {
    return { ...card, displayText: card.text, displayTextEn: translation?.text, titleEn: translation?.title };
  }

  const { action, bodyPart, duration, score } = pickProgressiveComboParts(
    comboActions,
    comboBodyParts,
    durationDefaults,
    drawIndex
  );
  const comboText = `${localizedText(action.label)}${localizedText(bodyPart.label)}，持續 ${localizedText(duration.label)}。`;
  const comboTextEn = `${localizedText(action.label, "en")}${localizedText(bodyPart.label, "en")} for ${localizedText(
    duration.label,
    "en"
  )}.`;

  return {
    ...card,
    displayText: comboText,
    displayTextEn: comboTextEn,
    titleEn: translation?.title,
    comboText,
    comboScore: score
  };
}

function drawCard(level: Level, previousId?: string): DisplayCard {
  const pool = cards.filter((card) => card.level === level && card.type !== "combo");
  const candidates = pool.length > 1 ? pool.filter((card) => card.id !== previousId) : pool;
  return buildDisplayCard(randomItem(candidates));
}

function drawComboCard(comboActions: ComboItem[], comboBodyParts: ComboItem[], drawIndex: number, previousId?: string): DisplayCard {
  const pool = cards.filter((card) => card.type === "combo");
  const candidates = pool.length > 1 ? pool.filter((card) => card.id !== previousId) : pool;
  return buildDisplayCard(randomItem(candidates), comboActions, comboBodyParts, drawIndex);
}

function makePreviewDeck(level: Level, isComboOnly: boolean, comboActions: ComboItem[], comboBodyParts: ComboItem[], drawIndex = 0): DisplayCard[] {
  const pool = isComboOnly
    ? cards.filter((previewCard) => previewCard.type === "combo")
    : cards.filter((previewCard) => previewCard.level === level && previewCard.type !== "combo");

  return pool.map((previewCard, index) => buildDisplayCard(previewCard, comboActions, comboBodyParts, drawIndex + index));
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

function createTimerAudioContext(): TimerAudioContext | null {
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  return new AudioContextClass() as TimerAudioContext;
}

function playTimerSound(audio: AudioContext, kind: "start" | "end", startAt = audio.currentTime): OscillatorNode[] {
  const gain = audio.createGain();
  gain.connect(audio.destination);
  const nodes: OscillatorNode[] = [];

  const playTone = (frequency: number, start: number, duration: number) => {
    const oscillator = audio.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + duration);
    nodes.push(oscillator);
  };

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.32, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + (kind === "start" ? 0.22 : 0.72));

  if (kind === "start") {
    playTone(660, startAt, 0.18);
  } else {
    playTone(660, startAt, 0.18);
    playTone(880, startAt + 0.2, 0.2);
    playTone(1046, startAt + 0.42, 0.24);
  }

  return nodes;
}

function playDrawSound(audio: AudioContext, kind: "tick" | "settle") {
  const now = audio.currentTime;
  const gain = audio.createGain();
  const oscillator = audio.createOscillator();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(kind === "tick" ? 520 : 880, now);
  if (kind === "settle") {
    oscillator.frequency.exponentialRampToValueAtTime(1180, now + 0.18);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(kind === "tick" ? 0.08 : 0.16, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "tick" ? 0.08 : 0.28));

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + (kind === "tick" ? 0.09 : 0.3));
}

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isComboOnly = searchParams.get("mode") === "combo";
  const initialLevel = useMemo(() => normalizeLevel(searchParams.get("level")), [searchParams]);
  const [currentLevel, setCurrentLevel] = useState<Level>(initialLevel);
  const [card, setCard] = useState<DisplayCard | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const timerSeconds = useMemo(() => (!isDrawing && card ? parseTimerSeconds(card.displayText) : null), [card, isDrawing]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerAudioRef = useRef<AudioContext | null>(null);
  const drawAudioRef = useRef<AudioContext | null>(null);
  const revealTimeoutsRef = useRef<number[]>([]);
  const scheduledEndSoundRef = useRef<OscillatorNode[]>([]);
  const [comboActions, setComboActions] = useState<ComboItem[]>(actionDefaults);
  const [comboBodyParts, setComboBodyParts] = useState<ComboItem[]>(bodyPartDefaults);
  const comboActionsRef = useRef(actionDefaults);
  const comboBodyPartsRef = useRef(bodyPartDefaults);
  const statsRef = useRef<GameStats | null>(null);
  const hasPulledInitialCardRef = useRef(false);
  const [comboSettingsReady, setComboSettingsReady] = useState(false);
  const [isManagingCombo, setIsManagingCombo] = useState(false);
  const [newAction, setNewAction] = useState("");
  const [newBodyPart, setNewBodyPart] = useState("");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("zh-en");
  const [stats, setStats] = useState<GameStats>({
    level: initialLevel,
    mode: isComboOnly ? "combo" : "level",
    totalDraws: 0,
    maleCompleted: 0,
    femaleCompleted: 0,
    maleSkipped: 0,
    femaleSkipped: 0,
    startedAt: new Date().toISOString()
  });
  statsRef.current = stats;

  const clearRevealTimers = useCallback(() => {
    revealTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    revealTimeoutsRef.current = [];
  }, []);

  const playRevealSound = useCallback((kind: "tick" | "settle") => {
    if (!drawAudioRef.current || drawAudioRef.current.state === "closed") {
      drawAudioRef.current = createTimerAudioContext();
    }

    const audio = drawAudioRef.current;
    if (!audio) return;

    void audio.resume().then(() => playDrawSound(audio, kind)).catch(() => undefined);
  }, []);

  const pullCard = useCallback((level: Level, previousId?: string) => {
    clearRevealTimers();
    const drawIndex = statsRef.current?.totalDraws ?? 0;
    const nextCard = isComboOnly
      ? drawComboCard(comboActionsRef.current, comboBodyPartsRef.current, drawIndex, previousId)
      : drawCard(level, previousId);
    const previewDeck = makePreviewDeck(level, isComboOnly, comboActionsRef.current, comboBodyPartsRef.current, drawIndex);
    const revealSteps = [0, 55, 115, 185, 275, 390, 535, 715, 945, 1240];

    setIsDrawing(true);
    setIsTimerRunning(false);
    setRemainingSeconds(null);

    revealSteps.forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        setCard(randomItem(previewDeck));
        playRevealSound("tick");
      }, delay);
      revealTimeoutsRef.current.push(timeoutId);
    });

    const finalTimeoutId = window.setTimeout(() => {
      setCard(nextCard);
      setStats((current) => ({
        ...current,
        level,
        mode: isComboOnly ? "combo" : "level",
        totalDraws: current.totalDraws + 1
      }));
      setIsDrawing(false);
      playRevealSound("settle");
      revealTimeoutsRef.current = [];
    }, 1620);
    revealTimeoutsRef.current.push(finalTimeoutId);
  }, [clearRevealTimers, isComboOnly, playRevealSound]);

  useEffect(() => {
    const storedActions = readStoredList(comboActionsStorageKey, actionDefaults);
    const storedBodyParts = readStoredList(comboBodyPartsStorageKey, bodyPartDefaults);
    comboActionsRef.current = storedActions;
    comboBodyPartsRef.current = storedBodyParts;
    setComboActions(storedActions);
    setComboBodyParts(storedBodyParts);
    setLanguageMode(readLanguageMode());
    setComboSettingsReady(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(languageModeStorageKey, languageMode);
  }, [languageMode]);

  useEffect(() => {
    if (hasPulledInitialCardRef.current) return;
    if (isComboOnly && !comboSettingsReady) return;
    hasPulledInitialCardRef.current = true;
    pullCard(initialLevel);
  }, [comboSettingsReady, initialLevel, isComboOnly, pullCard]);

  useEffect(() => {
    if (!comboSettingsReady) return;
    comboActionsRef.current = comboActions;
    window.localStorage.setItem(comboActionsStorageKey, JSON.stringify(serializeComboItems(comboActions)));
  }, [comboActions, comboSettingsReady]);

  useEffect(() => {
    if (!comboSettingsReady) return;
    comboBodyPartsRef.current = comboBodyParts;
    window.localStorage.setItem(comboBodyPartsStorageKey, JSON.stringify(serializeComboItems(comboBodyParts)));
  }, [comboBodyParts, comboSettingsReady]);

  useEffect(() => {
    window.localStorage.setItem("velvetCards.currentGame", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    setRemainingSeconds(timerSeconds);
    setIsTimerRunning(false);
    scheduledEndSoundRef.current.forEach((node) => {
      try {
        node.stop();
      } catch {
        // The tone may already have ended.
      }
    });
    scheduledEndSoundRef.current = [];
  }, [card?.id, timerSeconds]);

  useEffect(() => {
    if (!isTimerRunning || remainingSeconds === null) return;

    if (remainingSeconds <= 0) {
      setIsTimerRunning(false);
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemainingSeconds((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [isTimerRunning, remainingSeconds]);

  useEffect(() => {
    return () => {
      clearRevealTimers();
      void timerAudioRef.current?.close();
      void drawAudioRef.current?.close();
    };
  }, [clearRevealTimers]);

  const startTimer = async () => {
    if (!timerSeconds) return;
    if (!timerAudioRef.current || timerAudioRef.current.state === "closed") {
      timerAudioRef.current = createTimerAudioContext();
    }

    const audio = timerAudioRef.current;
    if (audio) {
      await audio.resume();
      playTimerSound(audio, "start");
      scheduledEndSoundRef.current.forEach((node) => {
        try {
          node.stop();
        } catch {
          // The tone may already have ended.
        }
      });
      scheduledEndSoundRef.current = playTimerSound(audio, "end", audio.currentTime + timerSeconds);
    }

    setRemainingSeconds((current) => (current === null || current <= 0 ? timerSeconds : current));
    setIsTimerRunning(true);
  };

  const addCustomItem = (kind: "action" | "bodyPart") => {
    const value = (kind === "action" ? newAction : newBodyPart).trim();
    if (!value) return;

    if (kind === "action") {
      setComboActions((current) =>
        current.some((item) => comboLabelKey(item) === value) ? current : [...current, { label: value, score: customComboItemScore }]
      );
      setNewAction("");
      return;
    }

    setComboBodyParts((current) =>
      current.some((item) => comboLabelKey(item) === value) ? current : [...current, { label: value, score: customComboItemScore }]
    );
    setNewBodyPart("");
  };

  const resetComboItems = (kind: "action" | "bodyPart") => {
    if (kind === "action") {
      setComboActions(actionDefaults);
      setNewAction("");
      return;
    }

    setComboBodyParts(bodyPartDefaults);
    setNewBodyPart("");
  };

  const complete = (player: "male" | "female") => {
    if (isDrawing) return;
    setStats((current) => ({
      ...current,
      maleCompleted: player === "male" ? current.maleCompleted + 1 : current.maleCompleted,
      femaleCompleted: player === "female" ? current.femaleCompleted + 1 : current.femaleCompleted
    }));
    pullCard(currentLevel, card?.id);
  };

  const skip = (player: "male" | "female") => {
    if (isDrawing) return;
    setStats((current) => ({
      ...current,
      maleSkipped: player === "male" ? current.maleSkipped + 1 : current.maleSkipped,
      femaleSkipped: player === "female" ? current.femaleSkipped + 1 : current.femaleSkipped
    }));
    pullCard(currentLevel, card?.id);
  };

  const lowerLevel = () => {
    if (isDrawing) return;
    const nextLevel = currentLevel === 3 ? 2 : 1;
    setCurrentLevel(nextLevel);
    pullCard(nextLevel, card?.id);
  };

  const endGame = () => {
    if (isDrawing) return;
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
              {isComboOnly ? "限制級" : `Level ${currentLevel}`}
            </p>
            <h1 className="text-lg font-semibold text-stone-50">
              {isComboOnly ? "限制級模式" : levelNames[currentLevel]}
            </h1>
          </div>
          <button
            aria-label="結束遊戲"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-red-300/20 bg-red-950/30 text-red-100 disabled:opacity-40"
            disabled={isDrawing}
            onClick={endGame}
            type="button"
          >
            <Square aria-hidden="true" size={17} />
          </button>
        </header>

        <div className="grid grid-cols-5 gap-2 py-3 text-center">
          <Stat label="抽卡" value={stats.totalDraws} />
          <Stat label="男完成" value={stats.maleCompleted} />
          <Stat label="女完成" value={stats.femaleCompleted} />
          <Stat label="男跳過" value={stats.maleSkipped} />
          <Stat label="女跳過" value={stats.femaleSkipped} />
        </div>

        <button
          className="mb-2 flex min-h-10 items-center justify-center rounded-2xl border border-purple-200/15 bg-purple-950/25 px-4 text-sm font-semibold text-purple-100 active:scale-[0.99]"
          onClick={() => setLanguageMode((current) => (current === "zh-en" ? "zh" : "zh-en"))}
          type="button"
        >
          {languageMode === "zh-en" ? "中英同時顯示" : "只顯示中文"}
        </button>

        {isComboOnly ? (
          <button
            className="mb-1 flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-stone-950/65 px-4 text-sm font-semibold text-gold active:scale-[0.99]"
            onClick={() => setIsManagingCombo((current) => !current)}
            type="button"
          >
            {isManagingCombo ? <X aria-hidden="true" size={16} /> : <Settings2 aria-hidden="true" size={16} />}
            {isManagingCombo ? "收起素材管理" : "管理動作與身體部位"}
          </button>
        ) : null}

        {isComboOnly && isManagingCombo ? (
          <section className="mb-3 space-y-3 rounded-2xl border border-gold/18 bg-stone-950/70 p-4">
            <ComboListEditor
              inputValue={newAction}
              items={comboActions}
              label="動作"
              onAdd={() => addCustomItem("action")}
              onInputChange={setNewAction}
              onRemove={(item) => setComboActions((current) => current.filter((value) => comboLabelKey(value) !== comboLabelKey(item)))}
              onReset={() => resetComboItems("action")}
              placeholder="新增動作"
            />
            <ComboListEditor
              inputValue={newBodyPart}
              items={comboBodyParts}
              label="身體部位"
              onAdd={() => addCustomItem("bodyPart")}
              onInputChange={setNewBodyPart}
              onRemove={(item) => setComboBodyParts((current) => current.filter((value) => comboLabelKey(value) !== comboLabelKey(item)))}
              onReset={() => resetComboItems("bodyPart")}
              placeholder="新增身體部位"
            />
          </section>
        ) : null}

        <article
          className={`my-4 flex flex-1 flex-col justify-between rounded-[1.75rem] border border-gold/25 bg-gradient-to-br from-stone-950 via-plum to-velvet p-6 shadow-card transition duration-200 ${
            isDrawing ? "scale-[1.015] border-gold/45 shadow-[0_0_40px_rgba(200,162,90,0.18)]" : ""
          }`}
        >
          {card ? (
            <>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-gold">
                    {isDrawing ? "揭牌中" : card.type === "combo" ? "限制級" : card.type}
                  </span>
                  {isComboOnly && typeof card.comboScore === "number" ? (
                    <span className="rounded-full border border-purple-200/15 bg-purple-950/30 px-3 py-1 text-xs font-medium text-purple-100">
                      熱度 {card.comboScore}
                    </span>
                  ) : null}
                  {card.tags.slice(0, 2).map((tag) => (
                    <span className="rounded-full bg-stone-50/10 px-3 py-1 text-xs text-stone-300" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className={`mt-8 text-4xl font-semibold leading-tight text-stone-50 ${isDrawing ? "animate-pulse" : ""}`}>
                  {card.title}
                </h2>
                {languageMode === "zh-en" && card.titleEn ? (
                  <p className={`mt-3 text-xl font-semibold leading-snug text-gold/85 ${isDrawing ? "animate-pulse" : ""}`}>
                    {card.titleEn}
                  </p>
                ) : null}
                <p className={`mt-7 text-2xl font-medium leading-relaxed text-stone-100 ${isDrawing ? "animate-pulse" : ""}`}>
                  {card.displayText}
                </p>
                {languageMode === "zh-en" && card.displayTextEn ? (
                  <p className={`mt-4 text-lg font-medium leading-relaxed text-stone-300 ${isDrawing ? "animate-pulse" : ""}`}>
                    {card.displayTextEn}
                  </p>
                ) : null}
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
          <ActionButton icon={Check} label="男生完成" onClick={() => complete("male")} tone="gold" disabled={isDrawing} />
          <ActionButton icon={Check} label="女生完成" onClick={() => complete("female")} tone="gold" disabled={isDrawing} />
          <ActionButton icon={Shuffle} label="男生跳過" onClick={() => skip("male")} tone="dark" disabled={isDrawing} />
          <ActionButton icon={Shuffle} label="女生跳過" onClick={() => skip("female")} tone="dark" disabled={isDrawing} />
          <ActionButton
            icon={isComboOnly ? Wand2 : ArrowDown}
            label={isComboOnly ? "限制級" : "降一級"}
            onClick={lowerLevel}
            tone="dark"
            disabled={isDrawing || isComboOnly || currentLevel === 1}
          />
        </div>

        <button
          className="mb-2 min-h-12 rounded-2xl border border-red-300/25 bg-red-950/35 px-5 text-base font-semibold text-red-50 active:scale-[0.99] disabled:opacity-40"
          disabled={isDrawing}
          onClick={endGame}
          type="button"
        >
          結束遊戲
        </button>
      </section>
    </main>
  );
}

function ComboListEditor({
  inputValue,
  items,
  label,
  onAdd,
  onInputChange,
  onRemove,
  onReset,
  placeholder
}: {
  inputValue: string;
  items: ComboItem[];
  label: string;
  onAdd: () => void;
  onInputChange: (value: string) => void;
  onRemove: (value: ComboItem) => void;
  onReset: () => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-100">
          {label}
          <span className="ml-2 text-xs font-normal text-stone-400">{items.length} 項</span>
        </p>
        <button className="text-xs font-semibold text-gold/85" onClick={onReset} type="button">
          還原預設
        </button>
      </div>
      <div className="flex gap-2">
        <input
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-gold/15 bg-black/35 px-3 text-base text-stone-50 outline-none placeholder:text-stone-500 focus:border-gold/45"
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAdd();
          }}
          placeholder={placeholder}
          value={inputValue}
        />
        <button
          aria-label={`新增${label}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold text-stone-950 active:scale-[0.98]"
          onClick={onAdd}
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-auto pr-1">
        {items.map((item) => (
          <span
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold/15 bg-black/25 px-3 py-2 text-sm text-stone-200"
            key={comboLabelKey(item)}
          >
            <span className="truncate">{comboLabelKey(item)}</span>
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
              {item.score}
            </span>
            <button
              aria-label={`刪除${comboLabelKey(item)}`}
              className="text-stone-400 active:text-red-200 disabled:opacity-30"
              disabled={items.length <= 1}
              onClick={() => onRemove(item)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
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
