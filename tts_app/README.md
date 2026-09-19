# tts_app

Tool offline/manual (bukan bagian `npm run build`/CI) utk generate audio TTS SEKALI, disimpan sbg file MP3 statis. Konteks & alasan pemilihan model lengkap ada di [../TTS_Research.md](../TTS_Research.md).

- `generate_english_kokoro.py` — Bahasa Inggris, model **Kokoro-82M** (Apache-2.0).
- `generate_indonesian_piper.py` — Bahasa Indonesia, model **Piper `id_ID-news_tts-medium`** (MIT).

Cara pakai (instruksi lengkap ada di docstring tiap file — install dependency, download voice, contoh command): buka langsung file `.py`-nya atau jalankan `python <file>.py --help`.

## Quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
brew install ffmpeg espeak-ng   # macOS — ganti apt-get di Linux

# Audisi cepat sebelum full-batch (WAJIB, lihat TTS_Research.md §4 QA)
python generate_english_kokoro.py --input queue/en.sample.json
python -m piper.download_voices id_ID-news_tts-medium --data-dir models
python generate_indonesian_piper.py --input queue/id.sample.json

# Dengarkan hasilnya
open output/en/*.mp3 output/id/*.mp3   # macOS
```

## ⚠️ Hati-hati tanda `!` di `--text` lewat terminal

Kalau teksnya ada tanda seru (banyak di konten app ini — "Hebaaat!", "Wow!!") dan dipakai lewat `--text "..."` di terminal (bash/zsh), tanda kutip GANDA TIDAK melindungi `!` dari history expansion shell — `!!` bisa otomatis diganti command sebelumnya, bikin argumen jadi berantakan. Pakai kutip TUNGGAL (`--text 'Wow!! Hebat.'`), atau — lebih aman — taruh teksnya di file JSON lalu pakai `--input`, karena isi file JSON tidak pernah disentuh shell sama sekali.

Output (`output/`) dan model yang di-download (`models/`) SENGAJA di-`.gitignore` — ini folder kerja sementara utk audisi kualitas, bukan sumber kebenaran final. Setelah kualitas oke, langkah selanjutnya (belum dibangun di sini): script ekstraksi string dari `app/src/content.ts` → generate full-batch → pindahkan ke `app/public/audio/` → sambungkan ke `app/src/speech.ts` (lihat TTS_Research.md §4/§6).
