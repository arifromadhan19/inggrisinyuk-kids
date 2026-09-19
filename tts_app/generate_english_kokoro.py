"""Generate precomputed English TTS audio with Kokoro-82M (Apache-2.0).

Lihat TTS_Research.md (root repo) utk konteks lengkap kenapa model ini dipilih.

Install dependency:
    pip install "kokoro>=0.9.4" soundfile numpy
    # Kokoro butuh espeak-ng terpasang di SISTEM (bukan pip) utk fallback
    # kata yang tidak dikenali:
    #   macOS  : brew install espeak-ng
    #   Ubuntu : sudo apt-get install espeak-ng
    # ffmpeg juga wajib ada di PATH, utk convert wav -> mp3:
    #   macOS  : brew install ffmpeg
    #   Ubuntu : sudo apt-get install ffmpeg

Contoh pakai:
    # Audisi cepat 1 kata/kalimat dulu (SELALU lakukan ini dulu sebelum
    # full-batch — model neural TTS kadang aneh utk kata tunggal, lihat
    # catatan QA di TTS_Research.md §4):
    python generate_english_kokoro.py --text "Dog"
    python generate_english_kokoro.py --text "This is my mother."

    # Generate 1 batch dari file JSON (array string, atau array
    # {"text": "..."}):
    python generate_english_kokoro.py --input queue/en.sample.json

Output:
    tts_app/output/en/<sha1>.mp3   (satu file per teks unik)
    tts_app/output/manifest.json   (di-merge dgn entry yang sudah ada, TERMASUK
                                     punya generate_indonesian_piper.py)

Voice yang tersedia (lihat model card hexgrad/Kokoro-82M utk daftar lengkap):
    af_heart, af_bella, af_nicole, af_sarah, af_sky  (American female)
    am_adam, am_michael                              (American male)
    bf_emma, bf_isabella                             (British female)
    bm_george, bm_lewis                              (British male)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT_DIR = APP_DIR / "output"
DEFAULT_MANIFEST = DEFAULT_OUTPUT_DIR / "manifest.json"
LANG = "en"
SAMPLE_RATE = 24000  # sample rate output Kokoro

# Sama persis dgn `stripEmojiForSpeech()` di app/src/speech.ts — audio yang
# di-generate harus match teks yang BENERAN dikirim ke TTS di app saat ini,
# bukan teks mentah yang masih ada emoji-nya.
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
    # dedupe, urutan tetap dijaga
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


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate precomputed English TTS audio dgn Kokoro-82M.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--input", type=Path, help='File JSON: array string, atau array {"text": "..."}')
    parser.add_argument("--text", type=str, help="Generate 1 string saja (buat audisi cepat)")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--voice", default="af_heart", help="Nama voice Kokoro, lihat daftar di docstring file ini")
    parser.add_argument("--lang-code", default="a", help="'a' = American English, 'b' = British English")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument(
        "--device", default="cpu", choices=["cpu", "cuda", "mps"],
        help="Default 'cpu' (ringan, tanpa GPU) — ganti 'cuda'/'mps' kalau ada GPU",
    )
    parser.add_argument("--force", action="store_true", help="Generate ulang walau file sudah ada (default: skip)")
    args = parser.parse_args()

    try:
        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
    except ImportError as exc:
        raise SystemExit(
            "Package belum ke-install. Jalankan dulu:\n"
            '  pip install "kokoro>=0.9.4" soundfile numpy\n'
            "Kokoro juga butuh espeak-ng terpasang di sistem (brew/apt install espeak-ng)."
        ) from exc

    texts = load_queue(args.input, args.text)
    if not texts:
        raise SystemExit("Tidak ada teks untuk di-generate.")

    manifest = load_manifest(args.manifest)
    pipeline = KPipeline(lang_code=args.lang_code, device=args.device)
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

        print(f"[en] generating: {text!r}")
        try:
            generator = pipeline(text, voice=args.voice, speed=args.speed)
            # Kokoro bisa memecah teks panjang jadi beberapa segmen audio —
            # konten app ini (kata/kalimat pendek) biasanya cuma 1 segmen,
            # tapi tetap disambung kalau kebetulan lebih dari 1.
            chunks = [audio for _graphemes, _phonemes, audio in generator]
        except Exception as exc:  # model gagal generate teks tertentu — jangan hentikan seluruh batch
            print(f"  !! gagal generate {text!r}: {exc}", file=sys.stderr)
            failed += 1
            continue

        if not chunks:
            print(f"  !! tidak ada audio dihasilkan utk {text!r}, dilewati", file=sys.stderr)
            failed += 1
            continue

        audio = chunks[0] if len(chunks) == 1 else np.concatenate(chunks)
        wav_path = mp3_path.with_suffix(".wav")
        wav_path.parent.mkdir(parents=True, exist_ok=True)
        sf.write(str(wav_path), audio, SAMPLE_RATE)

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
