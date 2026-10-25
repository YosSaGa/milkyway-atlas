import bpy, os
root=os.getcwd()
out=os.path.join(root,'public','planets');os.makedirs(out,exist_ok=True)
for name in ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']:
    im=bpy.data.images.load(os.path.join(root,'art',name+'-preview.png'))
    im.scale(480,367);im.filepath_raw=os.path.join(out,name+'.png');im.file_format='PNG';im.save()
