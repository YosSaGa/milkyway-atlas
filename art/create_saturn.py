import bpy, math, os
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'models')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def image(name, pixels):
    h,w,_ = pixels.shape
    im = bpy.data.images.new(name, width=w, height=h, alpha=True)
    im.pixels.foreach_set(pixels.astype(np.float32).ravel())
    im.filepath_raw = os.path.join(OUT, name + '.png')
    im.file_format = 'PNG'
    im.save()
    im.pack()
    return im

# Baked cloud bands: deliberately illustrative, not a spacecraft observation.
w,h = 2048,1024
u,v = np.meshgrid(np.linspace(0,2*math.pi,w), np.linspace(0,math.pi,h))
warp = v + .005*np.sin(u*8+np.sin(v*25)) + .003*np.sin(u*19-v*33)
bands = .035*np.sin(warp*27) + .022*np.sin(warp*67+1) + .008*np.sin(warp*151) + .004*np.sin(warp*370)
clouds = .009*np.sin(u*120+np.sin(v*240))*np.sin(v*410+u*20)
base = np.array([.66,.56,.40])
rgb = base + (bands+clouds)[...,None]*np.array([1,.9,.7])
rgb += (.06*np.sin(v)**2)[...,None]
pixels = np.concatenate([np.clip(rgb,0,1), np.ones((h,w,1))],axis=2)
surface = image('saturn-clouds', pixels)

mat = bpy.data.materials.new('Saturn • baked cloud bands'); mat.use_nodes=True
bs = mat.node_tree.nodes.get('Principled BSDF'); bs.inputs['Roughness'].default_value=.92
tex=mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=surface
mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=1)
planet=bpy.context.object; planet.name='Saturn'; planet.scale=(1,1,.902)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
planet.data.materials.append(mat)
for p in planet.data.polygons:p.use_smooth=True

# Radial texture on an annular mesh. Cassini division is an actual gap in opacity.
n=2048
t=np.linspace(0,1,n); r=1.22+t*(2.32-1.22)
grain=.76+.13*np.sin(r*193)+.055*np.sin(r*719)+.035*np.sin(r*1703)
alpha=np.where(r<1.52,.19,np.where(r<1.94,.88,.62))*grain
alpha[(r>1.94)&(r<2.025)]=.025
alpha[(r>2.245)&(r<2.257)]=.03
alpha*=np.clip((r-1.22)*60,0,1)*np.clip((2.32-r)*90,0,1)
ring_rgb=np.outer(.65+.2*grain,np.array([.78,.70,.56]))
strip=np.concatenate([ring_rgb,alpha[:,None]],axis=1)[None,:,:]
ring_image=image('saturn-rings',np.repeat(strip,8,axis=0))
ring_mat=bpy.data.materials.new('Icy rings • radial baked texture');ring_mat.use_nodes=True
ring_mat.blend_method='BLEND';ring_mat.use_screen_refraction=False
ring_bs=ring_mat.node_tree.nodes.get('Principled BSDF');ring_bs.inputs['Roughness'].default_value=.9
ring_tex=ring_mat.node_tree.nodes.new('ShaderNodeTexImage');ring_tex.image=ring_image
ring_mat.node_tree.links.new(ring_tex.outputs['Color'],ring_bs.inputs['Base Color'])
ring_mat.node_tree.links.new(ring_tex.outputs['Alpha'],ring_bs.inputs['Alpha'])
verts=[];faces=[];steps=512
for i in range(steps+1):
    angle=i/steps*math.tau
    for rad in [1.22,2.32]:verts.append((math.cos(angle)*rad,math.sin(angle)*rad,0))
for i in range(steps):faces.append((i*2,i*2+1,i*2+3,i*2+2))
mesh=bpy.data.meshes.new('Ring annulus');mesh.from_pydata(verts,[],faces);mesh.update()
rings=bpy.data.objects.new('Rings',mesh);bpy.context.collection.objects.link(rings);mesh.materials.append(ring_mat)
uv=mesh.uv_layers.new(name='UVMap')
for poly in mesh.polygons:
    for li in poly.loop_indices:
        vi=mesh.loops[li].vertex_index;uv.data[li].uv=(vi%2,.5)
root=bpy.data.objects.new('SaturnSystem',None);bpy.context.collection.objects.link(root)
planet.parent=root;rings.parent=root
root.rotation_euler=(math.radians(18),math.radians(-12),math.radians(-22))

# Export mesh and baked materials, keeping the lighting in the web renderer.
bpy.ops.object.select_all(action='DESELECT')
for obj in [root,planet,rings]:obj.select_set(True)
bpy.context.view_layer.objects.active=planet
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'saturn.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True)

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.003,.004,.007,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.04
bpy.ops.object.light_add(type='AREA',location=(-4,-5,6))
light=bpy.context.object;light.data.energy=950;light.data.size=.7
light.rotation_euler=(Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-7,1.1))
camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens=42;scene.camera=camera
scene.render.resolution_x=1440;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Filmic';scene.view_settings.look='Medium High Contrast'
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,'art','saturn-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art','saturn.blend'))
bpy.ops.render.render(write_still=True)
