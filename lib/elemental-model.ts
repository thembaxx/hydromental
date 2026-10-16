import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

/** Clone cached GLTF resources before fitting or applying aura materials. */
export function prepareElementalModel(source: THREE.Object3D, proceduralMaterial?: THREE.Material) {
  const scene = clone(source);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  let meshCount = 0;
  scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    meshCount += 1;
    node.geometry = node.geometry.clone();
    geometries.add(node.geometry);
    const own = (material: THREE.Material) => {
      const result = material.clone();
      materials.add(result);
      return result;
    };
    node.material = proceduralMaterial
      ? own(proceduralMaterial)
      : Array.isArray(node.material)
        ? node.material.map(own)
        : own(node.material);
  });
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene);
  const extent = Math.max(...bounds.getSize(new THREE.Vector3()).toArray());
  if (!meshCount || !Number.isFinite(extent) || extent <= 0) {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    throw new Error("The elemental asset needs a finite, non-empty mesh scene");
  }
  const root = new THREE.Group();
  scene.position.sub(bounds.getCenter(new THREE.Vector3()));
  root.add(scene);
  root.scale.setScalar(2.5 / extent);
  return {
    root,
    scene,
    meshCount,
    materials,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      // Textures belong to useLoader's shared cache and remain alive across switches.
    },
  };
}
