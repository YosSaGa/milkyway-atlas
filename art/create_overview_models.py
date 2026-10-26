"""Blender derivatives of the detailed planet assets for the interactive overview.
Run: blender --background --python art/create_overview_models.py
Original assets and attribution remain unchanged.
"""
import bpy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/models/overview'
OUT.mkdir(parents=True, exist_ok=True)
for planet in ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/models' / (planet + '.glb')))
    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and len(obj.data.polygons) > 4000:
            modifier = obj.modifiers.new('Overview mesh budget', 'DECIMATE')
            modifier.ratio = min(1, 4000 / len(obj.data.polygons))
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    for img in bpy.data.images:
        if img.size[0] and max(img.size) > 1024:
            factor = 1024 / max(img.size)
            img.scale(max(1, round(img.size[0] * factor)), max(1, round(img.size[1] * factor)))
            img.pack()
    bpy.ops.export_scene.gltf(filepath=str(OUT / (planet + '.glb')), export_format='GLB', export_image_format='AUTO', export_cameras=False, export_lights=False)
    print('OVERVIEW', planet, (OUT / (planet + '.glb')).stat().st_size)
