import assert from "node:assert/strict";
import test from "node:test";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import {
  createSceneInspectionController,
  sceneTimelineProgress,
} from "../lib/scene-inspection.ts";

test("scientific assemblies can be separated and restored without changing geometry", () => {
  const root = new Group();
  const nucleus = new Mesh(new BoxGeometry(0.6, 0.6, 0.6), new MeshStandardMaterial());
  const shell = new Mesh(new BoxGeometry(1, 0.1, 1), new MeshStandardMaterial());
  nucleus.position.x = -0.5;
  shell.position.x = 0.5;
  root.add(nucleus, shell);
  const original = nucleus.position.clone();
  const geometry = nucleus.geometry;
  const inspection = createSceneInspectionController(root);

  inspection.setProgress(1);
  assert.ok(nucleus.position.distanceTo(original) > 0);
  assert.equal(nucleus.geometry, geometry);
  inspection.dispose();
  assert.deepEqual(nucleus.position.toArray(), original.toArray());
});

test("scene timeline progress is deterministic and bounded", () => {
  assert.equal(sceneTimelineProgress(500, 1000), 0.5);
  assert.equal(sceneTimelineProgress(-1, 1000), 0);
  assert.equal(sceneTimelineProgress(2000, 1000), 1);
});
