"""Run this file from TouchDesigner Textport after cloning the repository.
exec(open(r'C:\path\to\shader-gallery\experiments\noise-kaleidoscope-v0\touchdesigner\build_network.py',encoding='utf-8').read())
Set ROOT below to checkout path if project.folder differs.
"""
from pathlib import Path
ROOT = Path(project.folder)
shader_path = ROOT / 'experiments/noise-kaleidoscope-v0/touchdesigner/kaleidoscope_pixel.glsl'
if not shader_path.is_file():
    raise FileNotFoundError('Set ROOT to the checkout; missing '+str(shader_path))
parent = op('/project1')
if parent is None:
    raise RuntimeError('A standard TouchDesigner project with /project1 is required')
if parent.op('noise_kaleidoscope_v0'):
    raise RuntimeError('Fail-closed: Base COMP already exists; manually inspect or rename it')
lab=parent.create(baseCOMP,'noise_kaleidoscope_v0')
noise=lab.create(noiseTOP,'noise_field')
noise.nodeX,noise.nodeY=0,0
noise.par.type='perlin2d'
if hasattr(noise.par,'seed'): noise.par.seed=314
dat=lab.create(textDAT,'kaleido_pixel')
dat.text=shader_path.read_text(encoding='utf-8')
dat.nodeX,dat.nodeY=180,-130
effect=lab.create(glslTOP,'polar_fold')
effect.inputConnectors[0].connect(noise)
effect.nodeX,effect.nodeY=200,0
effect.par.pixeldat=dat.path
values=[
 ('uTime',1.2345),('uSides',10.0),('uScale',4.2),('uSpeed',0.35),
 ('uRotation',0.0),('uWarp',0.45),('uPalette',0.18),('uContrast',1.15),
]
effect.par.vec=len(values)
for i,(name,value) in enumerate(values):
    getattr(effect.par,'vec'+str(i)+'name').val=name
    getattr(effect.par,'vec'+str(i)+'valuex').val=value
output=lab.create(outTOP,'OUT')
output.inputConnectors[0].connect(effect)
output.nodeX,output.nodeY=400,0
print('EXP-001 built at',lab.path,'| run GLSL TOP Info DAT check and save .toe after verifying')
