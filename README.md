# Quiz Gamification Engine

[![NPM Version](https://img.shields.io/npm/v/quiz-gamification-engine.svg)](https://www.npmjs.com/package/quiz-gamification-engine)
[![License](https://img.shields.io/npm/l/quiz-gamification-engine)](./LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/your-username/quiz-gamification-engine/test.yml?branch=main)](https://github.com/your-username/quiz-gamification-engine/actions)
[![Code Coverage](https://img.shields.io/codecov/c/github/your-username/quiz-gamification-engine)](https://codecov.io/gh/your-username/quiz-gamification-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-✔-3178c6.svg)](https://www.typescriptlang.org/)

> A lightweight, pluggable quiz engine for gamification campaigns — TypeScript powered, browser-ready, and customizable.

---

## 🚀 Features

- ✅ Multiple-choice scoring with custom weights
- ⏱ Per-question and total quiz timers
- 🔁 Question & choice shuffling
- 🧠 Scoring buckets (e.g. low / medium / high)
- 💾 Persistent state (localStorage + optional encryption)
- 🔍 Review mode with answer breakdown
- 🏷️ Tag-based question pool selection
- 📊 Final score normalized to 0–100

---

## 📦 Installation

```bash
npm install quiz-gamification-engine
```

---

## 🧱 Usage

```ts
import QuizGame from "quiz-gamification-engine";

const game = new QuizGame({
  questions: [
    {
      question: "What's your favorite color?",
      choices: [
        { text: "Red", score: 10 },
        { text: "Blue", score: 20 },
      ],
      tags: ["personality"],
    },
  ],
  timeLimitPerQuestion: 15,
  totalTimeLimit: 60,
  scoringBuckets: [
    { min: 0, max: 30, label: "Low" },
    { min: 31, max: 70, label: "Medium" },
    { min: 71, max: 100, label: "High" },
  ],
  onStart: () => console.log("Started"),
  onAnswer: (choice, score) =>
    console.log("Answered:", choice, "Score:", score),
  onComplete: (score, bucket) =>
    console.log(`Final Score: ${score} (${bucket})`),
});

game.start();
```

---

## 🧪 Example: Browser Demo

Clone the repo and run:

```bash
npm install
npm run build
npx serve
```

Then open `examples/demo.html` in your browser.

---

## 📖 API Highlights

### ✅ Methods

- `start()`, `reset()`, `submitAnswer(index)`
- `saveState()`, `loadState()`
- `enterReviewMode()`, `getReviewData()`
- `getFinalScore()`, `getScoreBucket()`, `getStatus()`

### ✅ State

- `status`: `"idle" | "in-progress" | "completed"`
- `reviewMode`: boolean
- `answerHistory`: `{ questionIndex, choiceIndex, score }[]`

---

## 🔐 Optional Configs

| Option             | Description                                |
| ------------------ | ------------------------------------------ |
| `encryptStorage`   | Base64 encode saved data in `localStorage` |
| `storageKey`       | LocalStorage key for persistence           |
| `questionTags`     | Filter from a pool of tagged questions     |
| `shuffleQuestions` | Randomize question order                   |

---

## 🛠 Development

```bash
npm run build
npm test
```

---

## 📜 License

MIT © 2025 armin shaikhy
