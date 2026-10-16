import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { prepareElementalModel } from "../lib/elemental-model.ts";
test("multi-mesh assets retain hierarchy, transforms and authored materials while fitting", () => {
  const scene = new THREE.Group();
  const parent = new THREE.Group();
  parent.position.set(15, 20, -5);
  parent.scale.setScalar(3);
  for (const x of [-2, 2]) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshStandardMaterial({ color: "red" }),
    );
    mesh.position.x = x;
    parent.add(mesh);
  }
  scene.add(parent);
  const model = prepareElementalModel(scene);
  assert.equal(model.meshCount, 2);
  const box = new THREE.Box3().setFromObject(model.root);
  assert.ok(box.getCenter(new THREE.Vector3()).length() < 1e-6);
  assert.ok(Math.abs(Math.max(...box.getSize(new THREE.Vector3()).toArray()) - 2.5) < 1e-6);
  const owned = model.scene.children[0].children[0];
  assert.notEqual(owned.geometry, parent.children[0].geometry);
  assert.notEqual(owned.material, parent.children[0].material);
  assert.equal(owned.material.color.getHexString(), "ff0000");
  assert.deepEqual(parent.position.toArray(), [15, 20, -5]);
  model.dispose();
});
test("procedural overrides preserve the cached asset and empty scenes fail cleanly", () => {
  const source = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial());
  const aura = new THREE.ShaderMaterial();
  const model = prepareElementalModel(source, aura);
  assert.equal(model.scene.material.isShaderMaterial, true);
  assert.equal(source.material.isMeshBasicMaterial, true);
  model.dispose();
  assert.throws(() => prepareElementalModel(new THREE.Group()), /finite, non-empty/);
});
