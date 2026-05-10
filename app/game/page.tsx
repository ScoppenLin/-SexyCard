"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
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
import durationsData from "@/data/durations.json";
import cardTranslationsEnData from "@/data/cardTranslations.json";
import cardTranslationsIdData from "@/data/cardTranslations.id.json";
import cardTranslationsJaData from "@/data/cardTranslations.ja.json";
import cardTranslationsKoData from "@/data/cardTranslations.ko.json";
import cardTranslationsViData from "@/data/cardTranslations.vi.json";

type Level = 1 | 2 | 3;
type Lang = "en" | "id" | "vi" | "ja" | "ko";
type AppLang = "zh" | Lang;
type LocalizedText = string | { zh: string; en?: string; id?: string; vi?: string; ja?: string; ko?: string };
type ComboItem = { label: LocalizedText; score: number };
type TranslationText = { title: string; text: string };

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
  displayTitle: string;
  displayText: string;
  translations: Partial<Record<AppLang, TranslationText>>;
  comboScore?: number;
};

type GameStats = {
  level: Level;
  mode: "level" | "combo";
  totalDraws: number;
  startedAt: string;
  endedAt?: string;
};

type TimerAudioContext = AudioContext & { webkitAudioContext?: never };

const cards = cardsData as Card[];
const comboActionsStorageKey = "velvetCards.comboActions";
const comboBodyPartsStorageKey = "velvetCards.comboBodyParts";
const selectedLanguagesStorageKey = "velvetCards.selectedLanguages";
const legacyLanguageModeStorageKey = "velvetCards.languageMode";
const customComboItemScore = 5;

const uiCopy: Record<AppLang, {
  levelNames: Record<Level, string>;
  restricted: string;
  restrictedMode: string;
  home: string;
  endGame: string;
  drawCount: string;
  drawAgain: string;
  revealing: string;
  heat: string;
  timer: string;
  timerRunning: string;
  timerAgain: string;
  timerStart: string;
  consentNote: string;
  loadingCard: string;
  lowerLevel: string;
  chooseLanguages: string;
  languageTitle: string;
  primaryLanguage: string;
  additionalLanguages: string;
  openComboManager: string;
  closeComboManager: string;
  actionLabel: string;
  bodyPartLabel: string;
  addAction: string;
  addBodyPart: string;
  restoreDefault: string;
  addItem: string;
  deleteItem: string;
  itemCount: string;
  loadingPage: string;
}> = {
  zh: {
    levelNames: { 1: "暖身模式", 2: "升溫模式", 3: "火辣模式" },
    restricted: "限制級",
    restrictedMode: "限制級模式",
    home: "回首頁",
    endGame: "結束遊戲",
    drawCount: "抽牌",
    drawAgain: "再抽一次",
    revealing: "揭牌中",
    heat: "熱度",
    timer: "計時",
    timerRunning: "計時中",
    timerAgain: "再計時一次",
    timerStart: "開始計時",
    consentNote: "保持可溝通。任何一方不舒服時，這張牌自動改成擁抱、喝水或休息。",
    loadingCard: "抽牌中...",
    lowerLevel: "降一級",
    chooseLanguages: "選擇顯示語言",
    languageTitle: "語言",
    primaryLanguage: "主要語言",
    additionalLanguages: "額外顯示",
    openComboManager: "管理動作與身體部位",
    closeComboManager: "收起素材管理",
    actionLabel: "動作",
    bodyPartLabel: "身體部位",
    addAction: "新增動作",
    addBodyPart: "新增身體部位",
    restoreDefault: "還原預設",
    addItem: "新增",
    deleteItem: "刪除",
    itemCount: "項",
    loadingPage: "載入中..."
  },
  en: {
    levelNames: { 1: "Warm-up", 2: "Rising Heat", 3: "Spicy" },
    restricted: "Restricted",
    restrictedMode: "Restricted Mode",
    home: "Home",
    endGame: "End game",
    drawCount: "Draws",
    drawAgain: "Draw again",
    revealing: "Revealing",
    heat: "Heat",
    timer: "Timer",
    timerRunning: "Timer running",
    timerAgain: "Restart timer",
    timerStart: "Start timer",
    consentNote: "Keep checking in. If either person feels uncomfortable, turn this card into a hug, water break, or rest.",
    loadingCard: "Drawing...",
    lowerLevel: "Lower level",
    chooseLanguages: "Choose display languages",
    languageTitle: "Languages",
    primaryLanguage: "Primary",
    additionalLanguages: "Extra",
    openComboManager: "Manage actions and body parts",
    closeComboManager: "Close item manager",
    actionLabel: "Actions",
    bodyPartLabel: "Body parts",
    addAction: "Add action",
    addBodyPart: "Add body part",
    restoreDefault: "Restore defaults",
    addItem: "Add",
    deleteItem: "Delete",
    itemCount: "items",
    loadingPage: "Loading..."
  },
  id: {
    levelNames: { 1: "Pemanasan", 2: "Naik Suhu", 3: "Panas" },
    restricted: "Terbatas",
    restrictedMode: "Mode Terbatas",
    home: "Beranda",
    endGame: "Akhiri permainan",
    drawCount: "Kartu",
    drawAgain: "Ambil lagi",
    revealing: "Membuka",
    heat: "Panas",
    timer: "Timer",
    timerRunning: "Timer berjalan",
    timerAgain: "Mulai ulang timer",
    timerStart: "Mulai timer",
    consentNote: "Tetap saling mengecek. Jika ada yang tidak nyaman, ubah kartu ini menjadi pelukan, minum air, atau istirahat.",
    loadingCard: "Mengambil kartu...",
    lowerLevel: "Turun level",
    chooseLanguages: "Pilih bahasa tampilan",
    languageTitle: "Bahasa",
    primaryLanguage: "Utama",
    additionalLanguages: "Tambahan",
    openComboManager: "Kelola aksi dan bagian tubuh",
    closeComboManager: "Tutup pengelola",
    actionLabel: "Aksi",
    bodyPartLabel: "Bagian tubuh",
    addAction: "Tambah aksi",
    addBodyPart: "Tambah bagian tubuh",
    restoreDefault: "Pulihkan bawaan",
    addItem: "Tambah",
    deleteItem: "Hapus",
    itemCount: "item",
    loadingPage: "Memuat..."
  },
  vi: {
    levelNames: { 1: "Khởi động", 2: "Tăng nhiệt", 3: "Nóng bỏng" },
    restricted: "Giới hạn",
    restrictedMode: "Chế độ giới hạn",
    home: "Trang chủ",
    endGame: "Kết thúc",
    drawCount: "Lượt rút",
    drawAgain: "Rút lại",
    revealing: "Đang mở",
    heat: "Độ nóng",
    timer: "Hẹn giờ",
    timerRunning: "Đang chạy",
    timerAgain: "Bấm giờ lại",
    timerStart: "Bắt đầu",
    consentNote: "Luôn trao đổi với nhau. Nếu ai thấy không thoải mái, hãy đổi lá này thành ôm, uống nước hoặc nghỉ.",
    loadingCard: "Đang rút...",
    lowerLevel: "Giảm cấp",
    chooseLanguages: "Chọn ngôn ngữ hiển thị",
    languageTitle: "Ngôn ngữ",
    primaryLanguage: "Chính",
    additionalLanguages: "Thêm",
    openComboManager: "Quản lý hành động và bộ phận",
    closeComboManager: "Đóng quản lý",
    actionLabel: "Hành động",
    bodyPartLabel: "Bộ phận cơ thể",
    addAction: "Thêm hành động",
    addBodyPart: "Thêm bộ phận",
    restoreDefault: "Khôi phục mặc định",
    addItem: "Thêm",
    deleteItem: "Xóa",
    itemCount: "mục",
    loadingPage: "Đang tải..."
  },
  ja: {
    levelNames: { 1: "ウォームアップ", 2: "ヒートアップ", 3: "スパイシー" },
    restricted: "制限付き",
    restrictedMode: "制限付きモード",
    home: "ホーム",
    endGame: "終了",
    drawCount: "枚数",
    drawAgain: "もう一枚",
    revealing: "公開中",
    heat: "熱度",
    timer: "タイマー",
    timerRunning: "計測中",
    timerAgain: "もう一度",
    timerStart: "開始",
    consentNote: "こまめに確認しましょう。どちらかが不快なら、このカードはハグ、水分補給、休憩に変えてください。",
    loadingCard: "カードを引いています...",
    lowerLevel: "レベルを下げる",
    chooseLanguages: "表示言語を選択",
    languageTitle: "言語",
    primaryLanguage: "主言語",
    additionalLanguages: "追加表示",
    openComboManager: "動作と部位を管理",
    closeComboManager: "管理を閉じる",
    actionLabel: "動作",
    bodyPartLabel: "身体部位",
    addAction: "動作を追加",
    addBodyPart: "部位を追加",
    restoreDefault: "初期値に戻す",
    addItem: "追加",
    deleteItem: "削除",
    itemCount: "件",
    loadingPage: "読み込み中..."
  },
  ko: {
    levelNames: { 1: "워밍업", 2: "온도 올리기", 3: "핫 모드" },
    restricted: "제한",
    restrictedMode: "제한 모드",
    home: "홈",
    endGame: "게임 종료",
    drawCount: "뽑기",
    drawAgain: "다시 뽑기",
    revealing: "공개 중",
    heat: "열기",
    timer: "타이머",
    timerRunning: "타이머 실행 중",
    timerAgain: "다시 시작",
    timerStart: "시작",
    consentNote: "계속 서로 확인하세요. 불편하면 이 카드는 포옹, 물 마시기, 휴식으로 바꾸세요.",
    loadingCard: "카드 뽑는 중...",
    lowerLevel: "레벨 낮추기",
    chooseLanguages: "표시 언어 선택",
    languageTitle: "언어",
    primaryLanguage: "기본",
    additionalLanguages: "추가",
    openComboManager: "동작과 신체 부위 관리",
    closeComboManager: "관리 닫기",
    actionLabel: "동작",
    bodyPartLabel: "신체 부위",
    addAction: "동작 추가",
    addBodyPart: "신체 부위 추가",
    restoreDefault: "기본값 복원",
    addItem: "추가",
    deleteItem: "삭제",
    itemCount: "개",
    loadingPage: "로딩 중..."
  }
};

const languageOptions: { code: AppLang; label: string; shortLabel: string }[] = [
  { code: "zh", label: "繁體中文", shortLabel: "中" },
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "id", label: "Indonesia", shortLabel: "ID" },
  { code: "vi", label: "Tiếng Việt", shortLabel: "VI" },
  { code: "ja", label: "日本語", shortLabel: "日" },
  { code: "ko", label: "한국어", shortLabel: "韓" }
];
const languageCodes = new Set<AppLang>(languageOptions.map((language) => language.code));
const cardTranslationsByLanguage: Record<Lang, Record<string, TranslationText>> = {
  en: cardTranslationsEnData as Record<string, TranslationText>,
  id: cardTranslationsIdData as Record<string, TranslationText>,
  vi: cardTranslationsViData as Record<string, TranslationText>,
  ja: cardTranslationsJaData as Record<string, TranslationText>,
  ko: cardTranslationsKoData as Record<string, TranslationText>
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

function localizedText(value: LocalizedText, language: AppLang = "zh"): string {
  if (typeof value === "string") return value;
  return value[language] ?? value.zh ?? value.en ?? "";
}

function comboLabelKey(item: ComboItem): string {
  return localizedText(item.label, "zh") || localizedText(item.label, "en");
}

function normalizeDefaultItems(value: unknown, fallbackScore = customComboItemScore): ComboItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ComboItem | null => {
      if (typeof item === "string") {
        const label = item.trim();
        return label ? { label, score: fallbackScore } : null;
      }
      if (typeof item !== "object" || item === null) return null;

      const record = item as { label?: unknown; text?: unknown; score?: unknown };
      const rawLabel = record.label ?? record.text ?? "";
      if (typeof rawLabel === "object" && rawLabel !== null) {
        const label = rawLabel as Partial<Record<AppLang, unknown>>;
        const zh = String(label.zh ?? label.en ?? "").trim();
        if (!zh) return null;

        return {
          label: {
            zh,
            en: String(label.en ?? "").trim() || undefined,
            id: String(label.id ?? "").trim() || undefined,
            vi: String(label.vi ?? "").trim() || undefined,
            ja: String(label.ja ?? "").trim() || undefined,
            ko: String(label.ko ?? "").trim() || undefined
          },
          score: clampScore(record.score)
        };
      }

      const label = String(rawLabel).trim();
      return label ? { label, score: clampScore(record.score ?? fallbackScore) } : null;
    })
    .filter((item): item is ComboItem => item !== null);
}

const actionDefaults = normalizeDefaultItems(defaultActions);
const bodyPartDefaults = normalizeDefaultItems(defaultBodyParts);
const durationDefaults = normalizeDefaultItems(durationsData, 3);

function itemFromLabel(label: string, defaults: ComboItem[]): ComboItem {
  return defaults.find((item) => comboLabelKey(item) === label || localizedText(item.label, "en") === label) ?? {
    label,
    score: customComboItemScore
  };
}

function normalizeCustomList(value: unknown, fallback: ComboItem[]): ComboItem[] {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .map((item): ComboItem | null => {
      if (typeof item === "string") {
        const label = item.trim();
        return label ? itemFromLabel(label, fallback) : null;
      }
      if (typeof item !== "object" || item === null || !("label" in item)) return null;

      const rawLabel = (item as { label?: unknown }).label;
      const label = typeof rawLabel === "object" && rawLabel !== null
        ? String((rawLabel as { zh?: unknown; en?: unknown }).zh ?? (rawLabel as { en?: unknown }).en ?? "").trim()
        : String(rawLabel ?? "").trim();
      if (!label) return null;

      const defaultItem = fallback.find((candidate) => comboLabelKey(candidate) === label);
      if (defaultItem) return defaultItem;
      if (typeof rawLabel === "object" && rawLabel !== null) {
        const record = rawLabel as Partial<Record<AppLang, unknown>>;
        return {
          label: {
            zh: String(record.zh ?? record.en ?? "").trim(),
            en: String(record.en ?? "").trim() || undefined,
            id: String(record.id ?? "").trim() || undefined,
            vi: String(record.vi ?? "").trim() || undefined,
            ja: String(record.ja ?? "").trim() || undefined,
            ko: String(record.ko ?? "").trim() || undefined
          },
          score: clampScore((item as { score?: unknown }).score)
        };
      }

      return { label, score: clampScore((item as { score?: unknown }).score) };
    })
    .filter((item): item is ComboItem => item !== null);

  const deduped = Array.from(new Map(normalized.map((item) => [comboLabelKey(item), item])).values());
  return deduped.length ? deduped : fallback;
}

function readStoredList(key: string, fallback: ComboItem[]): ComboItem[] {
  try {
    return normalizeCustomList(JSON.parse(window.localStorage.getItem(key) ?? "null"), fallback);
  } catch {
    return fallback;
  }
}

function isTranslatedLanguage(language: AppLang): language is Lang {
  return language !== "zh";
}

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

function readSelectedLanguages(primaryLanguage: AppLang): AppLang[] {
  try {
    const stored = window.localStorage.getItem(selectedLanguagesStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed
            .filter((language): language is AppLang => languageCodes.has(language as AppLang))
            .filter((language) => language !== primaryLanguage)
            .slice(0, 2)
        : [];
    }

    if (window.localStorage.getItem(legacyLanguageModeStorageKey) === "zh-en") {
      return (["zh", "en"] as AppLang[]).filter((language) => language !== primaryLanguage).slice(0, 2);
    }

    return [];
  } catch {
    return [];
  }
}

function cardTextForLanguage(card: Card, language: AppLang): TranslationText {
  if (!isTranslatedLanguage(language)) return { title: card.title, text: card.text };
  return cardTranslationsByLanguage[language][card.id] ?? { title: card.title, text: card.text };
}

function translationsFor(card: Card): Partial<Record<AppLang, TranslationText>> {
  return Object.fromEntries(
    languageOptions.map(({ code }) => [code, cardTextForLanguage(card, code)] as const)
  ) as Partial<Record<AppLang, TranslationText>>;
}

function progressiveScoreCap(drawIndex: number, maxAvailableScore: number): number {
  const drawNumber = Math.max(1, drawIndex + 1);
  const rawCap = drawNumber === 1 ? 5 : 5 + 16 * Math.pow((drawNumber - 1) / 10, 1.18);

  return Math.min(maxAvailableScore, Math.max(5, Math.round(rawCap)));
}

function progressiveTargetScore(drawIndex: number, scoreCap: number): number {
  const drawNumber = Math.max(1, drawIndex + 1);
  const trend = 4 + 19 * (1 - Math.exp(-(drawNumber - 1) / 6.5));
  const wobbleRange = 2.2 + Math.min(5, drawNumber * 0.28);
  const randomSwing = (Math.random() - 0.5) * wobbleRange * 2;
  const occasionalDip = Math.random() < 0.18 ? -(2 + Math.random() * 4) : 0;
  const occasionalPush = drawNumber > 7 && Math.random() < 0.14 ? Math.random() * 5 : 0;

  return Math.min(scoreCap, Math.max(1, trend + randomSwing + occasionalDip + occasionalPush));
}

function pickProgressiveComboParts(actions: ComboItem[], bodyParts: ComboItem[], durations: ComboItem[], drawIndex: number) {
  const combinations = actions.flatMap((action) =>
    bodyParts.flatMap((bodyPart) =>
      durations.map((duration) => ({
        action,
        bodyPart,
        duration,
        score: action.score + bodyPart.score + duration.score
      }))
    )
  );
  const maxAvailableScore = Math.max(...combinations.map((combination) => combination.score));
  const scoreCap = progressiveScoreCap(drawIndex, maxAvailableScore);
  const targetScore = progressiveTargetScore(drawIndex, scoreCap);
  const cappedCombinations = combinations.filter((combination) => combination.score <= scoreCap);
  const candidateCombinations = cappedCombinations.length
    ? cappedCombinations
    : combinations.filter((combination) => combination.score === Math.min(...combinations.map((item) => item.score)));
  const weighted = candidateCombinations.map((combination) => {
    const distance = Math.abs(combination.score - targetScore);
    const surpriseBonus = Math.random() < 0.16 ? 2.6 : 1;
    const nearCeilingLift = 1 + Math.max(0, combination.score - scoreCap * 0.82) * 0.08;
    return { combination, weight: (1 / Math.pow(distance + 1, 1.85)) * surpriseBonus * nearCeilingLift };
  });
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.combination;
  }

  return weighted[weighted.length - 1].combination;
}

function durationPhrase(language: AppLang, duration: string): string {
  if (language === "zh") return `持續 ${duration}`;
  if (language === "en") return duration.startsWith("until") ? duration : `for ${duration}`;
  if (language === "id") return duration.startsWith("sampai") ? duration : `selama ${duration}`;
  if (language === "vi") return duration.startsWith("đến") ? duration : `trong ${duration}`;
  if (language === "ja") return `${duration}続けてください`;
  return duration.includes("까지") ? duration : `${duration} 동안`;
}

function comboText(action: ComboItem, bodyPart: ComboItem, duration: ComboItem, language: AppLang): string {
  const actionText = localizedText(action.label, language);
  const bodyPartText = localizedText(bodyPart.label, language);
  const durationText = localizedText(duration.label, language);
  if (language === "zh") return `${actionText}${bodyPartText}，${durationPhrase(language, durationText)}。`;
  if (language === "ja") return `${actionText}${bodyPartText}。${durationPhrase(language, durationText)}。`;
  return `${actionText}${bodyPartText} ${durationPhrase(language, durationText)}.`;
}

function buildDisplayCard(
  card: Card,
  comboActions = actionDefaults,
  comboBodyParts = bodyPartDefaults,
  drawIndex = 0,
  primaryLanguage: AppLang = "en"
): DisplayCard {
  const translations = translationsFor(card);
  if (card.type !== "combo") {
    const primary = translations[primaryLanguage] ?? translations.zh ?? { title: card.title, text: card.text };
    return { ...card, displayTitle: primary.title, displayText: primary.text, translations };
  }

  const { action, bodyPart, duration, score } = pickProgressiveComboParts(
    comboActions,
    comboBodyParts,
    durationDefaults,
    drawIndex
  );
  const comboTranslations = Object.fromEntries(
    languageOptions.map(({ code }) => {
      const base = translations[code] ?? translations.zh ?? { title: card.title, text: card.text };
      return [
        code,
        {
          title: base.title,
          text: comboText(action, bodyPart, duration, code)
        }
      ] as const;
    })
  ) as Partial<Record<AppLang, TranslationText>>;
  const primary = comboTranslations[primaryLanguage] ?? comboTranslations.zh ?? { title: card.title, text: card.text };

  return {
    ...card,
    displayTitle: primary.title,
    displayText: primary.text,
    translations: comboTranslations,
    comboScore: score
  };
}

function drawCard(level: Level, primaryLanguage: AppLang, previousId?: string): DisplayCard {
  const pool = cards.filter((card) => card.level === level && card.type !== "combo");
  const candidates = pool.length > 1 ? pool.filter((card) => card.id !== previousId) : pool;
  return buildDisplayCard(randomItem(candidates), actionDefaults, bodyPartDefaults, 0, primaryLanguage);
}

function drawComboCard(
  actions: ComboItem[],
  bodyParts: ComboItem[],
  drawIndex: number,
  primaryLanguage: AppLang,
  previousId?: string
): DisplayCard {
  const pool = cards.filter((card) => card.type === "combo");
  const candidates = pool.length > 1 ? pool.filter((card) => card.id !== previousId) : pool;
  return buildDisplayCard(randomItem(candidates), actions, bodyParts, drawIndex, primaryLanguage);
}

function makePreviewDeck(
  level: Level,
  isComboOnly: boolean,
  actions: ComboItem[],
  bodyParts: ComboItem[],
  drawIndex = 0,
  primaryLanguage: AppLang = "en"
) {
  const pool = isComboOnly
    ? cards.filter((card) => card.type === "combo")
    : cards.filter((card) => card.level === level && card.type !== "combo");
  return pool.map((card) => buildDisplayCard(card, actions, bodyParts, drawIndex, primaryLanguage));
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
  return amount ? (match[2] === "分鐘" ? amount * 60 : amount) : null;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function createAudioContext(): TimerAudioContext | null {
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioContextClass ? (new AudioContextClass() as TimerAudioContext) : null;
}

function playTimerSound(audio: AudioContext, kind: "start" | "end", startAt = audio.currentTime): OscillatorNode[] {
  const gain = audio.createGain();
  const nodes: OscillatorNode[] = [];
  gain.connect(audio.destination);

  const tone = (frequency: number, start: number, duration: number) => {
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
  tone(660, startAt, 0.18);
  if (kind === "end") {
    tone(880, startAt + 0.2, 0.2);
    tone(1046, startAt + 0.42, 0.24);
  }

  return nodes;
}

function playDrawSound(audio: AudioContext, kind: "tick" | "settle") {
  const now = audio.currentTime;
  const gain = audio.createGain();
  const oscillator = audio.createOscillator();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(kind === "tick" ? 520 : 880, now);
  if (kind === "settle") oscillator.frequency.exponentialRampToValueAtTime(1180, now + 0.18);
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
  const timerSeconds = useMemo(
    () => (!isDrawing && card ? parseTimerSeconds(card.translations.zh?.text ?? card.text) : null),
    [card, isDrawing]
  );
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
  const [settingsReady, setSettingsReady] = useState(false);
  const [isManagingCombo, setIsManagingCombo] = useState(false);
  const [isLanguagePanelOpen, setIsLanguagePanelOpen] = useState(false);
  const [newAction, setNewAction] = useState("");
  const [newBodyPart, setNewBodyPart] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState<AppLang>("en");
  const [selectedLanguages, setSelectedLanguages] = useState<AppLang[]>([]);
  const [stats, setStats] = useState<GameStats>({
    level: initialLevel,
    mode: isComboOnly ? "combo" : "level",
    totalDraws: 0,
    startedAt: new Date().toISOString()
  });
  statsRef.current = stats;
  const copy = uiCopy[primaryLanguage];
  const additionalLanguageOptions = languageOptions.filter((language) => language.code !== primaryLanguage);

  const clearRevealTimers = useCallback(() => {
    revealTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    revealTimeoutsRef.current = [];
  }, []);

  const playRevealSound = useCallback((kind: "tick" | "settle") => {
    if (!drawAudioRef.current || drawAudioRef.current.state === "closed") drawAudioRef.current = createAudioContext();
    const audio = drawAudioRef.current;
    if (!audio) return;
    void audio.resume().then(() => playDrawSound(audio, kind)).catch(() => undefined);
  }, []);

  const pullCard = useCallback((level: Level, previousId?: string) => {
    clearRevealTimers();
    const drawIndex = statsRef.current?.totalDraws ?? 0;
    const nextCard = isComboOnly
      ? drawComboCard(comboActionsRef.current, comboBodyPartsRef.current, drawIndex, primaryLanguage, previousId)
      : drawCard(level, primaryLanguage, previousId);
    const previewDeck = makePreviewDeck(
      level,
      isComboOnly,
      comboActionsRef.current,
      comboBodyPartsRef.current,
      drawIndex,
      primaryLanguage
    );

    setIsDrawing(true);
    setIsTimerRunning(false);
    setRemainingSeconds(null);
    [0, 55, 115, 185, 275, 390, 535, 715, 945, 1240].forEach((delay) => {
      const timeoutId = window.setTimeout(() => {
        setCard(randomItem(previewDeck));
        playRevealSound("tick");
      }, delay);
      revealTimeoutsRef.current.push(timeoutId);
    });

    const finalTimeoutId = window.setTimeout(() => {
      setCard(nextCard);
      setStats((current) => ({ ...current, level, mode: isComboOnly ? "combo" : "level", totalDraws: current.totalDraws + 1 }));
      setIsDrawing(false);
      playRevealSound("settle");
      revealTimeoutsRef.current = [];
    }, 1620);
    revealTimeoutsRef.current.push(finalTimeoutId);
  }, [clearRevealTimers, isComboOnly, playRevealSound, primaryLanguage]);

  useEffect(() => {
    const detectedLanguage = detectBrowserLanguage();
    const storedActions = readStoredList(comboActionsStorageKey, actionDefaults);
    const storedBodyParts = readStoredList(comboBodyPartsStorageKey, bodyPartDefaults);
    comboActionsRef.current = storedActions;
    comboBodyPartsRef.current = storedBodyParts;
    setPrimaryLanguage(detectedLanguage);
    setComboActions(storedActions);
    setComboBodyParts(storedBodyParts);
    setSelectedLanguages(readSelectedLanguages(detectedLanguage));
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    window.localStorage.setItem(selectedLanguagesStorageKey, JSON.stringify(selectedLanguages));
  }, [selectedLanguages, settingsReady]);

  useEffect(() => {
    if (hasPulledInitialCardRef.current || !settingsReady) return;
    hasPulledInitialCardRef.current = true;
    pullCard(initialLevel);
  }, [initialLevel, isComboOnly, pullCard, settingsReady]);

  useEffect(() => {
    if (!settingsReady) return;
    comboActionsRef.current = comboActions;
    window.localStorage.setItem(comboActionsStorageKey, JSON.stringify(comboActions));
  }, [comboActions, settingsReady]);

  useEffect(() => {
    if (!settingsReady) return;
    comboBodyPartsRef.current = comboBodyParts;
    window.localStorage.setItem(comboBodyPartsStorageKey, JSON.stringify(comboBodyParts));
  }, [comboBodyParts, settingsReady]);

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
    if (!timerAudioRef.current || timerAudioRef.current.state === "closed") timerAudioRef.current = createAudioContext();
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
    const item = { label: value, score: customComboItemScore };

    if (kind === "action") {
      setComboActions((current) => (current.some((existing) => comboLabelKey(existing) === value) ? current : [...current, item]));
      setNewAction("");
      return;
    }

    setComboBodyParts((current) => (current.some((existing) => comboLabelKey(existing) === value) ? current : [...current, item]));
    setNewBodyPart("");
  };

  const drawAgain = () => {
    if (isDrawing) return;
    pullCard(currentLevel, card?.id);
  };

  const lowerLevel = () => {
    if (isDrawing) return;
    const nextLevel = currentLevel === 3 ? 2 : 1;
    setCurrentLevel(nextLevel);
    pullCard(nextLevel, card?.id);
  };

  const toggleSelectedLanguage = (language: AppLang) => {
    if (language === primaryLanguage) return;
    setSelectedLanguages((current) => {
      if (current.includes(language)) return current.filter((value) => value !== language);
      if (current.length >= 2) return current;
      return [...current, language];
    });
  };

  const endGame = () => {
    if (isDrawing) return;
    window.localStorage.setItem("velvetCards.lastGame", JSON.stringify({ ...stats, endedAt: new Date().toISOString() }));
    router.push("/summary");
  };

  const selectedLanguageSummary = [primaryLanguage, ...selectedLanguages]
    .map((language) => languageOptions.find((option) => option.code === language)?.shortLabel)
    .filter(Boolean)
    .join("/");

  return (
    <main className="safe-screen px-4 py-4">
      <section className="mx-auto flex min-h-[calc(100svh-32px)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between gap-3 py-2">
          <Link
            aria-label={copy.home}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/15 bg-stone-950/70 text-gold"
            href="/"
          >
            <Home aria-hidden="true" size={20} />
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold/75">{isComboOnly ? copy.restricted : `Level ${currentLevel}`}</p>
            <h1 className="text-lg font-semibold text-stone-50">{isComboOnly ? copy.restrictedMode : copy.levelNames[currentLevel]}</h1>
            <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-stone-500">
              {copy.drawCount} {stats.totalDraws}
            </p>
          </div>
          <button
            aria-label={copy.endGame}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-red-300/20 bg-red-950/30 text-red-100 disabled:opacity-40"
            disabled={isDrawing}
            onClick={endGame}
            type="button"
          >
            <Square aria-hidden="true" size={17} />
          </button>
        </header>

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
                    {isDrawing ? copy.revealing : card.type === "combo" ? copy.restricted : card.type}
                  </span>
                  {isComboOnly && typeof card.comboScore === "number" ? (
                    <span className="rounded-full border border-purple-200/15 bg-purple-950/30 px-3 py-1 text-xs font-medium text-purple-100">
                      {copy.heat} {card.comboScore}
                    </span>
                  ) : null}
                  {card.tags.slice(0, 2).map((tag) => (
                    <span className="rounded-full bg-stone-50/10 px-3 py-1 text-xs text-stone-300" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 className={`mt-8 text-4xl font-semibold leading-tight text-stone-50 ${isDrawing ? "animate-pulse" : ""}`}>
                  {card.displayTitle}
                </h2>
                {selectedLanguages.map((language) => {
                  const translation = card.translations[language];
                  if (!translation?.title) return null;
                  return (
                    <p className={`mt-3 text-xl font-semibold leading-snug text-gold/85 ${isDrawing ? "animate-pulse" : ""}`} key={language}>
                      <LanguageMark language={language} tone="gold" />
                      {translation.title}
                    </p>
                  );
                })}

                <p className={`mt-7 text-2xl font-medium leading-relaxed text-stone-100 ${isDrawing ? "animate-pulse" : ""}`}>
                  {card.displayText}
                </p>
                {selectedLanguages.map((language) => {
                  const translation = card.translations[language];
                  if (!translation?.text) return null;
                  return (
                    <p className={`mt-4 text-lg font-medium leading-relaxed text-stone-300 ${isDrawing ? "animate-pulse" : ""}`} key={language}>
                      <LanguageMark language={language} />
                      {translation.text}
                    </p>
                  );
                })}

                {timerSeconds ? (
                  <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-black/25 p-4">
                    <div className="flex items-center gap-3">
                      <Clock3 aria-hidden="true" className="text-gold" size={22} />
                      <div>
                        <p className="text-xs text-stone-400">{copy.timer}</p>
                        <p className="text-3xl font-semibold text-stone-50">{formatTime(remainingSeconds ?? timerSeconds)}</p>
                      </div>
                    </div>
                    <button
                      aria-label={isTimerRunning ? copy.timerRunning : remainingSeconds === 0 ? copy.timerAgain : copy.timerStart}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold text-stone-950 active:scale-[0.98] disabled:opacity-60"
                      disabled={isTimerRunning}
                      onClick={startTimer}
                      title={isTimerRunning ? copy.timerRunning : remainingSeconds === 0 ? copy.timerAgain : copy.timerStart}
                      type="button"
                    >
                      <Play aria-hidden="true" size={16} />
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-8 border-t border-gold/15 pt-5 text-sm leading-6 text-stone-300">
                {copy.consentNote}
              </p>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-stone-300">{copy.loadingCard}</div>
          )}
        </article>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 pb-3">
          <ActionButton icon={Shuffle} label={copy.drawAgain} onClick={drawAgain} disabled={isDrawing} showText variant="primary" />
          <ActionButton
            icon={isComboOnly ? Wand2 : ArrowDown}
            label={isComboOnly ? copy.restricted : copy.lowerLevel}
            onClick={lowerLevel}
            disabled={isDrawing || isComboOnly || currentLevel === 1}
          />
        </div>

        <button
          aria-label={copy.endGame}
          className="mb-2 flex min-h-12 items-center justify-center rounded-2xl border border-red-300/25 bg-red-950/35 px-5 text-base font-semibold text-red-50 active:scale-[0.99] disabled:opacity-40"
          disabled={isDrawing}
          onClick={endGame}
          title={copy.endGame}
          type="button"
        >
          <Square aria-hidden="true" size={18} />
        </button>

        <div className="flex items-center justify-center gap-2 pb-3 pt-1">
          <button
            aria-label={copy.chooseLanguages}
            className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 active:scale-[0.98] ${
              isLanguagePanelOpen
                ? "border-purple-200/25 bg-purple-950/35 text-purple-100"
                : "border-purple-200/10 bg-purple-950/15 text-purple-100/70"
            }`}
            onClick={() => setIsLanguagePanelOpen((current) => !current)}
            title={copy.chooseLanguages}
            type="button"
          >
            <span aria-hidden="true" className="text-sm font-semibold leading-none">{selectedLanguageSummary}</span>
          </button>

          {isComboOnly ? (
            <button
              aria-label={isManagingCombo ? copy.closeComboManager : copy.openComboManager}
              className={`flex h-10 w-10 items-center justify-center rounded-full border active:scale-[0.98] ${
                isManagingCombo ? "border-gold/30 bg-gold/15 text-gold" : "border-gold/10 bg-stone-950/35 text-gold/55"
              }`}
              onClick={() => setIsManagingCombo((current) => !current)}
              title={isManagingCombo ? copy.closeComboManager : copy.openComboManager}
              type="button"
            >
              {isManagingCombo ? <X aria-hidden="true" size={15} /> : <Settings2 aria-hidden="true" size={15} />}
            </button>
          ) : null}
        </div>

        {isLanguagePanelOpen ? (
          <section className="mb-3 rounded-2xl border border-purple-200/10 bg-stone-950/45 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-200">{copy.languageTitle}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {copy.primaryLanguage}: {languageOptions.find((language) => language.code === primaryLanguage)?.label}
                </p>
              </div>
              <p className="text-xs text-stone-500">
                {copy.additionalLanguages} {selectedLanguages.length}/2
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {additionalLanguageOptions.map((language) => {
                const isSelected = selectedLanguages.includes(language.code);
                const isDisabled = !isSelected && selectedLanguages.length >= 2;
                return (
                  <button
                    aria-label={`${copy.chooseLanguages}: ${language.label}`}
                    aria-pressed={isSelected}
                    className={`flex min-h-10 items-center justify-between rounded-xl border px-3 text-sm font-semibold active:scale-[0.98] disabled:opacity-35 ${
                      isSelected ? "border-purple-200/25 bg-purple-950/45 text-purple-50" : "border-stone-100/10 bg-black/20 text-stone-400"
                    }`}
                    disabled={isDisabled}
                    key={language.code}
                    onClick={() => toggleSelectedLanguage(language.code)}
                    type="button"
                  >
                    <span>{language.label}</span>
                    <span className="text-xs uppercase text-gold/70">{language.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {isComboOnly && isManagingCombo ? (
          <section className="mb-3 space-y-3 rounded-2xl border border-gold/12 bg-stone-950/50 p-4">
            <ComboListEditor
              addLabel={copy.addItem}
              deleteLabel={copy.deleteItem}
              displayLanguage={primaryLanguage}
              inputValue={newAction}
              items={comboActions}
              itemCountLabel={copy.itemCount}
              label={copy.actionLabel}
              onAdd={() => addCustomItem("action")}
              onInputChange={setNewAction}
              onRemove={(item) => setComboActions((current) => current.filter((value) => comboLabelKey(value) !== comboLabelKey(item)))}
              onReset={() => {
                setComboActions(actionDefaults);
                setNewAction("");
              }}
              placeholder={copy.addAction}
              restoreLabel={copy.restoreDefault}
            />
            <ComboListEditor
              addLabel={copy.addItem}
              deleteLabel={copy.deleteItem}
              displayLanguage={primaryLanguage}
              inputValue={newBodyPart}
              items={comboBodyParts}
              itemCountLabel={copy.itemCount}
              label={copy.bodyPartLabel}
              onAdd={() => addCustomItem("bodyPart")}
              onInputChange={setNewBodyPart}
              onRemove={(item) => setComboBodyParts((current) => current.filter((value) => comboLabelKey(value) !== comboLabelKey(item)))}
              onReset={() => {
                setComboBodyParts(bodyPartDefaults);
                setNewBodyPart("");
              }}
              placeholder={copy.addBodyPart}
              restoreLabel={copy.restoreDefault}
            />
          </section>
        ) : null}
      </section>
    </main>
  );
}

function LanguageMark({ language, tone = "muted" }: { language: AppLang; tone?: "gold" | "muted" }) {
  return (
    <span className={`mr-2 text-xs uppercase tracking-[0.16em] ${tone === "gold" ? "text-gold/55" : "text-stone-500"}`}>
      {languageOptions.find((option) => option.code === language)?.shortLabel}
    </span>
  );
}

function comboDisplayLabel(item: ComboItem, language: AppLang): string {
  return localizedText(item.label, language) || comboLabelKey(item);
}

function ComboListEditor({
  addLabel,
  deleteLabel,
  displayLanguage,
  inputValue,
  items,
  itemCountLabel,
  label,
  onAdd,
  onInputChange,
  onRemove,
  onReset,
  placeholder,
  restoreLabel
}: {
  addLabel: string;
  deleteLabel: string;
  displayLanguage: AppLang;
  inputValue: string;
  items: ComboItem[];
  itemCountLabel: string;
  label: string;
  onAdd: () => void;
  onInputChange: (value: string) => void;
  onRemove: (value: ComboItem) => void;
  onReset: () => void;
  placeholder: string;
  restoreLabel: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-stone-100">
          {label}
          <span className="ml-2 text-xs font-normal text-stone-400">{items.length} {itemCountLabel}</span>
        </p>
        <button
          aria-label={`${restoreLabel} ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/15 text-gold/85 active:scale-[0.98]"
          onClick={onReset}
          title={`${restoreLabel} ${label}`}
          type="button"
        >
          <Shuffle aria-hidden="true" size={15} />
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
          aria-label={`${addLabel} ${label}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold text-stone-950 active:scale-[0.98]"
          onClick={onAdd}
          type="button"
        >
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-auto pr-1">
        {items.map((item) => {
          const visibleLabel = comboDisplayLabel(item, displayLanguage);
          return (
            <span
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold/15 bg-black/25 px-3 py-2 text-sm text-stone-200"
              key={comboLabelKey(item)}
            >
              <span className="truncate">{visibleLabel}</span>
              <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">{item.score}</span>
              <button
                aria-label={`${deleteLabel} ${visibleLabel}`}
                className="text-stone-400 active:text-red-200 disabled:opacity-30"
                disabled={items.length <= 1}
                onClick={() => onRemove(item)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ActionButton({
  disabled,
  icon: Icon,
  label,
  onClick,
  showText = false,
  variant = "secondary"
}: {
  disabled?: boolean;
  icon: ElementType;
  label: string;
  onClick: () => void;
  showText?: boolean;
  variant?: "primary" | "secondary";
}) {
  const toneClass =
    variant === "primary"
      ? "border-gold/30 bg-gradient-to-br from-gold to-[#8f6528] text-stone-950 shadow-[0_16px_32px_rgba(200,162,90,0.2)]"
      : "border-gold/15 bg-stone-950/65 text-stone-100";

  return (
    <button
      aria-label={label}
      className={`relative flex min-h-16 items-center justify-center overflow-hidden rounded-2xl border px-4 text-base font-semibold active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35 ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/20 backdrop-blur">
        <Icon aria-hidden="true" size={22} />
      </span>
      {showText ? <span className="relative z-10 ml-3 text-lg">{label}</span> : null}
    </button>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<main className="safe-screen px-5 py-6 text-stone-100">Loading...</main>}>
      <GameContent />
    </Suspense>
  );
}
