// src/QuizGame.ts
export type Choice = {
  text: string;
  score: number;
};

export type Question = {
  question: string;
  choices: Choice[];
  tags?: string[];
};

export type ScoringBucket = {
  min: number;
  max: number;
  label: string;
};

export type AnswerRecord = {
  questionIndex: number;
  choiceIndex: number | null;
  score: number;
};

export type QuizGameConfig = {
  questions: Question[];
  onStart?: () => void;
  onQuestionChange?: (index: number) => void;
  onAnswer?: (choice: Choice | null, score: number) => void;
  onComplete?: (finalScore: number, bucket: string | null) => void;
  onTimeExpired?: (index: number) => void;
  onTotalTimeExpired?: () => void;
  timeLimitPerQuestion?: number;
  totalTimeLimit?: number;
  shuffleQuestions?: boolean;
  shuffleChoices?: boolean;
  questionTags?: string[];
  questionsPerTag?: number;
  scoringBuckets?: ScoringBucket[];
  storageKey?: string;
  storageNamespace?: string;
  encryptStorage?: boolean;
};

class QuizGame {
  private initialQuestions: Question[];
  private onStart?: () => void;
  private onQuestionChange?: (index: number) => void;
  private onAnswer?: (choice: Choice | null, score: number) => void;
  private onComplete?: (finalScore: number, bucket: string | null) => void;
  private onTimeExpired?: (index: number) => void;
  private onTotalTimeExpired?: () => void;
  private timeLimitPerQuestion: number | null;
  private totalTimeLimit: number | null;
  private shuffleQuestions: boolean;
  private shuffleChoices: boolean;
  private questionTags: string[];
  private questionsPerTag: number;
  private scoringBuckets: ScoringBucket[];
  private storageKey: string | null;
  private storageNamespace: string;
  private startTimestamp: number | null = null;
  private encryptStorage: boolean;
  private reviewMode: boolean;
  private questions: Question[];
  private currentQuestionIndex: number;
  private totalScore: number;
  private maxPossibleScore: number;
  private status: "idle" | "started" | "in-progress" | "completed";
  private timer: ReturnType<typeof setTimeout> | null;
  private totalTimer: ReturnType<typeof setTimeout> | null;
  private answerHistory: AnswerRecord[];

  constructor(config: QuizGameConfig) {
    const {
      questions = [],
      onStart,
      onQuestionChange,
      onAnswer,
      onComplete,
      onTimeExpired,
      onTotalTimeExpired,
      timeLimitPerQuestion = null,
      totalTimeLimit = null,
      shuffleQuestions = false,
      shuffleChoices = false,
      questionTags = [],
      questionsPerTag = 1,
      scoringBuckets = [],
    } = config;

    this.initialQuestions = questions;
    this.onStart = onStart;
    this.onQuestionChange = onQuestionChange;
    this.onAnswer = onAnswer;
    this.onComplete = onComplete;
    this.onTimeExpired = onTimeExpired;
    this.onTotalTimeExpired = onTotalTimeExpired;
    this.timeLimitPerQuestion = timeLimitPerQuestion;
    this.totalTimeLimit = totalTimeLimit;
    this.shuffleQuestions = shuffleQuestions;
    this.shuffleChoices = shuffleChoices;
    this.questionTags = questionTags;
    this.questionsPerTag = questionsPerTag;
    this.scoringBuckets = scoringBuckets;
    this.storageKey = config.storageKey ?? null;
    this.reviewMode = false;
    this.questions = this.buildQuestionPool();
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.maxPossibleScore = this.calculateMaxScore();
    this.status = "idle";
    this.timer = null;
    this.totalTimer = null;
    this.answerHistory = [];
    this.storageKey = config.storageKey ?? null;
    this.encryptStorage = config.encryptStorage ?? false;
    this.storageNamespace = config.storageNamespace ?? "quiz";
    this.encryptStorage = config.encryptStorage ?? false;
  }

  private encode(data: any): string {
    const json = JSON.stringify(data);
    return this.encryptStorage ? btoa(json) : json;
  }

  private decode(raw: string): any {
    try {
      const json = this.encryptStorage ? atob(raw) : raw;
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private getStorageKey(): string {
    return `${this.storageNamespace}:${this.storageKey}`;
  }

  private buildQuestionPool(): Question[] {
    if (!this.questionTags.length)
      return this.prepareQuestions([...this.initialQuestions]);

    const tagged: Question[] = [];
    for (const tag of this.questionTags) {
      const tagPool = this.initialQuestions.filter((q) =>
        q.tags?.includes(tag)
      );
      const sample = this.shuffleArray([...tagPool]).slice(
        0,
        this.questionsPerTag
      );
      tagged.push(...sample);
    }
    return this.prepareQuestions(tagged);
  }

  private prepareQuestions(questions: Question[]): Question[] {
    const shuffled = this.shuffleQuestions
      ? this.shuffleArray(questions)
      : questions;
    return shuffled.map((q) => ({
      ...q,
      choices: this.shuffleChoices
        ? this.shuffleArray([...q.choices])
        : [...q.choices],
    }));
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private calculateMaxScore(): number {
    return this.questions.reduce((sum, q) => {
      const max = Math.max(...q.choices.map((c) => c.score || 0));
      return sum + max;
    }, 0);
  }

  start(): void {
    this.status = "started";
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.answerHistory = [];
    this.questions = this.buildQuestionPool();
    this.maxPossibleScore = this.calculateMaxScore();
    this.status = this.questions.length > 0 ? "in-progress" : "completed";
    this.onStart?.();
    this.onQuestionChange?.(this.currentQuestionIndex);
    this.startTimer();
    this.startTotalTimer();
  }

  reset(): void {
    this.clearTimer();
    this.clearTotalTimer();
    this.status = "idle";
    this.currentQuestionIndex = 0;
    this.totalScore = 0;
    this.answerHistory = [];
    this.questions = this.buildQuestionPool();
    this.maxPossibleScore = this.calculateMaxScore();
  }

  private startTimer(): void {
    this.clearTimer();
    if (this.timeLimitPerQuestion) {
      this.timer = setTimeout(() => {
        this.onTimeExpired?.(this.currentQuestionIndex);
        this.submitAnswer(null);
      }, this.timeLimitPerQuestion * 1000);
    }
  }

  private startTotalTimer(): void {
    this.clearTotalTimer();
    if (this.totalTimeLimit) {
      this.totalTimer = setTimeout(() => {
        this.status = "completed";
        this.onTotalTimeExpired?.();
      }, this.totalTimeLimit * 1000);
    }
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private clearTotalTimer(): void {
    if (this.totalTimer) {
      clearTimeout(this.totalTimer);
      this.totalTimer = null;
    }
  }

  submitAnswer(choiceIndex: number | null): void {
    if (this.status !== "in-progress") return;

    this.clearTimer();

    const question = this.getCurrentQuestion();
    let score = 0;
    let choice: Choice | null = null;

    if (choiceIndex !== null && question.choices[choiceIndex]) {
      choice = question.choices[choiceIndex];
      score = choice.score || 0;
      this.totalScore += score;
    }

    this.answerHistory.push({
      questionIndex: this.currentQuestionIndex,
      choiceIndex,
      score,
    });
    this.onAnswer?.(choice, score);

    this.currentQuestionIndex++;
    if (this.currentQuestionIndex < this.questions.length) {
      this.onQuestionChange?.(this.currentQuestionIndex);
      this.startTimer();
    } else {
      this.status = "completed";
      this.clearTotalTimer();
      this.onComplete?.(this.getFinalScore(), this.getScoreBucket());
    }
  }

  getCurrentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  getTotalScore(): number {
    return this.totalScore;
  }

  getFinalScore(): number {
    if (this.maxPossibleScore === 0) return 0;
    return Math.round((this.totalScore / this.maxPossibleScore) * 100);
  }

  getScoreBucket(): string | null {
    const finalScore = this.getFinalScore();
    for (const bucket of this.scoringBuckets) {
      if (finalScore >= bucket.min && finalScore <= bucket.max) {
        return bucket.label;
      }
    }
    return null;
  }

  getStep(): number {
    return this.currentQuestionIndex;
  }

  getStatus(): string {
    return this.status;
  }

  getAnswerHistory(): AnswerRecord[] {
    return this.answerHistory;
  }
  saveState(): void {
    if (!this.storageKey) return;
    const state = {
      currentQuestionIndex: this.currentQuestionIndex,
      reviewMode: this.reviewMode,
      totalScore: this.totalScore,
      status: this.status,
      answerHistory: this.answerHistory,
      startTimestamp: this.startTimestamp,
      savedAt: Date.now(),
    };
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  loadState(): void {
    if (!this.storageKey) return;
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;

    try {
      const state = JSON.parse(raw);
      this.currentQuestionIndex = state.currentQuestionIndex;
      this.totalScore = state.totalScore;
      this.status = state.status;
      this.answerHistory = state.answerHistory ?? [];
      this.questions = this.buildQuestionPool();
      this.reviewMode = state.reviewMode ?? false;
      this.startTimestamp = state.startTimestamp ?? null;
      this.questions = this.buildQuestionPool();
      this.maxPossibleScore = this.calculateMaxScore();
    } catch {
      console.warn("Invalid saved state");
    }
  }

  enterReviewMode(): void {
    if (this.status !== "completed") return;
    this.reviewMode = true;
  }

  isInReviewMode(): boolean {
    return this.reviewMode;
  }

  getReviewData(): { question: Question; answer: AnswerRecord }[] {
    if (!this.reviewMode) return [];
    return this.answerHistory.map((record) => ({
      question: this.questions[record.questionIndex],
      answer: record,
    }));
  }
}

export default QuizGame;
