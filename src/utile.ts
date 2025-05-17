import { AnswerRecord, Question } from "./QuizGame";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatScore(score: number): string {
  return `${clamp(score, 0, 100)}%`;
}

export function groupAnswersByTag(
  questions: Question[],
  answers: AnswerRecord[]
) {
  const result: Record<string, AnswerRecord[]> = {};

  answers.forEach((answer) => {
    const question = questions[answer.questionIndex];
    question.tags?.forEach((tag) => {
      if (!result[tag]) result[tag] = [];
      result[tag].push(answer);
    });
  });

  return result;
}

export function averageScore(records: AnswerRecord[]): number {
  if (!records.length) return 0;
  const total = records.reduce((sum, r) => sum + r.score, 0);
  return total / records.length;
}
