"""Generate the original, deterministic elemental assets with Blender 3.4+.
Run: blender --background --python scripts/create-elemental-assets.py
"""
import bpy
import math
import random
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parent.parent
random.seed(11)
for name, color in [('hydro', (0.09, 0.72, 0.61, 1)), ('ember', (1, 0.17, 0.04, 1)), ('solar', (1, 0.66, 0.09, 1)), ('breeze', (0.41, 0.52, 0.91, 1))]:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Metallic'].default_value = 0.65
    shader.inputs['Roughness'].default_value = 0.24
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1.25)
    orb = bpy.context.object
    orb.name = name + '_core'
    for v in orb.data.vertices:
        p = v.co.normalized()
        # The sculpted silhouette is shared between the GLB and preview render.
        wave = math.sin(p.x*5 + p.z*3) * math.cos(p.y*4) * 0.08
        v.co *= 1 + wave
    orb.data.materials.append(mat)
    for polygon in orb.data.polygons:
        polygon.use_smooth = True
    bpy.ops.export_scene.gltf(filepath=str(root/'public/models'/f'{name}.glb'), export_format='GLB', use_selection=True)
    # Authored stills are used by the carousel and WebGL fallback.
    bpy.ops.object.camera_add(location=(0, -5, 0.4))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0,0,0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = camera
    for location, power, size in [((-3,-3,4),1000,4), ((3,1,1),1400,3)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        light = bpy.context.object
        light.data.energy = power
        light.data.shape = 'DISK'
        light.data.size = size
        light.rotation_euler = (Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 16
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 400
    scene.render.resolution_y = 320
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.view_settings.view_transform = 'Standard'
    scene.render.filepath = str(root/'public/auras'/f'{name}.png')
    bpy.ops.render.render(write_still=True)
