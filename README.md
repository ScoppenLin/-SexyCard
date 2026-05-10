# Velvet Cards 專案維護說明

這是一個個人使用的成人伴侶情趣指令卡 Web App MVP。專案使用 Next.js App Router、React 與 Tailwind CSS，沒有帳號、登入、後端、資料庫或年齡確認頁。所有遊戲狀態都在瀏覽器端處理，必要紀錄存在 `localStorage`。

目前線上部署在 Vercel，來源以 GitHub `main` 分支為準。

## 技術棧

- `Next.js 14`
- `React 18`
- `TypeScript`
- `Tailwind CSS`
- `lucide-react` 圖示
- 本地 JSON 牌庫與翻譯檔
- 瀏覽器 `localStorage`
- Web Audio API 音效

## 主要檔案結構

```text
.
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── game/
│   │   └── page.tsx
│   └── summary/
│       └── page.tsx
├── data/
│   ├── cards.json
│   ├── actions.json
│   ├── bodyParts.json
│   ├── durations.json
│   ├── cardTranslations.json
│   ├── cardTranslations.id.json
│   ├── cardTranslations.vi.json
│   ├── cardTranslations.ja.json
│   └── cardTranslations.ko.json
├── AGENTS.md
├── package.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
└── tsconfig.json
```

注意：這台本機環境有時不容易同步到 GitHub 最新檔案，也不適合長時間跑本機 web server。維護時請以 GitHub `main` 與 Vercel 部署狀態作為最後確認來源。

## 核心頁面

### `app/page.tsx`

首頁。直接顯示四個入口：

- 暖身模式 Level 1：`/game?level=1`
- 升溫模式 Level 2：`/game?level=2`
- 火辣模式 Level 3：`/game?level=3`
- 限制級模式：`/game?mode=combo`

這個檔案主要維護首頁模式清單、標題文字、入口連結與首頁卡片外觀。

### `app/game/page.tsx`

遊戲主邏輯都在這裡，是最核心的檔案。負責：

- 從 URL 判斷目前模式與等級
- 從 `data/cards.json` 抽一般牌
- 限制級模式從 `actions.json`、`bodyParts.json`、`durations.json` 組合任務
- 顯示目前卡片、標籤、熱度、計時器
- 男生完成、女生完成、男生跳過、女生跳過統計
- 抽卡動畫與抽牌音效
- 計時開始音效與結束音效
- 多語言顯示設定
- 限制級素材管理
- 將本局紀錄寫入 `localStorage`

一般 Level 1 到 Level 3 不會抽出 `type = "combo"` 的卡。`combo` 卡只屬於限制級模式。

### `app/summary/page.tsx`

結算頁。讀取 `localStorage` 的 `velvetCards.lastGame`，顯示：

- 總抽卡數
- 完成數
- 跳過數
- 男生完成
- 女生完成
- 男生跳過
- 女生跳過
- 完成率

這裡也保留舊版統計欄位的相容處理，例如舊的 `completed`、`skipped`。

### `app/layout.tsx`

全站 layout 與 metadata。包含：

- 頁面標題 `Velvet Cards`
- viewport 設定
- `html lang="zh-Hant"`
- 匯入 `globals.css`

### `app/globals.css`

全站基礎樣式。包含：

- Tailwind base/components/utilities
- 深色背景
- 酒紅、暗紫、黑金系漸層背景
- `safe-screen` 工具 class，讓手機瀏覽器使用 `100svh`

## 資料檔案

### `data/cards.json`

主要牌庫。每張卡格式：

```json
{
  "id": "l1-001",
  "level": 1,
  "mode": "warmup",
  "type": "prompt",
  "title": "三個喜歡",
  "text": "輪流說出今晚最喜歡對方的三個細節，說完後給對方一個慢慢的擁抱。",
  "tags": ["讚美", "擁抱", "暖身"]
}
```

欄位說明：

- `id`：唯一識別碼，翻譯檔會用這個 key 對應
- `level`：`1`、`2`、`3`
- `mode`：描述用途，例如 `warmup`、`heat`、`spicy`
- `type`：卡片類型，例如 `prompt`、`touch`、`ritual`、`combo`
- `title`：中文標題
- `text`：中文任務文字
- `tags`：畫面上顯示的標籤

維護規則：

- 新增一般牌時，請放在 Level 1、2、3 中，`type` 不要用 `combo`
- 新增限制級組合模板時，才使用 `type = "combo"`
- 一般模式會排除 `combo`；限制級模式只抽 `combo`
- 如果文字包含 `秒` 或 `分鐘`，遊戲頁會嘗試顯示計時器

### `data/actions.json`

限制級模式的「動作」資料。每一項有多語言 label 與分數：

```json
{
  "label": {
    "zh": "用指尖慢慢描過",
    "en": "Slowly trace with your fingertips over ",
    "id": "Usap perlahan dengan ujung jari di ",
    "vi": "Dùng đầu ngón tay chậm rãi lướt trên ",
    "ja": "指先でゆっくりなぞる場所：",
    "ko": "손끝으로 천천히 쓸어줄 곳: "
  },
  "score": 2
}
```

`score` 建議使用 `1` 到 `10`。分數越高，越可能在遊戲後段被抽到。

### `data/bodyParts.json`

限制級模式的「身體部位」資料。格式與 `actions.json` 相同：

```json
{
  "label": {
    "zh": "肩膀",
    "en": "the shoulder",
    "id": "bahu",
    "vi": "vai",
    "ja": "肩",
    "ko": "어깨"
  },
  "score": 2
}
```

### `data/durations.json`

限制級模式的「時間」資料。格式與 `actions.json` 相同：

```json
{
  "label": {
    "zh": "30 秒",
    "en": "30 seconds",
    "id": "30 detik",
    "vi": "30 giây",
    "ja": "30秒",
    "ko": "30초"
  },
  "score": 4
}
```

如果中文時間包含 `秒` 或 `分鐘`，卡片會出現開始計時按鈕。

### 翻譯檔

卡片翻譯放在獨立 JSON 檔：

- `data/cardTranslations.json`：英文
- `data/cardTranslations.id.json`：印尼文
- `data/cardTranslations.vi.json`：越南文
- `data/cardTranslations.ja.json`：日文
- `data/cardTranslations.ko.json`：韓文

格式：

```json
{
  "l1-001": {
    "title": "Three Things You Like",
    "text": "Take turns naming three details you like about your partner tonight. After sharing, give one slow hug."
  }
}
```

維護規則：

- key 必須對應 `cards.json` 的 `id`
- 新增卡片時，應同步補上各語言翻譯
- 中文仍以 `cards.json` 為主，不放在翻譯檔
- 遊戲頁固定先顯示中文，使用者可在底部語言設定選 0 到 2 種副語言

## 限制級模式與熱度分數

限制級模式會先抽一張 `type = "combo"` 的模板卡，再分別從三個檔案抽：

- `actions.json`
- `bodyParts.json`
- `durations.json`

最後組成任務：

```text
動作 + 身體部位 + 時間
```

總熱度分數：

```text
action.score + bodyPart.score + duration.score
```

目前熱度抽選不是完全平均亂數，而是「隨抽卡張數逐步升溫的加權亂數」。核心概念：

```ts
scoreCap = 5 + 16 * Math.pow((drawNumber - 1) / 10, 1.18)
```

實際效果：

- 第 1 張上限約 `5`
- 第 5 張上限約 `10`
- 第 10 張上限約 `19`
- 第 11 張上限約 `21`
- 後面逐步接近資料庫可用最高分

同時還會加入隨機擺動：

- 偶爾降溫
- 偶爾衝高
- 越接近目標分數的組合權重越高

所以玩家感覺會是「真的亂抽」，但整體趨勢仍然越玩越升溫。

## 使用者可自訂的資料

限制級模式底部有素材管理按鈕，使用者可以在瀏覽器端新增或刪除：

- 動作
- 身體部位

使用者自己新增的項目存在瀏覽器 `localStorage`，不會寫回 JSON，也不會上傳。

自訂項目的預設分數是：

```ts
customComboItemScore = 5
```

## localStorage key

目前使用的 key：

```text
velvetCards.currentGame
velvetCards.lastGame
velvetCards.selectedLanguages
velvetCards.comboActions
velvetCards.comboBodyParts
velvetCards.languageMode
```

說明：

- `currentGame`：目前遊戲進度
- `lastGame`：結算頁讀取的上一局結果
- `selectedLanguages`：使用者選擇的副語言，最多兩種
- `comboActions`：使用者自訂動作
- `comboBodyParts`：使用者自訂身體部位
- `languageMode`：舊版中英切換相容 key

## 多語言設計

目前支援：

- 中文：主要語言，來自 `cards.json`
- 英文：`cardTranslations.json`
- 印尼文：`cardTranslations.id.json`
- 越南文：`cardTranslations.vi.json`
- 日文：`cardTranslations.ja.json`
- 韓文：`cardTranslations.ko.json`

畫面規則：

- 中文永遠顯示
- 底部語言按鈕可打開設定面板
- 使用者最多選 2 種副語言
- 選擇會保存在 `localStorage`

未來新增語言時，通常需要：

1. 新增 `data/cardTranslations.xx.json`
2. 在 `app/game/page.tsx` 匯入該檔案
3. 將語言加入 `languageOptions`
4. 將該語言加入 `LocalizedText` 型別
5. 在 `actions.json`、`bodyParts.json`、`durations.json` 補上對應 label

## 音效與計時

音效使用 Web Audio API，不需要額外音檔。

目前有兩類音效：

- 抽卡跳動音效
- 計時開始與計時結束音效

計時器只會從中文卡片文字解析：

```text
30 秒
90 秒
1 分鐘
三分鐘
```

如果任務文字沒有可解析的時間，就不顯示計時器。

iPhone 上音效需要使用者互動後才能播放，所以結束音效會在按下開始計時時預先排程。

## 樣式與設計

主要風格在：

- `app/globals.css`
- `tailwind.config.ts`

Tailwind 自訂色：

```ts
velvet: "#4b1024"
wine: "#7a1f3d"
plum: "#251326"
gold: "#c8a15a"
ink: "#08060a"
```

設計方向：

- 手機優先
- 深色背景
- 酒紅、黑金、暗紫
- 大字體
- 精品、私密感
- 底部設定介面保持低調

## 開發與部署

常用指令：

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

這台機器的本機 web server 有時不穩，維護時建議優先做輕量檢查：

```bash
node -e "JSON.parse(require('fs').readFileSync('data/cards.json','utf8')); console.log('cards ok')"
```

也可以對單一 TSX 檔做 TypeScript transpile 檢查，而不是每次跑完整 build。

部署流程：

1. 更新 GitHub `main`
2. Vercel 會自動部署
3. 確認 GitHub commit status 的 Vercel 狀態是 `success`
4. 用線上網址確認頁面回應 `200 OK`

目前線上站：

```text
https://sexy-card-hcio.vercel.app
```

## 維護卡牌的建議流程

新增一般卡：

1. 在 `data/cards.json` 加入卡片
2. 確認 `id` 不重複
3. `level` 設為 `1`、`2` 或 `3`
4. `type` 不要使用 `combo`
5. 到每個 `cardTranslations.*.json` 補翻譯
6. 檢查 JSON 是否能 parse
7. 推到 GitHub，等 Vercel 部署成功

新增限制級組合素材：

1. 在 `actions.json`、`bodyParts.json` 或 `durations.json` 新增項目
2. 補齊 `zh`、`en`、`id`、`vi`、`ja`、`ko`
3. 設定 `score`
4. 檢查早期抽卡是否不會因分數過高太早出現

調整熱度節奏：

- 修改 `app/game/page.tsx` 的 `progressiveScoreCap`
- 修改 `progressiveTargetScore`
- 修改 `pickProgressiveComboParts` 的權重計算

## 隱私與資料保存

這個 MVP 沒有後端，也不會上傳遊戲資料。所有遊戲紀錄、語言設定、自訂素材都只存在使用者瀏覽器端。

清除瀏覽器網站資料後，這些紀錄也會消失。
