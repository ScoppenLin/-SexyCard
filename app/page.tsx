"use client";

import Link from "next/link";
import { Flame, Heart, Sparkles, Wand2 } from "lucide-react";

const modes = [
  {
    level: 1,
    name: "暖身模式",
    subtitle: "柔和靠近，建立節奏",
    icon: Heart,
    href: "/game?level=1"
  },
  {
    level: 2,
    name: "升溫模式",
    subtitle: "更主動一點，讓空氣變熱",
    icon: Sparkles,
    href: "/game?level=2"
  },
  {
    level: 3,
    name: "火辣模式",
    subtitle: "大膽邀請，只留給今晚",
    icon: Flame,
    href: "/game?level=3"
  },
  {
    level: "combo",
    name: "組合牌模式",
    subtitle: "每一張都即時組合，讓今晚更不可預測",
    icon: Wand2,
    href: "/game?mode=combo"
  }
];

export default function Home() {
  return (
    <main className="safe-screen px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-md flex-col justify-between">
        <div className="pt-6">
          <p className="text-sm uppercase tracking-[0.32em] text-gold/80">Velvet Cards</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-50">
            今晚抽一張，讓彼此更靠近。
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-300">
            私密、輕量、只存在你的手機裡。選一個節奏開始，所有任務都以雙方同意與舒適為前提。
          </p>
        </div>

        <div className="space-y-3 pb-5 pt-10">
          {modes.map((mode) => {
            const Icon = mode.icon;

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
                    {mode.name}{" "}
                    <span className="text-gold">
                      {mode.level === "combo" ? "Combo" : `Level ${mode.level}`}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-stone-300">{mode.subtitle}</span>
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
