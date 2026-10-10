"""Package current tracked Expo source; refuse credentials and generated output."""
from pathlib import Path, PurePosixPath
import os
import json
import re
import subprocess
import tempfile
import zipfile

ROOT_FILES = {
    ".gitignore", "App.tsx", "LICENSE", "README.md", "START-HERE.md",
    "app.json", "assets.d.ts", "babel.config.js", "babel.config.cjs",
    "eas.json", "index.ts", "package.json", "package-lock.json", "tsconfig.json",
}
SOURCE_DIRECTORIES = {"assets", "docs", "plugins", "scripts", "src"}
SOURCE_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md",
    ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ttf", ".otf",
    ".woff", ".woff2", ".txt", ".css",
}
GENERATED_DIRECTORIES = {
    "node_modules", ".expo", ".git", ".sites-runtime", "dist", "dist-mobile",
    "dist-web", "web-build", "build", "android", "ios", "exercise-photos",
}
REQUIRED_FILES = {"App.tsx", "app.json", "index.ts", "package.json", "package-lock.json", "tsconfig.json"}
SECRET_EXTENSIONS = {".pem", ".key", ".p12", ".pfx", ".jks", ".keystore", ".p8", ".mobileprovision"}
SECRET_NAMES = {".npmrc", ".yarnrc", ".yarnrc.yml", "credentials.json", "auth.json", "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"}
SECRET_CONTENT = re.compile(
    rb"-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----|"
    rb"\bghp_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b|"
    rb"\bAKIA[A-Z0-9]{16}\b|\bsk-[A-Za-z0-9_-]{32,}\b"
)


def secret_path(path):
    for segment in path.parts:
        name = segment.lower()
        if name.startswith(".env") or name in SECRET_NAMES or Path(name).suffix in SECRET_EXTENSIONS:
            return True
        if name.endswith(".json") and any(marker in name for marker in ("credentials", "service-account", "service_account", "serviceaccount")):
            return True
    return False


def source_files(root):
    # Read index membership, then current working-tree bytes. git show/HEAD would
    # silently ship old source during a validated but not yet committed change.
    tracked = subprocess.run(
        ["git", "ls-files", "--stage", "-z", "--", "mobile/"],
        cwd=root, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    ).stdout
    selected = []
    for record in tracked.split(b"\0"):
        if not record:
            continue
        metadata, raw_path = record.split(b"\t", 1)
        mode, _object_id, stage = metadata.decode("ascii").split(" ")
        path = PurePosixPath(raw_path.decode("utf-8"))
        if path.is_absolute() or path.parts[0] != "mobile" or any(part in {".", ".."} for part in path.parts):
            raise ValueError("Invalid tracked starter path")
        relative = PurePosixPath(*path.parts[1:])
        if secret_path(relative):
            raise ValueError(f"Credential file cannot be packaged: {relative}")
        if stage != "0":
            raise ValueError("Resolve source conflicts before packaging the starter")
        if GENERATED_DIRECTORIES.intersection(relative.parts):
            continue
        allowed = relative.as_posix() in ROOT_FILES or (
            len(relative.parts) > 1 and relative.parts[0] in SOURCE_DIRECTORIES
            and relative.suffix.lower() in SOURCE_EXTENSIONS
        )
        if not allowed:
            continue
        if mode not in {"100644", "100755"}:
            raise ValueError(f"Starter source must be an ordinary file: {relative}")
        file = root.joinpath(*path.parts)
        cursor = root
        for part in path.parts:
            cursor = cursor / part
            if cursor.is_symlink():
                raise ValueError(f"Starter source cannot traverse a symlink: {relative}")
        if not file.is_file():
            raise ValueError(f"Tracked starter source is missing: {relative}")
        if file.stat().st_size > 32 * 1024 * 1024:
            raise ValueError("Starter source exceeds the per-file source limit")
        content = file.read_bytes()
        if SECRET_CONTENT.search(content):
            raise ValueError(f"Credential content cannot be packaged: {relative}")
        selected.append((relative.as_posix(), content))
    names = {name for name, _content in selected}
    if not REQUIRED_FILES.issubset(names):
        raise ValueError("Required tracked Expo starter source is missing")
    config = json.loads(dict(selected)["app.json"].decode("utf-8"))
    if not isinstance(config, dict) or not isinstance(config.get("expo"), dict):
        raise ValueError("Expo starter app configuration is invalid")
    plugins = config["expo"].get("plugins", [])
    if not isinstance(plugins, list):
        raise ValueError("Expo starter plugin configuration is invalid")
    for entry in plugins:
        plugin = entry[0] if isinstance(entry, list) and entry else entry
        if not isinstance(plugin, str) or not plugin:
            raise ValueError("Expo starter plugin reference is invalid")
        if "\\" in plugin or plugin.startswith("/") or ":" in plugin or any(part == ".." for part in plugin.split("/")):
            raise ValueError("Expo starter plugin reference is not portable")
        if plugin.startswith("./"):
            local = plugin[2:]
            if any(part in {"", ".", ".."} for part in local.split("/")) or local not in names:
                raise ValueError("Referenced local Expo plugin is absent from tracked starter source")
    if sum(len(content) for _name, content in selected) > 128 * 1024 * 1024:
        raise ValueError("Starter source exceeds the total source limit")
    return sorted(selected)


def package(root):
    files = source_files(root)
    target = root / "public/downloads/movefield-mobile-r14.zip"
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(prefix=".movefield-mobile-", suffix=".zip", dir=target.parent, delete=False) as output:
            temporary = Path(output.name)
            with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
                for name, content in files:
                    info = zipfile.ZipInfo("training-studio-mobile/" + name, date_time=(2026, 10, 8, 0, 0, 0))
                    info.external_attr = 0o100644 << 16
                    info.compress_type = zipfile.ZIP_DEFLATED
                    archive.writestr(info, content)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, target)
        temporary = None
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    print(f"Packaged {len(files)} tracked source files: {target.name} ({target.stat().st_size} bytes)")


if __name__ == "__main__":
    package(Path(__file__).resolve().parents[1])
