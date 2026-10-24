import bpy, math, os
from mathutils import Vector

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'public','models')
TEX=os.path.join(ROOT,'art','textures','earth')
BAKED=os.path.join(ROOT,'art','earth-baked');os.makedirs(BAKED,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def texture(name):
    im=bpy.data.images.load(os.path.join(TEX,name+'.jpg'))
    im.scale(4096,2048);im.filepath_raw=os.path.join(BAKED,name+'.jpg');im.file_format='JPEG';im.save();im.pack();return im
day=texture('day');night=texture('night');cloud=texture('clouds')
def sphere(name,radius,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128,ring_count=64,radius=radius)
    obj=bpy.context.object;obj.name=name;obj.data.materials.append(mat)
    for poly in obj.data.polygons:poly.use_smooth=True
    return obj
mat=bpy.data.materials.new('Earth • day and night');mat.use_nodes=True
nodes=mat.node_tree.nodes;links=mat.node_tree.links;bs=nodes.get('Principled BSDF')
bs.inputs['Roughness'].default_value=.68;bs.inputs['Specular'].default_value=.18
d=nodes.new('ShaderNodeTexImage');d.image=day;links.new(d.outputs['Color'],bs.inputs['Base Color'])
n=nodes.new('ShaderNodeTexImage');n.image=night;links.new(n.outputs['Color'],bs.inputs['Emission']);bs.inputs['Emission Strength'].default_value=1
earth=sphere('Earth',1.35,mat)
cm=bpy.data.materials.new('Clouds • separate atmosphere layer');cm.use_nodes=True;cm.blend_method='BLEND'
cbs=cm.node_tree.nodes.get('Principled BSDF');cbs.inputs['Base Color'].default_value=(1,1,1,1);cbs.inputs['Roughness'].default_value=1
c=cm.node_tree.nodes.new('ShaderNodeTexImage');c.image=cloud;cm.node_tree.links.new(c.outputs['Color'],cbs.inputs['Alpha'])
clouds=sphere('Clouds',1.362,cm)
root=bpy.data.objects.new('EarthSystem',None);bpy.context.collection.objects.link(root)
earth.parent=root;clouds.parent=root;root.rotation_euler=(0,math.radians(12),math.radians(-110))
bpy.ops.object.select_all(action='DESELECT')
for ob in [root,earth,clouds]:ob.select_set(True)
bpy.context.view_layer.objects.active=earth
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'earth.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True)

# Preview-only illumination mask; the website implements this with a live shader.
light_direction=Vector((-4,-4,3)).normalized()
normal=nodes.new('ShaderNodeNewGeometry');dot=nodes.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=light_direction
links.new(normal.outputs['Normal'],dot.inputs[0]);mask=nodes.new('ShaderNodeMapRange');mask.inputs['From Min'].default_value=-.15;mask.inputs['From Max'].default_value=.1;mask.inputs['To Min'].default_value=1.7;mask.inputs['To Max'].default_value=0;links.new(dot.outputs['Value'],mask.inputs['Value']);links.new(mask.outputs['Result'],bs.inputs['Emission Strength'])

am=bpy.data.materials.new('Blue atmospheric limb • preview');am.use_nodes=True
an=am.node_tree.nodes;al=am.node_tree.links;an.clear()
out=an.new('ShaderNodeOutputMaterial');mix=an.new('ShaderNodeMixShader');transparent=an.new('ShaderNodeBsdfTransparent');emission=an.new('ShaderNodeEmission');emission.inputs['Color'].default_value=(.03,.22,.65,1);emission.inputs['Strength'].default_value=.45
layer=an.new('ShaderNodeLayerWeight');multiply=an.new('ShaderNodeMath');multiply.operation='MULTIPLY';multiply.inputs[1].default_value=.35
al.new(layer.outputs['Fresnel'],multiply.inputs[0]);al.new(multiply.outputs[0],mix.inputs[0]);al.new(transparent.outputs[0],mix.inputs[1]);al.new(emission.outputs[0],mix.inputs[2]);al.new(mix.outputs[0],out.inputs['Surface'])
atmo=sphere('AtmospherePreview',1.38,am)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=True
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.003
bpy.ops.object.light_add(type='AREA',location=(-4,-4,3));light=bpy.context.object;light.data.energy=850;light.data.size=.3;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(0,-5.5,1.1));camera=bpy.context.object;camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=50;scene.camera=camera
scene.render.resolution_x=1440;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Filmic';scene.view_settings.look='Medium High Contrast'
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,'art','earth-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'art','earth.blend'));bpy.ops.render.render(write_still=True)
