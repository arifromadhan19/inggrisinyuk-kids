"""Generate precomputed Indonesian TTS audio via Fish Audio S2.1 Pro **FREE**
lewat OpenRouter (`fish-audio/s2.1-pro-free:free`) — $0, tanpa perlu top-up.

Kenapa ini, bukan Piper (`generate_indonesian_piper.py`) atau model lokal:
- Piper (`id_ID-news_tts-medium`) live-tested user sendiri dan dinilai LEBIH JELEK
  dari voice browser bawaan — bukan solusi utama, cuma jaring pengaman.
- Chatterbox-TTS-Indonesian (model lokal ~3GB, GPU disarankan) sudah dicoba,
  hasilnya juga kurang pas & terlalu lambat di CPU (macOS ini belum py MPS/FFT
  krn masih macOS 13) — filenya SUDAH DIHAPUS PERMANEN, jangan didownload ulang.
- Fish Audio S2.1 Pro Free lewat OpenRouter terbukti live-tested kualitasnya
  jauh lebih baik & punya banyak voice Indonesia siap pakai gratis dari voice
  library publik mereka (lihat VOICES di bawah / `--search`).

Install:
    pip install requests

Setup (SEKALI):
    Isi tts_app/.env (SUDAH ADA di repo ini, sudah di-.gitignore — JANGAN commit):
        OPENROUTER_API_KEY=sk-or-...
    Bikin API key gratis di https://openrouter.ai/settings/keys — model ini
    literally $0, TIDAK PERLU isi saldo/credit sama sekali (beda dari model
    berbayar lain di OpenRouter, mis. Gemini TTS, yang butuh top-up dulu).

Contoh pakai:
    # Audisi cepat 1 kalimat, voice default "narator_indonesia":
    python generate_indonesian_fishaudio.py --text "Selamat pagi!"

    # Voice lain (lihat dict VOICES di bawah):
    python generate_indonesian_fishaudio.py --text "Selamat pagi!" --voice melati

    # Generate 1 batch dari file JSON (array string / array {"text": "..."}):
    python generate_indonesian_fishaudio.py --input queue/id.sample.json

    # Cari voice Indonesia BARU dari voice library publik Fish Audio (gratis,
    # tanpa perlu API key sama sekali — endpoint publik):
    python generate_indonesian_fishaudio.py --search --tag warm --tag gentle
    # Lalu tinggal copy _id hasilnya ke dict VOICES di bawah kalau suka.

Output:
    tts_app/output/id/<sha1>.mp3   (satu file per teks unik + voice unik)
    tts_app/output/manifest.json   (key "id:<teks>", di-merge dgn entry dari
                                     script lain — generate_indonesian_piper.py
                                     dst — voice TERAKHIR yang generate teks
                                     itu yang "menang" di manifest)

⚠️ TEMUAN PENTING (dites langsung, JANGAN diulang tanpa alasan baru):
    Parameter native Fish Audio `prosody`/`temperature`/`top_p` (speed, nada,
    variasi) TIDAK BERFUNGSI lewat endpoint OpenRouter ini — dites eksplisit
    (speed 0.5x vs 1.6x menghasilkan durasi HAMPIR SAMA, ~1.6 detik keduanya).
    Kemungkinan besar OpenRouter cuma meneruskan skema standar OpenAI
    audio.speech (`model`/`input`/`voice`/`response_format`), field lain
    Fish-Audio-spesifik diam-diam dibuang. SATU-SATUNYA tuas yang TERBUKTI
    berpengaruh nyata di jalur gratis ini adalah GANTI VOICE (`--voice`,
    reference_id beda = karakter suara beda), BUKAN parameter kecepatan/nada.
    Kalau nanti butuh kontrol prosody yang beneran presisi, opsi lain (belum
    dicoba di script ini): panggil API native Fish Audio langsung
    (https://api.fish.audio, butuh API key Fish Audio sendiri — BUKAN lewat
    OpenRouter, kemungkinan berbayar di luar tier free OpenRouter ini).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

import requests

APP_DIR = Path(__file__).resolve().parent
ENV_PATH = APP_DIR / ".env"
DEFAULT_OUTPUT_DIR = APP_DIR / "output"
DEFAULT_MANIFEST = DEFAULT_OUTPUT_DIR / "manifest.json"
LANG = "id"
MODEL = "fish-audio/s2.1-pro-free:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/audio/speech"
FISH_MODEL_LIST_URL = "https://api.fish.audio/model"

# --- Voice favorit yang sudah diaudisi & dites langsung (tambah/edit bebas) ---
# Cara cari lebih banyak: `python generate_indonesian_fishaudio.py --search`
# (query publik ke voice library Fish Audio, tidak butuh API key).
VOICES = {
    # calm, educational, warm, friendly — FAVORIT SEMENTARA, paling cocok utk
    # kalimat soal/instruksi (mis. "Apa bahasa Inggrisnya apel?")
    "narator_indonesia": "d36af9647ef647118c64b23b97087838",
    "narator_edukatif": "18d8fd13bc354e6fa51a3707637207d1",  # mirip narator_indonesia
    "melati": "f9303f6b6f964a07a7dd42d5cd41a8e7",  # educational + energetic + warm
    "wanita_ceria": "0cd3c714df304764a117b7f810f1601f",  # "cheerful", bright, energetic
    "melodi_lembut": "c3142ad010ee4685a9f3b1098f693f19",  # gentle + cheerful + playful
    "wanita_muda_ramah": "a44d6dea623b419b8eb5d3a4d1be7596",  # young + gentle + warm, paling "soft"
    "myxy": "9835b3d6e1c64316a57d77db2d7f34a8",  # bright, warm, cheerful, energetic
    "gachee": "d4936ab1c0fa45b8aff8cc60a00c75fa",  # young, warm, cheerful, animated
    "wanita_indonesia": "8a62f569b9e54dda88dad8560635a4ad",  # young, energetic, friendly, bright
}
DEFAULT_VOICE = "narator_indonesia"

# Voice yang DIHINDARI (jangan tambahkan lagi tanpa alasan kuat) — ditemukan
# lewat --search tapi berisiko utk app anak:
#   - voice bertag "sexy" tercampur (mis. "Suara Wanita Santai")
#   - voice bernama brand asli (mis. "Ai Ruangguru" — risiko IP/trademark)
#   - voice bernama tokoh publik asli (mis. "Prabowo")
#   - voice "character-voice" dari IP berhak cipta (mis. karakter game/anime)

# Sama persis dgn `stripEmojiForSpeech()` di app/src/speech.ts.
EMOJI_RE = re.compile("[\U0001F300-\U0001FAFF☀-➿←-⇿⬀-⯿]")


def strip_emoji(text: str) -> str:
    return EMOJI_RE.sub("", text).strip()


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def text_hash(lang: str, voice: str, text: str) -> str:
    return hashlib.sha1(f"{lang}:{voice}:{text}".encode("utf-8")).hexdigest()


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


def normalize_mp3(mp3_path: Path) -> None:
    """Loudness normalize di tempat — best-effort, butuh ffmpeg di PATH.
    Kalau ffmpeg tidak ada, file mentah dari API tetap dipakai apa adanya
    (BUKAN hard requirement seperti di script Kokoro/Piper — API ini sudah
    langsung balikin mp3 valid, normalize cuma penghalus tambahan)."""
    tmp_path = mp3_path.with_suffix(".norm.mp3")
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(mp3_path),
                "-af", "loudnorm",
                "-b:a", "128k",
                str(tmp_path),
            ],
            check=True,
        )
        tmp_path.replace(mp3_path)
    except (FileNotFoundError, subprocess.CalledProcessError):
        tmp_path.unlink(missing_ok=True)
        print("  (ffmpeg tidak ada/gagal — audio disimpan tanpa loudness normalize)")


def call_fishaudio(api_key: str, text: str, voice_id: str) -> bytes:
    resp = requests.post(
        OPENROUTER_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": MODEL,
            "input": text,
            "voice": voice_id,
            "response_format": "mp3",
        },
        timeout=60,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
    return resp.content


def search_voices(language: str, tags: list[str], page_size: int = 20) -> None:
    """Cari voice dari voice library PUBLIK Fish Audio — endpoint ini tidak
    butuh API key sama sekali (dipakai `fish.audio/voice-library` sendiri)."""
    # Fish Audio API cuma nerima 1 `tag` per request (dites langsung) — kalau
    # butuh >1 tag, tag PERTAMA dikirim ke API, sisanya difilter manual di
    # bawah dari hasil yang balik.
    resp = requests.get(
        FISH_MODEL_LIST_URL,
        params={
            "page_size": page_size,
            "page_number": 1,
            "sort_by": "score",
            "language": language,
            "tag": tags[0] if tags else None,
        },
    )
    resp.raise_for_status()
    items = resp.json().get("items", [])
    extra_tags = set(tags[1:])
    print(f"{'ID':<34} {'Title':<28} Tags")
    print("-" * 100)
    for it in items:
        item_tags = set(it.get("tags", []))
        if "female" not in item_tags:
            continue
        if extra_tags and not extra_tags.issubset(item_tags):
            continue
        print(f"{it['_id']:<34} {it['title'][:26]:<28} {sorted(item_tags)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate precomputed Indonesian TTS audio dgn Fish Audio S2.1 Pro Free (via OpenRouter, $0).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--input", type=Path, help='File JSON: array string, atau array {"text": "..."}')
    parser.add_argument("--text", type=str, help="Generate 1 string saja (buat audisi cepat)")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"Nama voice dari dict VOICES di atas file ini (default: {DEFAULT_VOICE}), atau reference_id mentah 32-karakter")
    parser.add_argument("--force", action="store_true", help="Generate ulang walau file sudah ada (default: skip)")
    parser.add_argument("--no-normalize", action="store_true", help="Skip loudness normalize (lebih cepat, butuh ffmpeg kalau tidak di-skip)")
    parser.add_argument("--search", action="store_true", help="Mode cari voice baru dari voice library publik Fish Audio, bukan generate audio")
    parser.add_argument("--tag", action="append", default=[], help="(khusus --search) filter tag, bisa diulang mis. --tag warm --tag gentle")
    args = parser.parse_args()

    if args.search:
        search_voices(language=LANG, tags=args.tag or ["warm"])
        return

    env = load_env(ENV_PATH)
    api_key = env.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit(f"OPENROUTER_API_KEY tidak ketemu di {ENV_PATH} — isi dulu (lihat docstring file ini).")

    voice_id = VOICES.get(args.voice, args.voice)
    if len(voice_id) != 32:
        raise SystemExit(f"Voice '{args.voice}' tidak dikenal — cek dict VOICES di file ini, atau pakai --search buat cari reference_id baru.")

    texts = load_queue(args.input, args.text)
    if not texts:
        raise SystemExit("Tidak ada teks untuk di-generate.")

    manifest = load_manifest(args.manifest)
    lang_dir = args.output_dir / LANG

    generated = skipped = failed = 0
    for raw_text in texts:
        text = strip_emoji(raw_text)
        if not text:
            continue

        key = f"{LANG}:{text}"
        h = text_hash(LANG, args.voice, text)
        mp3_path = lang_dir / f"{h}.mp3"
        manifest[key] = f"{LANG}/{h}.mp3"

        if mp3_path.exists() and not args.force:
            skipped += 1
            continue

        print(f"[id/{args.voice}] generating: {text!r}")
        try:
            audio_bytes = call_fishaudio(api_key, text, voice_id)
        except Exception as exc:  # jangan hentikan seluruh batch krn 1 teks gagal
            print(f"  !! gagal generate {text!r}: {exc}")
            failed += 1
            continue

        mp3_path.parent.mkdir(parents=True, exist_ok=True)
        mp3_path.write_bytes(audio_bytes)
        if not args.no_normalize:
            normalize_mp3(mp3_path)
        generated += 1

    save_manifest(args.manifest, manifest)
    print(
        f"Selesai. {generated} file baru, {skipped} dilewati (sudah ada), "
        f"{failed} gagal. Manifest: {args.manifest}"
    )


if __name__ == "__main__":
    main()
