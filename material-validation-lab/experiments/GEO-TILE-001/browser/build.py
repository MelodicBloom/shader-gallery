"""Build the map inspector with the unchanged, stdlib-only field generator."""
import importlib.util
from pathlib import Path
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('geotile_generator', HERE.parent / 'generate_maps.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)
for name, seed, tiles, wear in [('seed42',42,6,.4),('seed43',43,6,.4),('unworn',42,6,0),('fourtiles',42,4,.4)]:
    generator.produce(256, tiles, seed, wear, HERE / 'generated' / name)
    print('Built', name)
