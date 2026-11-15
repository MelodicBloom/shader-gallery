"""Rebuild the source-only distributable with sorted paths and fixed ZIP metadata."""
from pathlib import Path
import zipfile

repository = Path(__file__).resolve().parent.parent
source = repository / "packages/shader-library-v1/source"
archive = source.parent / "melodicbloom-shader-library-v1-source.zip"
files = sorted(path for path in source.rglob("*") if path.is_file())
for path in files:
    relative = path.relative_to(source)
    if path.is_symlink() or "node_modules" in relative.parts or (
        relative.parts[0] == "shaders" and path.name == "preview.png"
    ):
        raise SystemExit(f"Remove temporary/generated source file before archiving: {relative}")

filelist = source / "FILELIST.txt"
filelist.write_text("\n".join(str(path.relative_to(source)) for path in files) + "\n")
temporary = archive.with_suffix(".tmp")
with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
    for path in files:
        info = zipfile.ZipInfo(path.relative_to(source).as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.create_system = 3
        info.external_attr = 0o100644 << 16
        output.writestr(info, path.read_bytes(), compresslevel=9)
temporary.replace(archive)
print(f"Rebuilt {archive.name} from {len(files)} source files.")
