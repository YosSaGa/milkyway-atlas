import bpy, math, os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
image = bpy.data.images.load(os.path.join(ROOT, 'art/textures/jupiter/8k_jupiter.jpg'))
image.pack()
material = bpy.data.materials.new('Jupiter cloud belts • Solar System Scope')
material.use_nodes = True
nodes = material.node_tree.nodes
shader = nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value = 1
shader.inputs['Specular'].default_value = .08
texture = nodes.new('ShaderNodeTexImage')
texture.image = image
material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
bpy.ops.mesh.primitive_uv_sphere_add(segments=192, ring_count=96, radius=1.4)
planet = bpy.context.object
planet.name = 'Jupiter'
planet.scale.z = .935
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
planet.data.materials.append(material)
for face in planet.data.polygons:
    face.use_smooth = True
# Put the texture's Great Red Spot (u≈.365) on the front, slightly left.
# Find its longitude from the actual UVs rather than assuming Blender's seam.
uvs = planet.data.uv_layers.active.data
loop = min(planet.data.loops, key=lambda l: abs(uvs[l.index].uv.x-.365)+abs(uvs[l.index].uv.y-.39))
point = planet.data.vertices[loop.vertex_index].co
root = bpy.data.objects.new('JupiterSystem', None)
bpy.context.collection.objects.link(root)
planet.parent = root
root.rotation_euler = (0, math.radians(-5), -math.pi/2-math.atan2(point.y,point.x)-.18)
bpy.ops.object.select_all(action='DESELECT')
planet.select_set(True)
root.select_set(True)
bpy.context.view_layer.objects.active = planet
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/jupiter.glb'), export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.world.use_nodes = True
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value = .008
bpy.ops.object.light_add(type='AREA', location=(-4,-5,3))
light = bpy.context.object
light.data.energy = 1100
light.data.size = .4
light.rotation_euler = (-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-6.2,.55))
camera = bpy.context.object
camera.rotation_euler = (-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens = 52
scene.camera = camera
scene.render.resolution_x = 1440
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'Medium High Contrast'
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = os.path.join(ROOT,'art/jupiter-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art/jupiter.blend'))
bpy.ops.render.render(write_still=True)
