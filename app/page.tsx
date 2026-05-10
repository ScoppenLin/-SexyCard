"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Heart, Sparkles, Wand2 } from "lucide-react";

type AppLang = "zh" | "en" | "id" | "vi" | "ja" | "ko";
type ModeKey = 1 | 2 | 3 | "combo";

const languageCodes = new Set<AppLang>(["zh", "en", "id", "vi", "ja", "ko"]);

const copy: Record<AppLang, {
  eyebrow: string;
  headline: string;
  body: string;
  restrictedSuffix: string;
  modes: Record<ModeKey, { name: string; subtitle: string }>;
}> = {
  zh: {
    eyebrow: "Velvet Cards",
    headline: "今晚抽一張，讓彼此更靠近。",
    body: "私密、輕量、只存在你的手機裡。選一個節奏開始，所有任務都以雙方同意與舒適為前提。",
    restrictedSuffix: "限制級",
    modes: {
      1: { name: "暖身模式", subtitle: "柔和靠近，建立節奏" },
      2: { name: "升溫模式", subtitle: "更主動一點，讓空氣變熱" },
      3: { name: "火辣模式", subtitle: "大膽邀請，只留給今晚" },
      combo: { name: "限制級模式", subtitle: "每一張都即時組合，讓今晚更不可預測" }
    }
  },
  en: {
    eyebrow: "Velvet Cards",
    headline: "Draw one card and move closer tonight.",
    body: "Private, lightweight, and kept on your phone. Choose a rhythm to begin; every card starts from mutual consent and comfort.",
    restrictedSuffix: "Restricted",
    modes: {
      1: { name: "Warm-up", subtitle: "Ease in gently and find the rhythm" },
      2: { name: "Rising Heat", subtitle: "Get a little bolder and warm the room" },
      3: { name: "Spicy", subtitle: "A daring invitation kept for tonight" },
      combo: { name: "Restricted Mode", subtitle: "Every card is assembled live for a less predictable night" }
    }
  },
  id: {
    eyebrow: "Velvet Cards",
    headline: "Ambil satu kartu dan mendekat malam ini.",
    body: "Pribadi, ringan, dan hanya tersimpan di ponselmu. Pilih ritme untuk mulai; semua kartu berangkat dari persetujuan dan kenyamanan bersama.",
    restrictedSuffix: "Terbatas",
    modes: {
      1: { name: "Pemanasan", subtitle: "Dekati perlahan dan temukan ritme" },
      2: { name: "Naik Suhu", subtitle: "Lebih berani sedikit, buat suasana hangat" },
      3: { name: "Panas", subtitle: "Undangan berani khusus malam ini" },
      combo: { name: "Mode Terbatas", subtitle: "Setiap kartu dirangkai langsung agar malam lebih tak terduga" }
    }
  },
  vi: {
    eyebrow: "Velvet Cards",
    headline: "Rút một lá và lại gần nhau hơn tối nay.",
    body: "Riêng tư, gọn nhẹ, chỉ nằm trong điện thoại của bạn. Chọn nhịp độ để bắt đầu; mọi lá bài đều dựa trên đồng thuận và sự thoải mái.",
    restrictedSuffix: "Giới hạn",
    modes: {
      1: { name: "Khởi động", subtitle: "Lại gần nhẹ nhàng và tìm nhịp" },
      2: { name: "Tăng nhiệt", subtitle: "Chủ động hơn một chút để không khí nóng lên" },
      3: { name: "Nóng bỏng", subtitle: "Một lời mời táo bạo dành cho tối nay" },
      combo: { name: "Chế độ giới hạn", subtitle: "Mỗi lá được ghép ngẫu nhiên để đêm nay khó đoán hơn" }
    }
  },
  ja: {
    eyebrow: "Velvet Cards",
    headline: "今夜は一枚引いて、ふたりの距離を近づける。",
    body: "プライベートで軽く、あなたのスマホだけに残ります。リズムを選んで開始し、すべてのカードは同意と心地よさを前提にします。",
    restrictedSuffix: "制限付き",
    modes: {
      1: { name: "ウォームアップ", subtitle: "やさしく近づき、リズムを作る" },
      2: { name: "ヒートアップ", subtitle: "少し積極的に、空気を温める" },
      3: { name: "スパイシー", subtitle: "今夜だけの大胆な誘い" },
      combo: { name: "制限付きモード", subtitle: "毎回その場で組み合わせて、予測できない夜に" }
    }
  },
  ko: {
    eyebrow: "Velvet Cards",
    headline: "오늘 밤 카드 한 장으로 더 가까워지기.",
    body: "개인적이고 가볍게, 휴대폰 안에만 남습니다. 원하는 흐름을 골라 시작하세요. 모든 카드는 서로의 동의와 편안함을 기준으로 합니다.",
    restrictedSuffix: "제한",
    modes: {
      1: { name: "워밍업", subtitle: "부드럽게 가까워지며 리듬 만들기" },
      2: { name: "온도 올리기", subtitle: "조금 더 적극적으로 분위기를 데우기" },
      3: { name: "핫 모드", subtitle: "오늘 밤만의 대담한 초대" },
      combo: { name: "제한 모드", subtitle: "매번 즉석 조합으로 더 예측할 수 없게" }
    }
  }
};

const modes: { level: ModeKey; icon: typeof Heart; href: string }[] = [
  { level: 1, icon: Heart, href: "/game?level=1" },
  { level: 2, icon: Sparkles, href: "/game?level=2" },
  { level: 3, icon: Flame, href: "/game?level=3" },
  { level: "combo", icon: Wand2, href: "/game?mode=combo" }
];

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

export default function Home() {
  const [language, setLanguage] = useState<AppLang>("en");

  useEffect(() => {
    setLanguage(detectBrowserLanguage());
  }, []);

  const text = copy[language];

  return (
    <main className="safe-screen px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-md flex-col justify-between">
        <div className="pt-6">
          <p className="text-sm uppercase tracking-[0.32em] text-gold/80">{text.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-50">
            {text.headline}
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-300">
            {text.body}
          </p>
        </div>

        <div className="space-y-3 pb-5 pt-10">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const modeText = text.modes[mode.level];

            return (
              <Link
                className="group flex min-h-28 items-center gap-4 rounded-2xl border border-gold/18 bg-stone-950/55 p-5 shadow-card backdrop-blur transition active:scale-[0.99]"
                href={mode.href}
                key={mode.level}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gradient-to-br from-wine/80 to-plum text-gold">
                  <Icon aria-hidden="true" size={25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-semibold text-stone-50">
                    {modeText.name}{" "}
                    <span className="text-gold">
                      {mode.level === "combo" ? text.restrictedSuffix : `Level ${mode.level}`}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-stone-300">{modeText.subtitle}</span>
                </span>
                <span className="text-2xl text-gold/70 transition group-active:translate-x-1">›</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
