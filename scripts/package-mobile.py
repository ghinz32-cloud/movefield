"""Create a deterministic source starter from the current, validated mobile tree."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
excluded = {"node_modules", ".expo", "dist-mobile", "dist-web", ".git", ".sites-runtime"}
files = [p for p in (root / "mobile").rglob("*") if p.is_file()
         and not excluded.intersection(p.relative_to(root / "mobile").parts)
         and not p.name.startswith(".env")
         and not p.name.endswith((".tsbuildinfo", ".log", ".pem"))]
target = root / "public/downloads/movefield-mobile-r14.zip"
target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(files):
        name = "training-studio-mobile/" + file.relative_to(root / "mobile").as_posix()
        info = zipfile.ZipInfo(name, date_time=(2026, 10, 8, 0, 0, 0))
        info.external_attr = 0o100644 << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, file.read_bytes())
print(f"Packaged {len(files)} source files: {target.name} ({target.stat().st_size} bytes)")
