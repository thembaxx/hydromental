"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { elements, categories } from "@/lib/elements";
import { sandboxRecipes } from "@/lib/science";

export function SandboxPanel({ onPick }: { onPick: (z: number) => void }) {
  const [recipeId, setRecipeId] = useState(sandboxRecipes[0].id);
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const recipe = sandboxRecipes.find((item) => item.id === recipeId) ?? sandboxRecipes[0];
  const count = recipe.atomicNumbers.length;
  const points = recipe.atomicNumbers.map((z, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const radius = connected ? 65 : 115;
    return { z, x: 180 + Math.cos(angle) * radius, y: 155 + Math.sin(angle) * radius };
  });
  return (
    <div className="panel-content">
      <p className="panel-copy">
        Explore curated combinations that connect elements to familiar materials. This is a concept
        playground with symbolic shapes; positions, proportions, and bonds are illustrative.
      </p>
      <label className="field-label" htmlFor="sandbox-recipe">
        Choose a combination
      </label>
      <select
        className="form-input"
        id="sandbox-recipe"
        value={recipeId}
        onChange={(event) => {
          setRecipeId(event.target.value);
          setConnected(false);
          setSelected(null);
        }}
      >
        {sandboxRecipes.map((item) => (
          <option value={item.id} key={item.id}>
            {item.title} · {item.formula}
          </option>
        ))}
      </select>
      <Card variant="unstyled" className="feature-card sandbox-illustration">
        <Badge variant="unstyled" className="tag">
          Illustrative model
        </Badge>
        <svg
          viewBox="0 0 360 310"
          role="img"
          aria-label={`${recipe.title}: ${connected ? "connected" : "separated"} element symbols`}
        >
          <title>{recipe.title} concept illustration</title>
          {connected &&
            points
              .slice(1)
              .map((point, index) => (
                <line
                  key={index}
                  x1={points[0].x}
                  y1={points[0].y}
                  x2={point.x}
                  y2={point.y}
                  stroke="currentColor"
                  opacity="0.3"
                  strokeWidth="4"
                />
              ))}
          {points.map((point, index) => (
            <motion.g
              key={`${recipe.id}-${index}`}
              initial={false}
              animate={{ x: point.x, y: point.y }}
              transition={
                reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 22 }
              }
            >
              <circle
                r={selected === point.z ? 38 : 32}
                fill={categories[elements[point.z - 1].c][1]}
                opacity="0.9"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#0d1324"
                fontSize="24"
                fontWeight="700"
              >
                {elements[point.z - 1].s}
              </text>
            </motion.g>
          ))}
        </svg>
        <h3 className="panel-title">{recipe.title}</h3>
        <p className="sandbox-formula">{recipe.formula}</p>
        <p className="panel-copy">{recipe.explanation}</p>
      </Card>
      <div className="segmented">
        <Button
          variant="unstyled"
          className="action-button"
          aria-pressed={connected}
          onClick={() => setConnected((value) => !value)}
        >
          {connected ? "Separate symbols" : "Connect symbols"}
        </Button>
        <Button
          variant="unstyled"
          className="action-button"
          onClick={() => {
            setConnected(false);
            setSelected(null);
          }}
        >
          Reset illustration
        </Button>
      </div>
      <section className="panel-section">
        <h3 className="panel-title">Meet the ingredients</h3>
        <div className="element-chips">
          {recipe.atomicNumbers.map((z) => (
            <Button
              variant="unstyled"
              className="action-button"
              key={z}
              aria-pressed={selected === z}
              onClick={() => setSelected(selected === z ? null : z)}
            >
              {elements[z - 1].s} · {elements[z - 1].n}
            </Button>
          ))}
        </div>
        {selected && (
          <div className="feature-card">
            <p className="panel-copy">
              {elements[selected - 1].n} belongs to the{" "}
              {categories[elements[selected - 1].c][0].toLowerCase()} family. The illustration
              highlights its symbol; molecular structure requires more detailed models.
            </p>
            <Button variant="unstyled" className="action-button" onClick={() => onPick(selected)}>
              Explore {elements[selected - 1].n}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
