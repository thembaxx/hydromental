"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { elements } from "@/lib/elements";
import {
  getAchievements,
  getCollections,
  getDailyMissions,
  getDueElements,
  getLearningStreak,
  getLevel,
  type LearningState,
} from "@/lib/learning";

export interface LearningHubProps {
  state: LearningState;
  onPick: (z: number) => void;
  onQuiz: (mode: "standard" | "review" | "mystery" | "where") => void;
  onClaim: (id: string) => void;
  onExport: () => void;
  onImport: (text: string) => void;
}

export function LearningHub({
  state,
  onPick,
  onQuiz,
  onClaim,
  onExport,
  onImport,
}: LearningHubProps) {
  const [importFeedback, setImportFeedback] = useState("");
  const level = getLevel(state.xp);
  const due = getDueElements(state);
  const streak = getLearningStreak(state);
  const mastered = Object.values(state.mastery).filter(
    (item) => item.correct >= 3 && item.correct > item.wrong,
  ).length;
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 1_000_000) {
      setImportFeedback("Please choose a progress JSON file smaller than 1 MB.");
      return;
    }
    try {
      onImport(await file.text());
      setImportFeedback("Progress file processed. Check your updated learning totals.");
    } catch (error) {
      setImportFeedback(
        error instanceof Error ? error.message : "This progress file could not be imported.",
      );
    }
  }
  return (
    <div className="panel-content">
      <div className="stat-grid">
        <Card variant="unstyled" className="stat">
          <strong>{state.discovered.length}/118</strong>
          <span>Discovered</span>
        </Card>
        <Card variant="unstyled" className="stat">
          <strong>{mastered}</strong>
          <span>Practiced well</span>
        </Card>
        <Card variant="unstyled" className="stat">
          <strong>{streak}</strong>
          <span>Learning days</span>
        </Card>
      </div>
      <section className="panel-section">
        <h3 className="panel-title">
          Level {level.level} · {level.title}
        </h3>
        <progress
          className="learning-progress"
          value={level.progress}
          max={1}
          aria-label="Progress toward the next level"
        />
        <p className="panel-copy">
          {state.xp} XP total · {state.xp - level.currentXp} / {level.nextLevelXp - level.currentXp}{" "}
          XP toward your next level. A one-day break keeps your learning streak alive.
        </p>
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Today’s missions</h3>
        <p className="panel-copy">
          Small discoveries, lasting understanding. Missions refresh each day in UTC.
        </p>
        <div className="feature-grid">
          {getDailyMissions(state).map((mission) => (
            <Card variant="unstyled" className="feature-card" key={mission.id}>
              <h4>{mission.title}</h4>
              <p className="panel-copy">{mission.description}</p>
              <progress
                className="learning-progress"
                value={mission.progress}
                max={mission.target}
                aria-label={`${mission.title} progress`}
              />
              <p className="panel-copy">
                {mission.progress}/{mission.target} · +{mission.reward} XP
              </p>
              <Button
                variant="unstyled"
                className="action-button"
                disabled={!mission.complete || mission.claimed}
                onClick={() => onClaim(mission.id)}
              >
                {mission.claimed
                  ? "Reward claimed"
                  : mission.complete
                    ? "Claim reward"
                    : "In progress"}
              </Button>
            </Card>
          ))}
        </div>
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Play to learn</h3>
        <div className="feature-grid">
          {(
            [
              ["standard", "Element quiz", "Build confidence with names and symbols."],
              [
                "review",
                "Practice again",
                `${due.length} element${due.length === 1 ? "" : "s"} ready for a spaced review.`,
              ],
              ["mystery", "Mystery element", "Follow scientific clues to uncover an element."],
              ["where", "Find it in real life", "Connect the periodic table to everyday objects."],
            ] as const
          ).map(([mode, title, description]) => (
            <Card variant="unstyled" className="feature-card" key={mode}>
              <h4>{title}</h4>
              <p className="panel-copy">{description}</p>
              <Button
                variant="unstyled"
                className="action-button"
                onClick={() => onQuiz(mode)}
                disabled={mode === "review" && due.length === 0}
              >
                {mode === "review" && due.length === 0 ? "Reviews up to date" : "Start challenge"}
              </Button>
            </Card>
          ))}
        </div>
        {due.length > 0 && (
          <div className="element-chips" aria-label="Elements ready for review">
            {due.slice(0, 12).map((z) => (
              <Button
                variant="unstyled"
                className="action-button"
                key={z}
                onClick={() => onPick(z)}
              >
                {elements[z - 1].s} · Review
              </Button>
            ))}
          </div>
        )}
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Your favorites</h3>
        {state.favorites.length ? (
          <div className="element-chips">
            {state.favorites.map((z) => (
              <Button
                variant="unstyled"
                className="action-button"
                key={z}
                onClick={() => onPick(z)}
              >
                {elements[z - 1].s} · {elements[z - 1].n}
              </Button>
            ))}
          </div>
        ) : (
          <p className="panel-copy">Save an element with the favorite button while you explore.</p>
        )}
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Recently explored</h3>
        {state.history.length ? (
          <div className="element-chips">
            {[...new Set([...state.history].reverse().map((item) => item.z))]
              .slice(0, 10)
              .map((z) => (
                <Button
                  variant="unstyled"
                  className="action-button"
                  key={z}
                  onClick={() => onPick(z)}
                >
                  {elements[z - 1].s} · {elements[z - 1].n}
                </Button>
              ))}
          </div>
        ) : (
          <p className="panel-copy">Your exploration history will appear here.</p>
        )}
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Collections & expeditions</h3>
        <div className="feature-grid">
          {getCollections(state).map((collection) => (
            <Card variant="unstyled" className="feature-card" key={collection.id}>
              <Badge variant="unstyled" className="tag">
                {collection.complete && (
                  <HugeiconsIcon icon={Tick02Icon} size={16} aria-hidden="true" />
                )}
                {collection.kind === "family" ? "Element family" : "Guided expedition"}
              </Badge>
              <h4>{collection.title}</h4>
              <p className="panel-copy">{collection.description}</p>
              <p className="panel-copy">
                {collection.discovered}/{collection.total} discovered
              </p>
              <progress
                className="learning-progress"
                value={collection.discovered}
                max={collection.total}
                aria-label={`${collection.title} discovery progress`}
              />
              <div className="element-chips">
                {collection.elements.map((z) => (
                  <Button
                    variant="unstyled"
                    className="action-button"
                    key={z}
                    onClick={() => onPick(z)}
                    aria-label={`Explore ${elements[z - 1].n}`}
                  >
                    {elements[z - 1].s}
                    {state.discovered.includes(z) ? " ✓" : ""}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Milestones</h3>
        <div className="feature-grid">
          {getAchievements(state).map((achievement) => (
            <Card variant="unstyled" className="feature-card" key={achievement.id}>
              <Badge variant="unstyled" className="tag">
                {achievement.earned ? "Earned" : "In progress"}
              </Badge>
              <h4>{achievement.title}</h4>
              <p className="panel-copy">{achievement.description}</p>
              <p className="panel-copy">
                {Math.min(achievement.progress, achievement.target)}/{achievement.target}
              </p>
            </Card>
          ))}
        </div>
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Take your progress with you</h3>
        <p className="panel-copy">
          Export a backup, then import it on another device. Your progress stays local; importing
          replaces this device’s progress.
        </p>
        <Button variant="unstyled" className="action-button" onClick={onExport}>
          Export progress
        </Button>
        <label className="field-label" htmlFor="progress-import">
          Import progress JSON
        </label>
        <Input
          variant="unstyled"
          className="form-input"
          id="progress-import"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void importFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <p className="panel-copy" role="status">
          {importFeedback}
        </p>
      </section>
    </div>
  );
}
