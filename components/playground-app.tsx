"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { DialogShell } from "@/components/dialog-shell";
import { ElementDetails } from "@/components/element-details";
import { GameView, gameHint } from "@/components/playground-games";
import { elements } from "@/lib/elements";
import {
  checkpointGame,
  dailyGame,
  deleteCreation,
  discoverElement,
  exportProgress,
  gameIds,
  gameRounds,
  getLevel,
  importProgress,
  initialLearningState,
  loadLearningState,
  recordGameAttempt,
  saveCreation,
  saveLearningState,
  type Creation,
  type GameId,
  type GameSession,
  type Theme,
} from "@/lib/learning";
import { checkGame, games, newGameSession, normalizeSession, sessionModel } from "@/lib/playground";
import { creationSvg, downloadText } from "@/lib/playground-export";
import { cleanupFeedback, feedback } from "@/lib/feedback";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

const totalRounds = Object.values(gameRounds).reduce((n, rounds) => n + rounds.length, 0);
const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
export function PlaygroundApp() {
  const [learning, setLearning] = useState(initialLearningState);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<GameSession | null>(null);
  const [past, setPast] = useState<GameSession[]>([]);
  const [future, setFuture] = useState<GameSession[]>([]);
  const [solved, setSolved] = useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState("");
  const [notice, setNotice] = useState("");
  const [inspect, setInspect] = useState<number | null>(null);
  const [settings, setSettings] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [daily, setDaily] = useState<ReturnType<typeof dailyGame> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const loaded = useRef(false);
  const resultRef = useRef(false);
  const reduced = useReducedMotionPreference();
  /* oxlint-disable react/set-state-in-effect -- Restore and checkpoint external device storage after hydration; report failed storage writes. */
  useEffect(() => {
    const state = loadLearningState();
    setLearning(state);
    const requested = new URLSearchParams(location.search).get("game");
    if (gameIds.includes(requested as GameId))
      setSession(
        state.playground.resume?.game === requested
          ? normalizeSession(state.playground.resume)
          : newGameSession(requested as GameId),
      );
    setDaily(dailyGame());
    setReady(true);
    loaded.current = true;
    const interval = setInterval(() => setDaily(dailyGame()), 30_000);
    return () => {
      clearInterval(interval);
      cleanupFeedback();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (learning.settings.theme) document.documentElement.dataset.theme = learning.settings.theme;
    else delete document.documentElement.dataset.theme;
    if (!saveLearningState(learning))
      setNotice("Device storage is unavailable. Keep a backup to retain your progress.");
  }, [ready, learning]);
  useEffect(() => {
    if (loaded.current && session) setLearning((state) => checkpointGame(state, session));
  }, [session]);
  useEffect(() => {
    if (!session?.timed || paused || solved || inspect !== null || settings || saveOpen) return;
    const interval = setInterval(() => {
      if (!document.hidden)
        setSession((current) =>
          current ? { ...current, elapsed: Math.min(86400, current.elapsed + 1) } : null,
        );
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.timed, paused, solved, inspect, settings, saveOpen]);
  /* oxlint-enable react/set-state-in-effect */
  const launch = (next: GameSession) => {
    window.history.replaceState(window.history.state, "", `/playground?game=${next.game}`);
    resultRef.current = false;
    setSession(normalizeSession(next));
    setSolved(false);
    setPaused(false);
    setPast([]);
    setFuture([]);
    setResult("");
    setNotice("");
    requestAnimationFrame(() => heading.current?.focus());
  };
  const change = (next: GameSession) => {
    if (!session) return;
    setPast((history) => [...history.slice(-29), session]);
    setFuture([]);
    setSession(next);
    setSolved(false);
    resultRef.current = false;
    setResult("");
    feedback("tap", learning.settings);
  };
  const undo = () => {
    const next = past.at(-1);
    if (!next || !session) return;
    setPast(past.slice(0, -1));
    setFuture([...future, session]);
    setSession({ ...next, elapsed: session.elapsed });
    setSolved(false);
    resultRef.current = false;
    setResult("");
  };
  const redo = () => {
    const next = future.at(-1);
    if (!next || !session) return;
    setFuture(future.slice(0, -1));
    setPast([...past, session]);
    setSession({ ...next, elapsed: session.elapsed });
    setSolved(false);
    resultRef.current = false;
    setResult("");
  };
  const inspectElement = (z: number) => {
    setInspect(z);
    setLearning((state) => discoverElement(state, z));
  };
  const check = () => {
    if (!session || resultRef.current) return;
    const answer = checkGame(session);
    const next = recordGameAttempt(learning, session, answer.correct);
    setLearning(next);
    setSolved(answer.correct);
    resultRef.current = answer.correct;
    setResult(
      answer.message +
        (answer.correct && !session.free
          ? next.xp > learning.xp
            ? ` +${next.xp - learning.xp} XP.`
            : " You already earned this round’s reward."
          : ""),
    );
    feedback(answer.correct ? "correct" : "incorrect", learning.settings);
  };
  const save = () => {
    if (!session) return;
    const creation: Creation = {
      id: crypto.randomUUID(),
      title: title.trim() || sessionModel(session).title,
      at: Date.now(),
      session: { ...session, free: true, daily: "", timed: false, elapsed: 0 },
    };
    setLearning((state) => saveCreation(state, creation));
    setSaveOpen(false);
    setNotice(`Saved “${creation.title}” to My lab.`);
  };
  const canSave =
    session &&
    (session.game === "atom" ||
      (session.game === "molecule" && checkGame(session).correct) ||
      (session.game === "crystal" && session.units > 0));
  const currentGame = session ? games.find((game) => game.id === session.game)! : null;
  const completed = learning.playground.completed.length;
  const touchedGames = gameIds.filter((id) =>
    learning.playground.completed.some((key) => key.startsWith(`${id}:`)),
  ).length;
  return (
    <div className="playground-page" data-ready={ready}>
      <a className="skip-link" href="#playground-main">
        Skip to playground
      </a>
      <header className="playground-header">
        <a href="/" className="game-brand" aria-label="Elementals home">
          <Icon name="sandbox" />
          <span>
            Elementals <b>playground</b>
          </span>
        </a>
        <div className="game-toolbar">
          <span className="game-xp n">{learning.xp} XP</span>
          <Button
            variant="unstyled"
            className="icon-button"
            aria-label="Playground settings"
            aria-haspopup="dialog"
            onClick={() => setSettings(true)}
          >
            <Icon name="settings" />
          </Button>
        </div>
      </header>
      <main id="playground-main" className="playground-main">
        {session && currentGame ? (
          <>
            <div className="game-heading">
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label="Back to game hub"
                onClick={() => {
                  window.history.replaceState(window.history.state, "", "/playground");
                  setSession(null);
                  setResult("");
                  setNotice("");
                }}
              >
                <Icon name="previous" />
              </Button>
              <div>
                <span className="eyebrow">
                  {session.free ? "Free play" : session.daily ? "Daily challenge" : "Challenge"} ·{" "}
                  <span className="n">
                    {session.index + 1}/{gameRounds[session.game].length}
                  </span>
                </span>
                <h1 tabIndex={-1} ref={heading}>
                  {currentGame.title}
                </h1>
              </div>
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label={paused ? "Resume animations and timer" : "Pause animations and timer"}
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                <Icon name={paused ? "play" : "pause"} />
              </Button>
            </div>
            <div className="game-options">
              <label>
                <span className="sr-only">Round</span>
                <select
                  className="form-input"
                  aria-label="Round"
                  value={session.index}
                  onChange={(e) =>
                    launch(newGameSession(session.game, Number(e.target.value), session.free))
                  }
                >
                  {gameRounds[session.game].map((round, i) => (
                    <option key={round} value={i}>
                      {i + 1}. {round.replaceAll("-", " ")}
                      {learning.playground.completed.includes(`${session.game}:${round}`)
                        ? " ✓"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              {["molecule", "atom", "crystal"].includes(session.game) && (
                <Button
                  variant="unstyled"
                  className="action-button"
                  aria-pressed={session.free}
                  onClick={() => launch(newGameSession(session.game, session.index, !session.free))}
                >
                  {session.free ? "Play challenge" : "Free play"}
                </Button>
              )}
              <label className="game-toggle">
                <input
                  type="checkbox"
                  checked={session.timed}
                  onChange={(e) => setSession({ ...session, timed: e.target.checked, elapsed: 0 })}
                />{" "}
                Optional timer
              </label>
              {session.timed && (
                <span className="n game-time" aria-label={`Elapsed ${session.elapsed} seconds`}>
                  {formatTime(session.elapsed)}
                  {paused ? " · paused" : ""}
                </span>
              )}
            </div>
            <Card variant="unstyled" className="game-workspace">
              <GameView
                key={`${session.game}:${session.index}`}
                session={session}
                onChange={change}
                onInspect={inspectElement}
                paused={paused || inspect !== null || settings || saveOpen}
                settings={learning.settings}
                solved={solved && !session.free}
              />
              {session.hints > 0 && (
                <p className="game-hint" role="note">
                  {gameHint(session)}
                </p>
              )}
              <div className="game-actions">
                <div className="game-toolbar">
                  <Button
                    variant="unstyled"
                    className="icon-button"
                    aria-label="Undo"
                    disabled={!past.length}
                    onClick={undo}
                  >
                    <Icon name="previous" />
                  </Button>
                  <Button
                    variant="unstyled"
                    className="icon-button"
                    aria-label="Redo"
                    disabled={!future.length}
                    onClick={redo}
                  >
                    <Icon name="next" />
                  </Button>
                  <Button
                    variant="unstyled"
                    className="icon-button"
                    aria-label="Reset round"
                    onClick={() =>
                      launch(
                        newGameSession(session.game, session.index, session.free, session.daily),
                      )
                    }
                  >
                    <Icon name="reset" />
                  </Button>
                  <Button
                    variant="unstyled"
                    className="icon-button"
                    aria-label="Reveal hint"
                    disabled={solved || session.hints >= (session.game === "mystery" ? 3 : 1)}
                    onClick={() => {
                      setSession({ ...session, hints: session.hints + 1 });
                    }}
                  >
                    <Icon name="help" />
                  </Button>
                  {canSave && (
                    <Button
                      variant="unstyled"
                      className="icon-button"
                      aria-label="Save creation"
                      onClick={() => {
                        setTitle(sessionModel(session).title);
                        setSaveOpen(true);
                      }}
                    >
                      <Icon name="favorite" />
                    </Button>
                  )}
                </div>
                {!session.free && (
                  <Button
                    variant="unstyled"
                    className="action-button game-primary"
                    disabled={solved}
                    onClick={check}
                  >
                    Check answer
                  </Button>
                )}
                {solved && (
                  <Button
                    aria-label="Next round"
                    variant="unstyled"
                    className="action-button game-primary"
                    onClick={() =>
                      launch(
                        newGameSession(
                          session.game,
                          (session.index + 1) % gameRounds[session.game].length,
                        ),
                      )
                    }
                  >
                    <Icon name="next" />
                  </Button>
                )}
              </div>
              <div
                role="status"
                aria-live="polite"
                className={`game-result${solved ? " game-result-correct" : ""}`}
              >
                {result && (
                  <>
                    <strong>{solved ? "Solved!" : "Keep experimenting"}</strong>
                    <p>{result}</p>
                  </>
                )}
              </div>
            </Card>
            <p className="game-footnote">
              Challenges earn 20 XP on first completion. Daily challenges add 10 XP once per UTC
              day. Hints are always available; only unhinted timed solves set personal bests. Free
              play has no score.
            </p>
          </>
        ) : (
          <>
            <motion.div className="playground-intro" initial={false} animate={{ opacity: 1 }}>
              <span className="eyebrow">A little science. A lot of play.</span>
              <h1>Make something click.</h1>
              <p>
                Build molecules, solve mysteries and discover the elements in your everyday world.
                Eight games. Your pace. Every discovery counts.
              </p>
            </motion.div>
            <div className="playground-overview">
              <Card variant="unstyled" className="game-daily-card">
                <Icon name="spark" />
                <div>
                  <span className="eyebrow">Today’s challenge · UTC</span>
                  <h2>
                    {daily
                      ? games.find((game) => game.id === daily.game)?.title
                      : "Daily science challenge"}
                  </h2>
                  <p>
                    {daily && learning.playground.dailyClaims.includes(daily.date)
                      ? "Today’s bonus is earned. You can still play again."
                      : "One small challenge, a fresh daily bonus. +10 XP."}
                  </p>
                </div>
                <Button
                  variant="unstyled"
                  className="action-button game-primary"
                  disabled={!ready || !daily}
                  onClick={() => {
                    if (daily) launch(newGameSession(daily.game, daily.index, false, daily.date));
                  }}
                >
                  Play daily
                </Button>
              </Card>
              <Card variant="unstyled" className="game-progress-card">
                <span className="eyebrow">Your playground</span>
                <strong className="n">
                  {completed}
                  <small>/{totalRounds}</small>
                </strong>
                <progress
                  value={completed}
                  max={totalRounds}
                  aria-label="Playground rounds completed"
                />
                <p>Rounds solved · Level {getLevel(learning.xp).level}</p>
                {learning.playground.resume && (
                  <Button
                    variant="unstyled"
                    className="action-button"
                    onClick={() => launch(learning.playground.resume!)}
                  >
                    Continue {games.find((g) => g.id === learning.playground.resume?.game)?.title}
                  </Button>
                )}
              </Card>
            </div>
            <section aria-labelledby="game-list-title">
              <h2 id="game-list-title">Choose your next experiment</h2>
              <div className="playground-grid">
                {games.map((game, i) => {
                  const count = learning.playground.completed.filter((key) =>
                    key.startsWith(`${game.id}:`),
                  ).length;
                  const stats = learning.playground.stats[game.id];
                  return (
                    <motion.div
                      key={game.id}
                      initial={false}
                      whileHover={reduced ? undefined : { y: -3 }}
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    >
                      <Card variant="unstyled" className="playground-game-card">
                        <div className="game-card-top">
                          <span className="game-card-icon">
                            <Icon name={game.icon} />
                          </span>
                          <span className="eyebrow n">0{i + 1}</span>
                        </div>
                        <h3>{game.title}</h3>
                        <p>{game.description}</p>
                        <div className="game-card-mastery">
                          <span className="n">
                            {count}/{gameRounds[game.id].length}
                          </span>
                          <span>
                            {count === gameRounds[game.id].length
                              ? "All rounds solved ✓"
                              : "Rounds solved"}
                          </span>
                        </div>
                        <progress
                          value={count}
                          max={gameRounds[game.id].length}
                          aria-label={`${game.title} mastery`}
                        />
                        {stats.best !== null && (
                          <p className="game-best">
                            Best unhinted time <span className="n">{formatTime(stats.best)}</span>
                          </p>
                        )}
                        <Button
                          variant="unstyled"
                          className="icon-button game-card-play"
                          aria-label={`Play ${game.title}`}
                          disabled={!ready}
                          onClick={() => launch(newGameSession(game.id))}
                        >
                          <Icon name="play" />
                        </Button>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>
            <section className="game-achievements" aria-labelledby="game-achievements-title">
              <h2 id="game-achievements-title">Small wins, lasting curiosity</h2>
              <div className="game-badge-row">
                <span className={completed > 0 ? "earned" : ""}>
                  <Icon name="award" />
                  First discovery {completed > 0 ? "✓" : "· solve one round"}
                </span>
                <span className={touchedGames === 8 ? "earned" : ""}>
                  <Icon name="spark" />
                  All-round explorer <b className="n">{touchedGames}/8</b>
                </span>
                <span className={completed === totalRounds ? "earned" : ""}>
                  <Icon name="sandbox" />
                  Lab master{" "}
                  <b className="n">
                    {completed}/{totalRounds}
                  </b>
                </span>
              </div>
            </section>
            <section className="game-collection" aria-labelledby="my-lab-title">
              <div className="game-section-heading">
                <h2 id="my-lab-title">My lab</h2>
                <span className="n">{learning.playground.creations.length}/24</span>
              </div>
              <p className="panel-copy">
                Save molecules, particle compositions and crystal cutaways. Reopen them to
                experiment, or download a vector illustration.
              </p>
              {!learning.playground.creations.length ? (
                <div className="game-empty-lab">
                  <Icon name="favorite" />
                  <p>
                    Your first creation starts with a little curiosity. Build a model, then use the
                    heart to save it here.
                  </p>
                  <Button
                    variant="unstyled"
                    className="action-button"
                    disabled={!ready}
                    onClick={() => launch(newGameSession("molecule"))}
                  >
                    Build a molecule
                  </Button>
                </div>
              ) : (
                <div className="game-creation-grid">
                  {[...learning.playground.creations].reverse().map((creation) => {
                    const model = sessionModel(normalizeSession(creation.session));
                    return (
                      <Card variant="unstyled" className="game-creation" key={creation.id}>
                        <CreationPreview creation={creation} />
                        <h3>{creation.title}</h3>
                        <p>{model.title}</p>
                        <div className="game-toolbar">
                          <Button
                            variant="unstyled"
                            className="action-button"
                            onClick={() => launch(creation.session)}
                          >
                            Reopen
                          </Button>
                          <Button
                            variant="unstyled"
                            className="icon-button"
                            aria-label={`Export ${creation.title} as SVG`}
                            onClick={() =>
                              downloadText(
                                creationSvg(creation),
                                `elementals-${creation.id}.svg`,
                                "image/svg+xml",
                              )
                            }
                          >
                            <Icon name="share" />
                          </Button>
                          <Button
                            variant="unstyled"
                            className="icon-button"
                            aria-label={`Delete ${creation.title}`}
                            onClick={() => {
                              setLearning((state) => deleteCreation(state, creation.id));
                              setNotice(`Deleted “${creation.title}”.`);
                            }}
                          >
                            <Icon name="close" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
            <p className="game-footnote">
              Progress stays on this device. Export a backup in settings to keep your discoveries
              and saved creations. <a href="/elements">Browse all 118 elements</a> ·{" "}
              <a href="/welcome">How to explore</a>
            </p>
          </>
        )}
        <p className="game-notice" role="status">
          {notice}
        </p>
      </main>
      <DialogShell
        open={inspect !== null}
        onOpenChange={(open) => {
          if (!open) setInspect(null);
        }}
        title={inspect ? `${elements[inspect - 1].n} details` : "Element details"}
      >
        {inspect && (
          <ElementDetails
            element={elements[inspect - 1]}
            close={() => setInspect(null)}
            onPick={(z) => inspectElement(z)}
          />
        )}
      </DialogShell>
      <DialogShell open={saveOpen} onOpenChange={setSaveOpen} title="Save your creation">
        <div className="panel-content">
          <div className="game-section-heading">
            <h2>Save your creation</h2>
            <Button
              variant="unstyled"
              className="icon-button"
              aria-label="Close save dialog"
              onClick={() => setSaveOpen(false)}
            >
              <Icon name="close" />
            </Button>
          </div>
          <label className="field-group" htmlFor="creation-name">
            <span className="field-label">Creation name</span>
            <Input
              id="creation-name"
              data-autofocus
              variant="unstyled"
              className="form-input"
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
            />
          </label>
          <p className="panel-copy">
            Saved locally with your progress. Your lab holds the latest 24 creations.
          </p>
          <Button variant="unstyled" className="action-button game-primary" onClick={save}>
            Save to My lab
          </Button>
        </div>
      </DialogShell>
      <DialogShell open={settings} onOpenChange={setSettings} title="Playground settings">
        <div className="panel-content">
          <div className="game-section-heading">
            <h2>Playground settings</h2>
            <Button
              variant="unstyled"
              className="icon-button"
              aria-label="Close settings"
              onClick={() => setSettings(false)}
            >
              <Icon name="close" />
            </Button>
          </div>
          <label className="field-group">
            <span className="field-label">Appearance</span>
            <select
              className="form-input"
              aria-label="Appearance"
              value={learning.settings.theme}
              onChange={(e) =>
                setLearning((state) => ({
                  ...state,
                  settings: { ...state.settings, theme: e.target.value as Theme },
                }))
              }
            >
              {[
                ["", "System"],
                ["day", "Day"],
                ["midnight", "Midnight"],
                ["dusk", "Dusk"],
                ["noir", "Noir · grayscale"],
              ].map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="game-toggle">
            <input
              type="checkbox"
              checked={learning.settings.sound}
              onChange={(e) =>
                setLearning((state) => ({
                  ...state,
                  settings: { ...state.settings, sound: e.target.checked },
                }))
              }
            />{" "}
            Sound effects
          </label>
          <label className="game-toggle">
            <input
              type="checkbox"
              checked={learning.settings.haptics}
              onChange={(e) =>
                setLearning((state) => ({
                  ...state,
                  settings: { ...state.settings, haptics: e.target.checked },
                }))
              }
            />{" "}
            Haptic feedback where supported
          </label>
          <label className="field-group">
            <span className="field-label">3D quality</span>
            <select
              className="form-input"
              aria-label="3D quality"
              value={learning.settings.quality}
              onChange={(e) =>
                setLearning((state) => ({
                  ...state,
                  settings: {
                    ...state.settings,
                    quality: e.target.value as "auto" | "low" | "high",
                  },
                }))
              }
            >
              <option value="auto">Automatic</option>
              <option value="low">Low · save power</option>
              <option value="high">High</option>
            </select>
          </label>
          <p className="panel-copy">
            Motion follows your device’s reduced-motion setting. Pause any game to stop its
            animation and timer.
          </p>
          <Button
            variant="unstyled"
            className="action-button"
            onClick={() =>
              downloadText(exportProgress(learning), "elementals-progress.json", "application/json")
            }
          >
            Export progress backup
          </Button>
          <label className="field-group" htmlFor="playground-backup">
            <span className="field-label">Restore a progress backup</span>
            <Input
              variant="unstyled"
              className="form-input"
              id="playground-backup"
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 1_000_000) {
                  setNotice("Choose a backup smaller than 1 MB.");
                  return;
                }
                try {
                  const restored = importProgress(await file.text());
                  setLearning(restored);
                  setSession(null);
                  setSettings(false);
                  setNotice("Progress restored, including your playground and saved creations.");
                } catch (error) {
                  setNotice(
                    error instanceof Error ? error.message : "Unable to restore this backup.",
                  );
                }
              }}
            />
          </label>
          <p role="status" className="panel-copy">
            {notice}
          </p>
          <a className="action-button" href="/welcome">
            Replay the onboarding
          </a>
        </div>
      </DialogShell>
    </div>
  );
}
function CreationPreview({ creation }: { creation: Creation }) {
  const model = sessionModel(normalizeSession(creation.session));
  const point = (i: number) => {
    const position = model.atoms[i].position;
    return [150 + position[0] * 34 + position[2] * 10, 83 - position[1] * 34 + position[2] * 8];
  };
  return (
    <svg viewBox="0 0 300 166" role="img" aria-label={model.title}>
      {model.bonds.map((bond, i) => (
        <line
          key={i}
          x1={point(bond.a)[0]}
          y1={point(bond.a)[1]}
          x2={point(bond.b)[0]}
          y2={point(bond.b)[1]}
          stroke="currentColor"
          strokeWidth={bond.order ? bond.order * 2 : 2}
          opacity=".4"
        />
      ))}
      {model.atoms.map((atom, i) =>
        atom.ghost ? null : (
          <g key={i}>
            <circle
              cx={point(i)[0]}
              cy={point(i)[1]}
              r={atom.kind ? 4 : 12}
              fill="var(--accent-soft)"
              stroke="currentColor"
            />
            {!atom.kind && (
              <text
                x={point(i)[0]}
                y={point(i)[1] + 4}
                textAnchor="middle"
                fill="currentColor"
                fontSize={11}
                fontFamily="monospace"
              >
                {elements[atom.z - 1].s}
              </text>
            )}
          </g>
        ),
      )}
    </svg>
  );
}
