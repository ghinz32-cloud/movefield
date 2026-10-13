"""Refresh public, pinned Qwen asset metadata; never downloads weights or user data.

Run deliberately from the repository. This does not enable client downloads/inference.
Every required artifact gets a byte count and SHA-256; tiny config files and runtime
WASM are hashed directly, while large weights use the publisher's LFS SHA-256.
"""
import concurrent.futures
import hashlib
import json
import pathlib
import urllib.request
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parents[1]
HF = "https://huggingface.co"
NATIVE_REPO = "software-mansion/react-native-executorch-qwen-3"
WEB_REPOS = [
    ("Qwen3-0.6B-q4f16_1-MLC", 0.6, 1403.34),
    ("Qwen3-4B-q4f16_1-MLC", 4, 3431.59),
    ("Qwen3.5-4B-q4f16_1-MLC", 4, 3867.82),
    ("Qwen3.5-9B-q4f16_1-MLC", 9, 6433.01),
]


def read(url, limit=64_000_000):
    request = urllib.request.Request(url, headers={"User-Agent": "Movefield-public-model-metadata/1"})
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError("Artifact exceeded the metadata/runtime size limit")
    return data


def info(repo, ref="main"):
    data = json.loads(read(f"{HF}/api/models/{repo}/revision/{ref}", 2_000_000))
    revision = data["sha"]
    files = json.loads(read(f"{HF}/api/models/{repo}/tree/{revision}?recursive=true&expand=false", 2_000_000))
    return revision, {item["path"]: item for item in files if item["type"] == "file"}


def asset(repo, revision, path, files):
    if not path or ".." in path.split("/") or ":" in path or path.startswith("/"):
        raise ValueError("Unsafe asset path")
    metadata = files[path]
    url = f"{HF}/{repo}/resolve/{revision}/{path}"
    published = metadata.get("lfs", {}).get("oid")
    if published:
        digest, verification = published, "publisher-lfs-sha256"
    else:
        if path.endswith((".bin", ".pte")):
            raise ValueError("Weight metadata lacks the publisher SHA-256; refuse full download")
        payload = read(url, 16_000_000)  # Large tokenizer vocabularies are metadata, not model weights.
        if len(payload) != metadata["size"]:
            raise ValueError("Unexpected artifact length")
        digest, verification = hashlib.sha256(payload).hexdigest(), "downloaded-sha256"
    if len(digest) != 64:
        raise ValueError("Missing SHA-256")
    return {"path": path, "url": url, "bytes": metadata["size"], "sha256": digest, "verification": verification}


def native_models():
    revision, files = info(NATIVE_REPO, "v0.10.0")
    common = [asset(NATIVE_REPO, revision, path, files) for path in ["tokenizer.json", "tokenizer_config.json"]]
    result = []
    for folder, label, parameters in [("0_6b", "0.6B", 0.6), ("1_7b", "1.7B", 1.7), ("4b", "4B", 4)]:
        config_path = f"{folder}/xnnpack/config.json"
        config_url = f"{HF}/{NATIVE_REPO}/resolve/{revision}/{config_path}"
        config_data = read(config_url, 2_000_000)
        variants = json.loads(config_data)["variants"]
        context = next(v["methods"]["get_max_context_len"] for v in variants if v["precision"] == "8da4w")
        assets = [asset(NATIVE_REPO, revision, f"{folder}/xnnpack/qwen_3_{folder}_xnnpack_8da4w.pte", files), *common]
        result.append({
            "id": f"native-qwen3-{label.lower()}", "label": f"Qwen3 {label}", "platform": "android",
            "parametersB": parameters, "runtime": "react-native-executorch", "runtimeVersion": "0.10.4",
            "backend": "xnnpack-8da4w", "modelRevision": revision, "repository": NATIVE_REPO,
            "assets": assets, "downloadBytes": sum(x["bytes"] for x in assets),
            "license": "Apache-2.0", "licenseSource": f"{HF}/Qwen/Qwen3-{label}",
            "qualification": "not-tested", "requiresDevelopmentBuild": True,
            "contextTokens": context, "contextConfigUrl": config_url,
            "contextConfigSha256": hashlib.sha256(config_data).hexdigest(),
        })
    return result


def web_model(entry, wasm_revision):
    model_id, parameters, vendor_memory = entry
    repo = f"mlc-ai/{model_id}"
    revision, files = info(repo)
    config = json.loads(read(f"{HF}/{repo}/resolve/{revision}/mlc-chat-config.json", 2_000_000))
    cache_name = "tensor-cache.json"
    cache = json.loads(read(f"{HF}/{repo}/resolve/{revision}/{cache_name}", 2_000_000))
    required = set(config["tokenizer_files"]) | {"mlc-chat-config.json", cache_name}
    required.update(record["dataPath"] for record in cache["records"])
    assets = [asset(repo, revision, path, files) for path in sorted(required)]
    wasm_file = model_id.removesuffix("-MLC") + "_cs1k-webgpu.wasm"
    wasm_url = f"https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/{wasm_revision}/web-llm-models/v0_2_84/base/{wasm_file}"
    wasm = read(wasm_url)
    if not wasm.startswith(b"\x00asm"):
        raise ValueError("Runtime URL did not return a WASM binary")
    print(f"Verified {model_id} metadata/runtime", flush=True)
    assets.append({"path": wasm_file, "url": wasm_url, "bytes": len(wasm), "sha256": hashlib.sha256(wasm).hexdigest(), "verification": "downloaded-sha256"})
    family = model_id.split("-q4")[0]
    return {
        "id": "web-" + model_id.lower(), "label": family, "modelId": model_id, "platform": "web",
        "parametersB": parameters, "runtime": "@mlc-ai/web-llm", "runtimeVersion": "0.2.85",
        "backend": "webgpu-q4f16_1", "modelRevision": revision, "wasmRevision": wasm_revision,
        "repository": repo, "assets": assets, "downloadBytes": sum(x["bytes"] for x in assets),
        "vendorEstimatedVramMB": vendor_memory, "requiredFeatures": ["shader-f16"], "contextTokens": 4096,
        "license": "Apache-2.0", "licenseSource": f"{HF}/Qwen/{family}",
        "qualification": "not-tested", "requiresSecureContext": True,
    }


def main():
    wasm_revision = json.loads(read("https://api.github.com/repos/mlc-ai/binary-mlc-llm-libs/commits/main", 2_000_000))["sha"]
    native = native_models()
    print("Verified native model metadata", flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        web = list(pool.map(lambda entry: web_model(entry, wasm_revision), WEB_REPOS))
    output = {"schema": 1, "checked": date.today().isoformat(), "status": "artifact-metadata-only", "models": native + web}
    path = ROOT / "lib/qwen-assets.json"
    path.write_text(json.dumps(output, indent=2) + "\n")
    for model in output["models"]:
        print(f"{model['label']} {model['platform']}: {len(model['assets'])} pinned artifacts, {model['downloadBytes']} bytes; not hardware-qualified")


if __name__ == "__main__":
    main()
