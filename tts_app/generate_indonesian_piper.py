"""Generate precomputed Indonesian TTS audio dgn Piper — voice
`id_ID-news_tts-medium` (MIT license).

Lihat TTS_Research.md (root repo) utk konteks lengkap kenapa model ini dipilih.

Install dependency:
    pip install piper-tts
    python3 -m piper.download_voices id_ID-news_tts-medium --data-dir tts_app/models
    # ffmpeg wajib ada di PATH, sama seperti script Inggris:
    #   macOS  : brew install ffmpeg
    #   Ubuntu : sudo apt-get install ffmpeg

Contoh pakai:
    # Audisi cepat 1 kalimat dulu (SELALU lakukan ini dulu sebelum
    # full-batch, dengarkan hasilnya — lihat catatan QA di TTS_Research.md §4):
    python generate_indonesian_piper.py --text "Ini ibuku."

    # Generate 1 batch dari file JSON (array string, atau array
    # {"text": "..."}):
    python generate_indonesian_piper.py --input queue/id.sample.json

Output:
    tts_app/output/id/<sha1>.mp3   (satu file per teks unik)
    tts_app/output/manifest.json   (di-merge dgn entry yang sudah ada, TERMASUK
                                     punya generate_english_kokoro.py)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT_DIR = APP_DIR / "output"
DEFAULT_MANIFEST = DEFAULT_OUTPUT_DIR / "manifest.json"
DEFAULT_DATA_DIR = APP_DIR / "models"
LANG = "id"
SAMPLE_RATE = 24000  # samakan dgn output script Inggris (ffmpeg yang resample)

# Sama persis dgn `stripEmojiForSpeech()` di app/src/speech.ts.
EMOJI_RE = re.compile("[\U0001F300-\U0001FAFF☀-➿←-⇿⬀-⯿]")


def strip_emoji(text: str) -> str:
    return EMOJI_RE.sub("", text).strip()


def text_hash(lang: str, text: str) -> str:
    return hashlib.sha1(f"{lang}:{text}".encode("utf-8")).hexdigest()


def load_queue(input_path: Path | None, single_text: str | None) -> list[str]:
    if single_text:
        return [single_text]
    if not input_path:
        raise SystemExit('Harus isi salah satu: --input <file.json> atau --text "..."')
    raw = json.loads(input_path.read_text(encoding="utf-8"))
    texts: list[str] = []
    for item in raw:
        if isinstance(item, str):
            texts.append(item)
        elif isinstance(item, dict) and "text" in item:
            texts.append(str(item["text"]))
    seen: set[str] = set()
    unique: list[str] = []
    for t in texts:
        if t not in seen:
            seen.add(t)
            unique.append(t)
    return unique


def load_manifest(manifest_path: Path) -> dict:
    if manifest_path.exists():
        return json.loads(manifest_path.read_text(encoding="utf-8"))
    return {}


def save_manifest(manifest_path: Path, manifest: dict) -> None:
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )


def wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    """Normalize loudness, buang keheningan berlebih di ujung, convert ke
    MP3 mono kecil — butuh ffmpeg di PATH."""
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(wav_path),
                "-af", "loudnorm,silenceremove=start_periods=1:start_threshold=-45dB",
                "-ar", str(SAMPLE_RATE), "-ac", "1", "-b:a", "96k",
                str(mp3_path),
            ],
            check=True,
        )
    except FileNotFoundError as exc:
        raise SystemExit(
            "ffmpeg tidak ditemukan di PATH — install dulu (brew install ffmpeg / "
            "apt-get install ffmpeg) sebelum menjalankan script ini."
        ) from exc


def find_model_path(voice_name: str, data_dir: Path) -> Path:
    """`python3 -m piper.download_voices <voice> --data-dir <dir>` menaruh
    `<voice>.onnx` + `<voice>.onnx.json` di `data_dir` — Piper otomatis cari
    file config di sebelah file .onnx-nya."""
    onnx_path = data_dir / f"{voice_name}.onnx"
    if not onnx_path.exists():
        raise SystemExit(
            f"Model {onnx_path} tidak ditemukan. Download dulu:\n"
            f"  python3 -m piper.download_voices {voice_name} --data-dir {data_dir}"
        )
    return onnx_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate precomputed Indonesian TTS audio dgn Piper (id_ID-news_tts-medium).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--input", type=Path, help='File JSON: array string, atau array {"text": "..."}')
    parser.add_argument("--text", type=str, help="Generate 1 string saja (buat audisi cepat)")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--voice", default="id_ID-news_tts-medium")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR, help="Lokasi file .onnx hasil `piper.download_voices`")
    parser.add_argument("--length-scale", type=float, default=1.0, help=">1.0 = lebih lambat/jelas, <1.0 = lebih cepat")
    parser.add_argument("--noise-scale", type=float, default=0.667, help="Variasi prosodi — makin tinggi makin 'hidup' tapi bisa makin tidak stabil")
    parser.add_argument("--use-cuda", action="store_true", help="Default CPU (ringan, tanpa GPU) — Piper memang didesain ringan di CPU")
    parser.add_argument("--force", action="store_true", help="Generate ulang walau file sudah ada (default: skip)")
    args = parser.parse_args()

    try:
        from piper import PiperVoice, SynthesisConfig
    except ImportError as exc:
        raise SystemExit(
            "Package belum ke-install. Jalankan dulu:\n"
            "  pip install piper-tts\n"
            f"  python3 -m piper.download_voices {args.voice} --data-dir {args.data_dir}"
        ) from exc

    texts = load_queue(args.input, args.text)
    if not texts:
        raise SystemExit("Tidak ada teks untuk di-generate.")

    onnx_path = find_model_path(args.voice, args.data_dir)
    voice = PiperVoice.load(str(onnx_path), use_cuda=args.use_cuda)
    syn_config = SynthesisConfig(length_scale=args.length_scale, noise_scale=args.noise_scale)

    manifest = load_manifest(args.manifest)
    lang_dir = args.output_dir / LANG

    generated = skipped = failed = 0
    for raw_text in texts:
        text = strip_emoji(raw_text)
        if not text:
            continue

        key = f"{LANG}:{text}"
        h = text_hash(LANG, text)
        mp3_path = lang_dir / f"{h}.mp3"
        manifest[key] = f"{LANG}/{h}.mp3"

        if mp3_path.exists() and not args.force:
            skipped += 1
            continue

        print(f"[id] generating: {text!r}")
        wav_path = mp3_path.with_suffix(".wav")
        wav_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with wave.open(str(wav_path), "wb") as wav_file:
                voice.synthesize_wav(text, wav_file, syn_config=syn_config)
        except Exception as exc:  # jangan hentikan seluruh batch krn 1 teks gagal
            print(f"  !! gagal generate {text!r}: {exc}", file=sys.stderr)
            wav_path.unlink(missing_ok=True)
            failed += 1
            continue

        wav_to_mp3(wav_path, mp3_path)
        wav_path.unlink(missing_ok=True)
        generated += 1

    save_manifest(args.manifest, manifest)
    print(
        f"Selesai. {generated} file baru, {skipped} dilewati (sudah ada), "
        f"{failed} gagal. Manifest: {args.manifest}"
    )


if __name__ == "__main__":
    main()
