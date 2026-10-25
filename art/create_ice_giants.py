"""Build both ice giants. Colors/ring visibility are illustrative, not calibrated."""
import bpy, math, os, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def build(name):
    uranus = name == 'uranus'
    title = name.title()
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    image = bpy.data.images.load(os.path.join(ROOT, f'art/textures/{name}/2k_{name}.jpg'))
    if not uranus:
        # Preserve luminance detail while replacing the exaggerated blue palette.
        # This is an artistic approximation informed by Oxford's 2024 study.
        pixels = np.array(image.pixels[:], dtype=np.float32).reshape(-1,4)
        luminance = pixels[:,:3] @ np.array([.2126,.7152,.0722])
        contrast = np.clip(luminance / max(float(luminance.mean()), .001), .55, 1.5)
        pixels[:,:3] = np.clip(contrast[:,None] * np.array([.29,.52,.58]), 0, 1)
        image.pixels.foreach_set(pixels.ravel())
        image.filepath_raw = os.path.join(ROOT, 'art/textures/neptune/neptune-presentation.png')
        image.file_format = 'PNG'
        image.save()
    image.pack()
    mat = bpy.data.materials.new(title + ' cloud map');mat.use_nodes = True
    bs = mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Roughness'].default_value = 1
    bs.inputs['Specular'].default_value = .08
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image = image
    mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    bpy.ops.mesh.primitive_uv_sphere_add(segments=192,ring_count=96,radius=1.4)
    planet = bpy.context.object;planet.name = title;planet.scale.z = .977 if uranus else .983
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    planet.data.materials.append(mat)
    for poly in planet.data.polygons: poly.use_smooth = True
    root = bpy.data.objects.new(title+'System',None);bpy.context.collection.objects.link(root)
    planet.parent = root
    objects = [root,planet]
    if uranus:
        # Sparse representative ring bands. Width and brightness exaggerated for visibility.
        ringmat = bpy.data.materials.new('Uranus dark rings');ringmat.use_nodes = True
        rb = ringmat.node_tree.nodes.get('Principled BSDF')
        rb.inputs['Base Color'].default_value = (.13,.15,.15,1)
        rb.inputs['Roughness'].default_value = 1
        for i,(radius,width) in enumerate([(2.1,.006),(2.25,.008),(2.4,.005),(2.56,.009),(2.76,.015)]):
            verts=[];faces=[];count=512
            for j in range(count):
                a=j*2*math.pi/count
                for r in [radius-width/2,radius+width/2]: verts.append((r*math.cos(a),r*math.sin(a),0))
            for j in range(count):
                k=(j+1)%count;faces.append((j*2,k*2,k*2+1,j*2+1))
            mesh=bpy.data.meshes.new('RingBand');mesh.from_pydata(verts,[],faces);mesh.update()
            ring=bpy.data.objects.new(f'UranusRing{i}',mesh);bpy.context.collection.objects.link(ring)
            ring.data.materials.append(ringmat);ring.parent=root;objects.append(ring)
        root.rotation_euler=(math.radians(28),math.radians(97.8),math.radians(-18))
    else:
        uv=planet.data.uv_layers.active.data
        loop=min(planet.data.loops,key=lambda l:abs(uv[l.index].uv.x-.55)+abs(uv[l.index].uv.y-.4))
        p=planet.data.vertices[loop.vertex_index].co
        root.rotation_euler=(0,math.radians(-12),-math.pi/2-math.atan2(p.y,p.x)-.15)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=planet
    bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,f'public/models/{name}.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
    scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.008
    bpy.ops.object.light_add(type='AREA',location=(-4,-5,3));light=bpy.context.object
    light.data.energy=1100;light.data.size=.4;light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(0,-12 if uranus else -6.2,.55));camera=bpy.context.object
    camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=52;scene.camera=camera
    scene.render.resolution_x=1440;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='Filmic';scene.view_settings.look='Medium High Contrast'
    scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,f'art/{name}-preview.png')
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,f'art/{name}.blend'))
    bpy.ops.render.render(write_still=True)

targets = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['uranus','neptune']
for name in targets:
    if name not in ['uranus','neptune']: raise ValueError(name)
    build(name)
