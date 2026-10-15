import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
export function inspectGlb(buffer) {
  if (
    buffer.length < 20 ||
    buffer.readUInt32LE(0) !== 0x46546c67 ||
    buffer.readUInt32LE(4) !== 2 ||
    buffer.readUInt32LE(8) !== buffer.length ||
    buffer.readUInt32LE(16) !== 0x4e4f534a
  )
    throw new Error("Invalid GLB v2 asset");
  const length = buffer.readUInt32LE(12);
  const gltf = JSON.parse(buffer.subarray(20, 20 + length).toString("utf8"));
  if (buffer.length > 1024 * 1024) throw new Error("GLB exceeds the 1 MiB mobile budget");
  if ([...(gltf.buffers ?? []), ...(gltf.images ?? [])].some((item) => item.uri))
    throw new Error("Embed buffers and textures for reliable offline use");
  if (
    (gltf.extensionsRequired ?? []).some((name) =>
      ["KHR_draco_mesh_compression", "KHR_texture_basisu", "EXT_meshopt_compression"].includes(
        name,
      ),
    )
  )
    throw new Error("Export standard GLB data; an external compression decoder is not configured");
  let triangles = 0;
  for (const mesh of gltf.meshes ?? [])
    for (const primitive of mesh.primitives) {
      if ((primitive.mode ?? 4) !== 4) throw new Error("Export triangle meshes");
      const accessor = gltf.accessors[primitive.indices ?? primitive.attributes.POSITION];
      triangles += accessor.count / 3;
    }
  if (!triangles || triangles > 100_000)
    throw new Error("GLB must contain at most 100,000 triangles");
  return {
    bytes: buffer.length,
    triangles,
    meshes: gltf.meshes.length,
    animations: gltf.animations?.length ?? 0,
  };
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  for (const name of ["hydro", "ember", "solar", "breeze"])
    console.log(
      name,
      inspectGlb(await readFile(new URL(`../public/models/${name}.glb`, import.meta.url))),
    );
}
