import QuizGame, { Question } from "../src/QuizGame";

global.localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
  key(index: number) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  },
  get length() {
    return Object.keys(this.store).length;
  },
};

describe("QuizGame", () => {
  const questions: Question[] = [
    {
      question: "Choose a color",
      choices: [
        { text: "Red", score: 10 },
        { text: "Blue", score: 20 },
        { text: "Green", score: 30 },
      ],
      tags: ["visual"],
    },
    {
      question: "Choose an animal",
      choices: [
        { text: "Cat", score: 20 },
        { text: "Dog", score: 10 },
        { text: "Bird", score: 30 },
      ],
      tags: ["personality"],
    },
  ];

  test("starts correctly and progresses through questions", () => {
    const game = new QuizGame({ questions });
    game.start();
    expect(game.getStatus()).toBe("in-progress");
    expect(game.getStep()).toBe(0);

    game.submitAnswer(2); // Green
    expect(game.getStep()).toBe(1);
    expect(game.getTotalScore()).toBe(30);

    game.submitAnswer(0); // Cat
    expect(game.getStatus()).toBe("completed");
    expect(game.getFinalScore()).toBeGreaterThan(0);
  });

  test("handles skipped answers and review mode", () => {
    const game = new QuizGame({ questions });
    game.start();
    game.submitAnswer(null); // skip first
    game.submitAnswer(1); // Dog (10)

    expect(game.getTotalScore()).toBe(10);
    expect(game.getStatus()).toBe("completed");

    game.enterReviewMode();
    expect(game.isInReviewMode()).toBe(true);

    const review = game.getReviewData();
    expect(review.length).toBe(2);
    expect(review[0].answer.choiceIndex).toBe(null);
    expect(review[1].answer.score).toBe(10);
  });

  test("saves and loads state correctly", () => {
    const game = new QuizGame({
      questions,
      storageKey: "test-game",
      encryptStorage: false,
    });

    game.start();
    game.submitAnswer(0); // Red (10)
    game.saveState();

    const newGame = new QuizGame({
      questions,
      storageKey: "test-game",
      encryptStorage: false,
    });
    newGame.loadState();

    expect(newGame.getStep()).toBe(1);
    expect(newGame.getTotalScore()).toBe(10);
  });
});
