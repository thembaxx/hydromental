"use client";

import { useEffect, useRef, useState } from "react";
import { elements, categories, period, type Element } from "@/lib/elements";
import { getScience } from "@/lib/science";
import { getDueElements, type LearningState } from "@/lib/learning";
import { Button } from "@/components/ui/button";
import { CardContent, CardTitle } from "@/components/ui/card";
import { MotionQuizCard } from "@/components/motion-quiz-card";
import { Icon } from "@/components/ui/icon";

export type QuizMode = "standard" | "review" | "mystery" | "where";
type Question = {
  element: Element;
  type: number;
  answer: string;
  options: string[];
  clue?: string;
};
function makeQuestion(state: LearningState, mode: QuizMode): Question {
  const due = mode === "review" ? getDueElements(state) : [];
  const pool = due.length
    ? due
    : state.discovered.length >= 6
      ? state.discovered
      : elements.map((element) => element.z);
  const element =
    elements[(due.length ? pool[0] : pool[Math.floor(Math.random() * pool.length)]) - 1];
  const type = mode === "mystery" ? 3 : mode === "where" ? 4 : Math.floor(Math.random() * 3);
  const key = (["s", "n", "z"] as const)[Math.min(type, 1)];
  const answer = type === 2 ? String(element.z) : type >= 3 ? element.n : String(element[key]);
  const options = new Set([answer]);
  while (options.size < 4) {
    const other = elements[Math.floor(Math.random() * elements.length)];
    options.add(type === 2 ? String(other.z) : type >= 3 ? other.n : String(other[key]));
  }
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const science = getScience(element.z);
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const clue =
    type === 3
      ? `I belong to the ${categories[element.c][0].toLowerCase()} family, live in period ${period(element)}, and my atomic number is between ${Math.max(1, element.z - 3)} and ${Math.min(118, element.z + 3)}.`
      : type === 4
        ? science.everyday
            .replace(new RegExp(`\\b${escape(element.n)}\\b`, "gi"), "this element")
            .replace(new RegExp(`\\b${escape(element.s)}\\b`, "g"), "the element")
        : undefined;
  return { element, type, answer, options: shuffled, clue };
}

export function ElementQuiz({
  state,
  mode,
  close,
  result,
}: {
  state: LearningState;
  mode: QuizMode;
  close: () => void;
  result: (z: number, correct: boolean) => void;
}) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sequence, setSequence] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answered = useRef(false);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  const next = () => {
    if (timer.current) clearTimeout(timer.current);
    setQuestion(makeQuestion(latest.current, mode));
    setSelected(null);
    setSequence((value) => value + 1);
    answered.current = false;
  };
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Random questions are generated only after browser hydration.
    setQuestion(makeQuestion(latest.current, mode));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [mode]);
  const answer = (value: string) => {
    if (answered.current || !question) return;
    answered.current = true;
    setSelected(value);
    result(question.element.z, value === question.answer);
    timer.current = setTimeout(() => {
      setQuestion(makeQuestion(latest.current, mode));
      setSelected(null);
      setSequence((v) => v + 1);
      answered.current = false;
    }, 2500);
  };
  const names = {
    standard: "Quick quiz",
    review: "Spaced review",
    mystery: "Mystery element",
    where: "Everyday clues",
  };
  return (
    <div id="qz" className="sheet open">
      <div className="dh">
        <div>
          <span id="qs" className="eyebrow n">
            Streak {state.quizStreak}
          </span>
          <h2>{names[mode]}</h2>
        </div>
        <Button
          variant="unstyled"
          id="qx"
          className="icon-button"
          aria-label="Close"
          onClick={close}
        >
          <Icon name="close" />
        </Button>
      </div>
      <p className="panel-copy quiz-intro">
        {mode === "review"
          ? "Revisit what is due, with difficult concepts first."
          : "Small discoveries add up. Correct answers build mastery; XP rewards each element once per UTC day."}
      </p>
      <MotionQuizCard
        key={question ? `${question.element.z}-${question.type}-${sequence}` : "loading"}
      >
        <CardTitle variant="unstyled" id="qq">
          {question &&
            (question.type === 0 ? (
              <>
                Symbol for <b>{question.element.n}</b>?
              </>
            ) : question.type === 1 ? (
              <>
                Which element is <b className="n">{question.element.s}</b>?
              </>
            ) : question.type === 2 ? (
              <>
                Atomic number of <b>{question.element.n}</b>?
              </>
            ) : question.type === 3 ? (
              "Who is this mystery element?"
            ) : (
              "Which element appears in this everyday clue?"
            ))}
        </CardTitle>
        {question?.clue && <p className="quiz-clue">{question.clue}</p>}
        <CardContent variant="unstyled" id="qa">
          {question?.options.map((value) => (
            <Button
              variant="unstyled"
              key={value}
              className={`opt ${selected && value === question.answer ? "ok" : selected === value ? "no" : ""}`}
              disabled={selected !== null}
              onClick={() => answer(value)}
            >
              {value}
            </Button>
          ))}
        </CardContent>
      </MotionQuizCard>
      {selected && question && (
        <div className="quiz-explanation" role="status">
          <b>
            {selected === question.answer ? "Nicely spotted." : `The answer is ${question.answer}.`}
          </b>
          <p>{getScience(question.element.z).fact}</p>
          <Button variant="unstyled" className="action-button" onClick={next}>
            Next question <Icon name="next" />
          </Button>
        </div>
      )}
    </div>
  );
}
