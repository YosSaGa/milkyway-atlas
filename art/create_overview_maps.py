import bpy, os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=os.path.join(root,'public','planet-maps');os.makedirs(out,exist_ok=True)
files={'mercury':'art/textures/mercury/8k_mercury.jpg','venus':'art/textures/venus/4k_venus_atmosphere.jpg','earth':'art/textures/earth/day.jpg','mars':'art/textures/mars/8k_mars.jpg','jupiter':'art/textures/jupiter/8k_jupiter.jpg','saturn':'public/models/saturn-clouds.png','uranus':'art/textures/uranus/2k_uranus.jpg','neptune':'art/textures/neptune/neptune-presentation.png'}
for name,path in files.items():
    im=bpy.data.images.load(os.path.join(root,path));im.scale(1024,512);im.filepath_raw=os.path.join(out,name+'.jpg');im.file_format='JPEG';im.save()
