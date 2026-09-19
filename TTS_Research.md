# TTS Research — Precomputed Audio (EN + ID) untuk InggrisinYuk Kids

Riset ini menjawab permintaan: ganti TTS runtime (Web Speech API browser, yang "kurang emosi") dengan audio yang di-generate SEKALI pakai model TTS open-source/gratis (Hugging Face, Python), disimpan sebagai file MP3, lalu dimainkan sebagai file statis di app. Browser TTS tetap dipertahankan sebagai fallback (best-effort, bukan dihapus).

**Status implementasi saat ini (baseline, sebelum riset ini)**: `app/src/speech.ts` — 100% Web Speech API bawaan browser (`speechSynthesis`), tanpa file audio, tanpa backend, nol biaya (PRD §5). Kualitas suara sepenuhnya tergantung voice yang kebetulan terpasang di OS/browser anak (`PREFERRED_NAMES`, `QUALITY_VOICE_HINTS`) — inilah sumber masalah "kurang emosi": suara sistem generik, tidak ada kontrol nada/emosi, dan tidak konsisten lintas perangkat (Chrome punya "Google US English" yang lumayan, Safari/macOS default cuma voice "compact" yang robotic).

---

## 0. Temuan Penting Duluan: Filter Lisensi (app ini BERBAYAR)

Sebelum bahas model — ini **wajib dicek pertama**, karena banyak model TTS open-weight paling populer/berkualitas ternyata **hanya gratis untuk pemakaian non-komersial**. App ini bukan hobby project — akses lifetime Rp 99.000 (tanpa free tier) berarti app ini produk BERBAYAR, jadi audio yang di-generate dari model ber-lisensi non-komersial **tidak boleh dipakai** di produk ini, walau modelnya gratis diunduh.

| Model | Lisensi | Status utk app ini |
|---|---|---|
| **Coqui XTTS-v2** | Coqui Public Model License (CPML) 1.0.0 — non-komersial. Coqui Inc sudah bubar Jan 2024, jadi **tidak ada lagi cara beli lisensi komersialnya** | ❌ **Exclude** — walau paling populer/di-download di HuggingFace, weight-nya terkunci non-komersial permanen |
| **Meta MMS-TTS** (termasuk `facebook/mms-tts-ind` utk Indonesia) | CC-BY-NC-4.0 | ❌ **Exclude** — non-komersial |
| **F5-TTS** (SWivid, base model) + semua finetune-nya (termasuk `F5-TTS-INDO-FINETUNE`/`-V2`) | CC-BY-NC-4.0 — dikonfirmasi resmi oleh pembuatnya: restriksi non-komersial **tetap berlaku walau model di-finetune ulang** dgn data sendiri | ❌ **Exclude** |
| **Higgs Audio V2** (Boson AI) | Community License khusus — gratis+komersial **asal <100.000 annual active users**; di atas itu wajib beli lisensi dari Boson AI | ⚠️ **Bersyarat** — aman dipakai sekarang (skala app ini jauh di bawah 100rb AAU), tapi catat sbg hal yang perlu di-revisit kalau app tumbuh besar |
| **Chatterbox** (Resemble AI, base + multilingual + turbo + nano) | **MIT** | ✅ Aman, komersial penuh |
| **Chatterbox-TTS-Indonesian** (community finetune, `grandhigh/Chatterbox-TTS-Indonesian`) | **Apache 2.0**, dilatih dari data yg semuanya berlisensi bersih (Espeak-ID-5K/MIT, Google FLEURS/CC-BY-4.0, ind_famal/Apache-2.0) | ✅ Aman, komersial penuh |
| **Kokoro-82M** | **Apache 2.0** | ✅ Aman, komersial penuh |
| **Piper** (semua voice, termasuk `id_ID-news_tts-medium`) | **MIT** | ✅ Aman, komersial penuh |
| **Orpheus-3B** | **Apache 2.0** (utk varian English yang production-grade) | ✅ Aman, komersial penuh |

**Kesimpulan filter ini**: kandidat yang layak dipakai tinggal **Chatterbox (+ finetune Indonesianya)**, **Kokoro-82M**, **Piper**, dan **Orpheus-3B** (khusus English). XTTS-v2/MMS-TTS/F5-TTS yang sering muncul di tutorial-tutorial "TTS gratis terbaik" justru **harus dihindari** utk produk berbayar ini.

---

## 1. Model Apa — Rekomendasi per Bahasa

### 1.1 Bahasa Inggris

**🥇 Rekomendasi utama — Chatterbox (Resemble AI)**
- Lisensi: **MIT**, dibenchmark vs ElevenLabs (closed-source) dan konsisten menang di evaluasi side-by-side pihak ketiga.
- **Punya kontrol emosi eksplisit** (`exaggeration` parameter, 0 = monoton → 1 = sangat dramatis) — ini **langsung menjawab keluhan "kurang emosi"**, karena bisa di-tune per konteks (mis. pujian "Hebaaat!" pakai exaggeration lebih tinggi drpd instruksi soal biasa).
- 4 varian, pilih sesuai kebutuhan:
  - `ChatterboxTTS` (Original, 500M) — English, kualitas+kontrol emosi terbaik.
  - `ChatterboxMultilingualTTS` (500M, 23+ bahasa termasuk Inggris) — kalau nanti mau 1 model utk banyak bahasa sekaligus (TIDAK termasuk Indonesia, lihat §1.2).
  - `ChatterboxTurboTTS` (350M) — generate ~6× lebih cepat, tapi kontrol emosi terbatas.
  - Nano (CPU-optimized) — jalan ~3× real-time di 8-core CPU, tanpa GPU sama sekali.
- Bisa voice cloning zero-shot dari 5 detik referensi audio (`audio_prompt_path`) — berguna kalau mau "1 suara resmi" yang konsisten di semua materi (lihat §6 soal konsekuensi produk).

**🥈 Alternatif ringan — Kokoro-82M**
- Lisensi: **Apache 2.0**. Cuma 82M parameter tapi rank #1 di TTS Spaces Arena (Elo lebih tinggi dari model jauh lebih besar), sangat cepat & ringan CPU (bisa jalan real-time bahkan tanpa GPU).
- **Tidak punya knob emosi eksplisit** — kualitasnya natural/jernih tapi lebih ke arah "netral-hangat" drpd "ekspresif dramatis". Cocok kalau Chatterbox ternyata terlalu berat/susah di-setup, tapi kurang pas kalau prioritas #1 memang "emosi" (sesuai keluhan awal).
- Support 8 bahasa (en-US/en-GB, es, fr, hi, it, ja, pt, zh) — **tidak ada Indonesia**.

**Kandidat lain (dicatat, bukan rekomendasi utama)**:
- **Higgs Audio V2** (Boson AI) — model paling "expressive" versi HF trending saat ini, tapi 3B parameter (butuh GPU lumayan) & lisensinya bersyarat (§0). Worth dicoba kalau di langkah §5 hasil Chatterbox dirasa masih kurang.
- **Orpheus-3B** — Apache 2.0, py tag emosi eksplisit di teks (`<laugh>`, `<sigh>`, `<yawn>`, dst — cocok utk nuansa "riang"/"semangat" ala app ini), tapi butuh GPU ~8GB VRAM dan varian selain English masih "research-grade" (belum matang).

### 1.2 Bahasa Indonesia

**🥇 Rekomendasi utama — Chatterbox-TTS-Indonesian** (`grandhigh/Chatterbox-TTS-Indonesian` di HuggingFace)
- Community finetune dari arsitektur Chatterbox yang sama di atas, khusus Bahasa Indonesia.
- Lisensi: **Apache 2.0** — dataset latihnya (`SuaraGabungan-ID`) eksplisit disusun dari 3 sumber yang SEMUANYA berlisensi bersih (Espeak-ID-5K/MIT, Google FLEURS/CC-BY-4.0, ind_famal/Apache-2.0) — jadi rantai lisensinya aman, bukan model yang "lupa" ngecek sumber datanya.
- **Keuntungan besar**: dipakai lewat package Python (`chatterbox`) yang SAMA PERSIS dengan model Inggris §1.1 — cukup ganti checkpoint yang di-load, sisa kode generate/exaggeration/save identik. Satu toolchain, dua bahasa.
- Deskripsi resminya: "suara Bahasa Indonesia yang alami dan berkualitas tinggi" — belum ada benchmark independen pihak ketiga sebanyak Chatterbox Inggris (community finetune, bukan rilis resmi Resemble AI), jadi **wajib didengarkan sample-nya dulu** (§4 langkah QA) sebelum full-batch generate.

**🥈 Fallback ringan/aman — Piper (`id_ID-news_tts-medium`)**
- Lisensi: **MIT**.
- Sangat ringan (arsitektur VITS, didesain jalan di CPU lemah bahkan Raspberry Pi) — cocok kalau Chatterbox-ID ternyata belum stabil (mis. kacau di kata-kata tunggal/vocab pendek) atau setup Python/GPU-nya terlalu ribet.
- Kualitas: voice "medium" (bukan tier tertinggi Piper), dilatih dari dataset terbatas + hasil edge-TTS — deskripsi pembuatnya sendiri "training results were quite good" tapi bukan klaim expressive/emosional. Realistisnya: natural & jelas, TAPI tidak akan menjawab "kurang emosi" sebaik Chatterbox — lebih cocok sebagai jaring pengaman drpd solusi utama.
- Ditambahkan resmi ke `rhasspy/piper-voices` per Agustus 2025 — relatif baru, worth dicek update terbaru saat implementasi.

**Kandidat lain yang PERLU DIHINDARI** (sudah masuk tabel §0, diulang di sini biar tidak salah pilih pas cari-cari di HuggingFace): `facebook/mms-tts-ind` (CC-BY-NC), `Eempostor/F5-TTS-INDO-FINETUNE(-V2)` (CC-BY-NC via base F5-TTS). Ada juga `jerichosiahaya/vits-tts-id` (VITS, dilatih dari resep LJSpeech) — lisensinya belum sempat diverifikasi di riset ini, **cek eksplisit sebelum dipakai**.

---

## 2. Perbandingan Ringkas

| | Chatterbox (EN) | Chatterbox-ID (finetune) | Kokoro-82M (EN) | Piper (EN & ID) |
|---|---|---|---|---|
| Lisensi | MIT | Apache 2.0 | Apache 2.0 | MIT |
| Kontrol emosi | Ya (`exaggeration`) | Ya (arsitektur sama) | Tidak ada knob eksplisit | Tidak ada |
| Kualitas/naturalness | Sangat tinggi (menang vs ElevenLabs di eval) | Tinggi, belum sebanyak dibenchmark pihak ke-3 | Tinggi utk ukuran kecil | Sedang ("medium" tier) |
| Kebutuhan hardware | GPU disarankan (CPU tetap bisa, lebih lambat) | Sama seperti Chatterbox EN | Sangat ringan, CPU cukup | Sangat ringan, CPU lemah pun cukup |
| Voice cloning | Ya (5 detik referensi) | Kemungkinan ikut arsitektur dasar | Tidak | Tidak |
| Cocok utk | Solusi utama kedua bahasa | Solusi utama Indonesia | Fallback ringan EN | Fallback/jaring-pengaman kedua bahasa |

---

## 3. Skala Konten Aplikasi Ini (konteks buat estimasi generate)

Dicek langsung dari `app/src/content.ts` — file ini **15.618 baris / 788KB**, berisi field `en`/`id` (kata, kalimat, pertanyaan, opsi jawaban, cerita, dsb) untuk 5 skill × 6 level × puluhan topik/skill. Perkiraan kasar: **ribuan string unik** yang perlu diucapkan (order of magnitude low-thousands, bukan puluhan/ratusan-ribu). Ini penting buat 2 hal:
1. **Waktu generate** — beberapa ribu klip pendek (1-4 detik) itu skala yang sangat wajar utk dikerjakan sekali (one-time batch), bukan proyek berbulan-bulan: di CPU biasa bisa selesai dalam hitungan jam, di GPU murah sewaan (Colab gratis/T4, atau RunPod/Vast.ai beberapa dolar) bisa selesai dalam hitungan menit-puluhan menit.
2. **Ukuran storage** — MP3 mono 64-96kbps, klip 1-4 detik ≈ 15-40KB/klip → total ribuan klip realistisnya **puluhan MB**, bukan GB. Sangat aman utk VPS 2-core/4GB (CLAUDE.md) — bahkan LEBIH ringan dari sekarang, karena generate audio-nya sendiri terjadi SEKALI di luar VPS (laptop/GPU sewaan), VPS cuma perlu serve file statis.

Konten juga terus bertambah (banyak modul di CLAUDE.md masih "belum tuntas", mis. Grammar format lama) — jadi pipeline generate **wajib idempotent/incremental** (skip string yang sudah punya file audio), bukan generate-ulang semua tiap kali nambah 1 topik baru.

---

## 4. Bagaimana Cara Generate

### Langkah 0 — Hardware
Karena ini pekerjaan SEKALI (bukan runtime), tidak perlu beli GPU. Pilihan realistis:
- CPU laptop yang ada sekarang — pakai varian ringan (Chatterbox Nano / Piper) atau jalankan overnight kalau pakai Chatterbox Original/Multilingual yang lebih berat.
- Google Colab (tier gratis dapat GPU T4) — cukup utk beberapa ribu klip pendek dalam 1 sesi.
- Sewa GPU murah per-jam (RunPod/Vast.ai) — beberapa dolar saja utk sekali jalan penuh, lalu instance dimatikan (bukan biaya berulang).

### Langkah 1 — Ekstrak semua string yang perlu diucapkan
Butuh script (Node/TS, pola SAMA seperti `app/scripts/verify-vocab-content.mjs` yang sudah ada di repo — import `*_TOPICS_BY_LEVEL` langsung dari `content.ts` via esbuild, bukan regex teks manual) yang:
1. Walk semua topik di `VOCAB_TOPICS_BY_LEVEL`, `LISTENING_TOPICS_BY_LEVEL`, `READING_TOPICS_BY_LEVEL`, `SPEAKING_TOPICS_BY_LEVEL`, `GRAMMAR_TOPICS_BY_LEVEL`, dan kumpulkan tiap field yang faktanya dilewatkan ke `speak()`/`speakLocalized()`/`speakSequence()` di kode game (`item.en`, `example.en`, `question.en`/`.text`, `options[].label`, baris `story`/`passage`/`dialogueLines`/`notePassage`, dst — daftar persis field per format tercantum di CLAUDE.md).
2. Terapkan `stripEmojiForSpeech()` yang SAMA PERSIS dgn logic yang sudah ada di `speech.ts` (biar audio yang di-generate match dgn apa yang benar-benar dikirim ke TTS saat ini, bukan teks mentah dgn emoji).
3. Dedupe exact string (case-sensitive, per bahasa) — 1 kalimat yang dipakai ulang di banyak tempat cukup 1 file audio.
4. Output `tts-queue.json`: array `{ text: string; lang: 'en' | 'id' }`.

### Langkah 2 — Setup Python
```bash
python -m venv .venv && source .venv/bin/activate
pip install chatterbox-tts torchaudio
# ffmpeg wajib ada di PATH (buat convert wav → mp3 & normalize)
```

### Langkah 3 — Script generate (`tts_generate.py`, contoh kerangka)
```python
import json, hashlib, subprocess
from pathlib import Path
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

OUT_DIR = Path("app/public/audio")
queue = json.loads(Path("tts-queue.json").read_text())

models = {}  # cache per-bahasa, load sekali
def get_model(lang: str):
    if lang not in models:
        if lang == "en":
            models[lang] = ChatterboxTTS.from_pretrained(device="cuda")  # atau "cpu"/"mps"
        else:  # "id" — checkpoint finetune, cek README model card
            # cara loading checkpoint kustom bervariasi per repo — verifikasi
            # instruksi resmi di model card grandhigh/Chatterbox-TTS-Indonesian
            # saat implementasi (mis. from_pretrained(repo_id=...) atau
            # download manual + from_local(ckpt_dir)).
            models[lang] = ChatterboxTTS.from_pretrained(device="cuda", ...)
    return models[lang]

manifest = {}
for entry in queue:
    text, lang = entry["text"], entry["lang"]
    key = f"{lang}:{text}"
    h = hashlib.sha1(key.encode()).hexdigest()
    mp3_path = OUT_DIR / lang / f"{h}.mp3"
    manifest[key] = f"{lang}/{h}.mp3"
    if mp3_path.exists():
        continue  # idempotent — skip yang sudah pernah di-generate

    model = get_model(lang)
    wav = model.generate(text, exaggeration=0.55, cfg_weight=0.5)  # tuning awal, dengarkan & sesuaikan
    wav_path = mp3_path.with_suffix(".wav")
    ta.save(str(wav_path), wav, model.sr)

    # normalize loudness + trim silence + convert ke mp3 mono kecil
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-i", str(wav_path),
        "-af", "loudnorm,silenceremove=start_periods=1:start_threshold=-45dB",
        "-ar", "44100", "-ac", "1", "-b:a", "96k", str(mp3_path),
    ], check=True)
    wav_path.unlink()

Path("app/public/audio/manifest.json").write_text(json.dumps(manifest, indent=2))
```
Catatan pada kerangka di atas:
- `exaggeration`/`cfg_weight` di atas HANYA titik awal — nilai yang pas buat "hangat & ceria ala guru anak" perlu dicari dgn coba-dengar beberapa sample dulu (§ QA di bawah), bukan angka final.
- Cara load checkpoint finetune Indonesia belum terverifikasi presisi di riset ini (dokumentasi resmi Chatterbox belum expose API `from_local` secara eksplisit) — **cek model card `grandhigh/Chatterbox-TTS-Indonesian` di HuggingFace saat implementasi** utk cara loading yang benar.

### Langkah 4 — QA sebelum full-batch
1. Generate ~10-20 sample dulu: campuran kata tunggal pendek (vocab, mis. "Dog", "Seven") + kalimat penuh (contoh soal Listening/Reading) + 1-2 kalimat Indonesia.
2. **Dengarkan manual** — model neural TTS umumnya dilatih dari korpus kalimat, jadi KATA TUNGGAL (banyak dipakai app ini utk Vocab) kadang jadi terdengar aneh (nada naik di akhir seolah belum selesai, atau jeda ganjil). Kalau ini terjadi, opsi mitigasi: tambahkan tanda titik di akhir kata sebelum generate (`"Dog."` bukan `"Dog"`) atau uji beberapa nilai `cfg_weight`/`exaggeration` lain — TIDAK ada solusi otomatis, wajib dicek per-telinga.
3. Baru setelah puas dgn kualitas sample, jalankan `tts_generate.py` penuh ke seluruh `tts-queue.json`.

---

## 5. Bagaimana Cara Save

- **Lokasi**: `app/public/audio/en/<hash>.mp3` dan `app/public/audio/id/<hash>.mp3` — disajikan sebagai file statis persis seperti `app/public/styles.css` sekarang, TANPA backend baru (konsisten PRD §5 "client-side murni").
- **Manifest**: `app/public/audio/manifest.json` — objek `{ "en:Dog": "en/<hash>.mp3", "id:Anjing": "id/<hash>.mp3", ... }`. Kunci `"<lang>:<text-persis>"` supaya lookup runtime tidak perlu hashing ulang di browser (§6).
- **Naming**: SHA-1 dari `"<lang>:<text>"` — deterministik (re-run script menghasilkan nama file yang sama utk teks yang sama, jadi cache browser/CDN tidak pernah invalid tanpa alasan) dan otomatis idempotent (§4 Langkah 3).
- **Git**: dengan estimasi ukuran total puluhan MB (§3), commit langsung ke repo dulu — paling simpel, konsisten dgn prinsip "tanpa infra tambahan". Kalau ke depan kontennya membengkak jauh lebih besar (ratusan MB+), pertimbangkan pindah ke object storage terpisah (Cloudflare R2 / Backblaze B2 — free tier keduanya cukup besar utk skala ini) dan cuma commit `manifest.json` berisi URL — TAPI ini optimisasi masa depan, bukan kebutuhan hari-1.
- **Cache-Control**: karena nama file immutable (hash dari isi), aman diberi header `Cache-Control: public, max-age=31536000, immutable` di web server (nginx/dsb) — anak yang sudah pernah buka 1 topik tidak akan download ulang audio yang sama di sesi berikutnya.

---

## 6. Bagaimana Cara Integrasi ke Aplikasi

Prinsip: **tambah, jangan ganti** — `app/src/speech.ts` tetap ada apa adanya sbg fallback, precomputed audio jadi jalur UTAMA yang dicoba lebih dulu.

1. **Load manifest sekali di awal app** (mis. saat `app.ts` inisialisasi): `fetch('/audio/manifest.json')` → simpan sbg `Map<string,string>` di memory. Ukurannya kecil (ribuan entry pendek), aman di-load sekaligus.
2. **`speak(text)`** — sebelum jalan ke `speechSynthesis`, cek `manifest.get('en:' + text)`. Kalau ketemu: mainkan lewat 1 elemen `<audio>` yang di-reuse (bukan bikin baru tiap panggil, sama semangat dgn `getAudioCtx()` yang sudah ada di file ini), set `audio.src`, `audio.playbackRate = playbackRate`, `audio.play()`. Kalau TIDAK ketemu di manifest (teks baru yang belum sempat di-generate ulang, atau typo) → **fallback ke `speechSynthesis` yang sudah ada, TIDAK DIHAPUS** — best-effort, pola yang sama persis dgn cara app ini menangani `getUserMedia` gagal di fitur mic (CLAUDE.md: "best-effort, bukan dead-end").
3. **`speakLocalized(text, lang)`** — sama, cek `manifest.get(lang + ':' + text)` dulu.
4. **`speakSequence(lines)`** — kalau SEMUA baris ada di manifest, mainkan berurutan lewat event `audio.onended` (bukan `setTimeout` + tebak `gapMs` seperti sekarang) — ini malah **lebih presisi** dari implementasi saat ini karena durasi asli file diketahui, bukan diperkirakan. Kalau ADA SATU SAJA baris yang belum punya file precomputed, fallback total ke jalur `speechSynthesis` sequence yang sudah ada (supaya tidak nyampur audio file + robot voice di 1 sequence yang sama, kedengarannya aneh).
5. **`playbackRate` (slider 0.5×-1.5× yang sudah ada) tetap kompatibel** — `HTMLMediaElement.playbackRate` didukung luas di browser modern, dan `preservesPitch` (default `true` sejak Baseline 2023) otomatis menjaga pitch tetap natural saat kecepatan diubah — TIDAK perlu generate ulang beberapa versi kecepatan, cukup 1 file per teks per bahasa.
6. **⚠️ Keputusan produk yang perlu dikonfirmasi**: fitur pilih aksen (US/UK) & gender voice yang sudah ada di `voice-panel.ts` HANYA akan berlaku ke jalur FALLBACK (`speechSynthesis`) — precomputed audio realistisnya cuma 1 suara "resmi" per bahasa (generate 4 kombinasi aksen×gender = 4× kerja generate + 4× storage + 4× waktu QA, blm tentu sepadan mengingat tujuan utamanya "benerin emosi", bukan "nambah pilihan suara"). Ini keputusan yang perlu diputuskan eksplisit sebelum mulai generate besar-besaran, bukan diasumsikan.
7. **Build/CI**: generate audio TIDAK masuk `npm run build`/CI (butuh Python+model besar+kadang GPU, tidak cocok jalan otomatis tiap build) — ini langkah manual/periodik yang dijalankan developer tiap kali ada konten baru signifikan, lalu hasil (`app/public/audio/**` + `manifest.json`) di-commit sbg artifact biasa, persis seperti aset statis lain.

---

## 7. Risiko & Catatan Lain

- **Lisensi bisa berubah** — status "gratis komersial" di atas berlaku per riset ini (September 2026). Kalau proyek generate audio ditunda lama, cek ulang lisensi terbaru tiap model sebelum benar-benar generate — terutama Higgs Audio V2 yang bersyarat (§0).
- **Voice cloning & hak suara** — kalau nanti ingin "1 suara resmi" yang lebih personal lewat `audio_prompt_path` (Chatterbox), pastikan referensi suaranya dari orang yang memang memberi izin (rekam sendiri/rekan yang consent) — JANGAN clone suara publik figure/selebriti/karakter berhak cipta tanpa izin, ini risiko hukum, bukan cuma etika.
- **Kualitas kata tunggal** — sudah disinggung di §4 Langkah 4, ini risiko nyata karena app ini banyak memutar KATA SAJA (bukan kalimat) utk Vocabulary — wajib QA manual per-sample, jangan asumsikan otomatis bagus.
- **Konten terus bertambah** (banyak modul di CLAUDE.md masih "belum tuntas", spt Grammar format lama) — pipeline generate wajib incremental/idempotent (§4 Langkah 3 sudah didesain begitu), supaya nambah 1 topik baru tidak berarti re-generate ribuan file lama yang sudah ada.
- **App tetap harus jalan tanpa audio file** (offline-first/first-load sebelum manifest ke-fetch, atau kalau CDN/hosting audio down) — fallback ke `speechSynthesis` yang sudah ada menjamin ini, TIDAK BOLEH dihapus meski precomputed audio sudah lengkap.

---

## 8. Rekomendasi Langkah Selanjutnya (kalau mau lanjut)

1. Install `chatterbox-tts` di lokal, generate ~10 sample suara Inggris (kata tunggal + kalimat) dan ~10 sample suara Indonesia (pakai checkpoint `grandhigh/Chatterbox-TTS-Indonesian`) — dengarkan langsung, putuskan apakah kualitas & "rasa emosinya" sudah sesuai ekspektasi SEBELUM investasi waktu ke pipeline penuh.
2. Kalau kualitas OK → putuskan brief "1 suara resmi" per bahasa (mis. karakter "guru TK yang hangat & ceria") dan nilai `exaggeration`/`cfg_weight` yang pas.
3. Bangun script ekstraksi (`tts-queue.json`) dari `content.ts` — cakupan awal bisa mulai dari 1 skill/level dulu (mis. Vocabulary Little Stars) sbg pilot, sebelum full rollout ke semua skill/level.
4. Bangun `tts_generate.py` + manifest, generate pilot, lalu integrasikan ke `speech.ts` sesuai §6 dan uji live di app (mobile + desktop, sesuai Aturan Wajib CLAUDE.md).
5. Kalau pilot sukses → generate full-batch semua konten, commit `app/public/audio/**`.

---

## Sumber

- [The Best Open-Source Text-to-Speech Models in 2026 — BentoML](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)
- [coqui/XTTS-v2 — Paid or free for commercial usage? (HuggingFace discussion)](https://huggingface.co/coqui/XTTS-v2/discussions/106)
- [Coqui XTTS v2 License (CPML): Commercial Use Guide 2026 — PromptQuorum](https://www.promptquorum.com/power-local-llm/local-tts-voice-cloning-piper-coqui-xtts)
- [hexgrad/Kokoro-82M — HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M)
- [Kokoro-82M: The best TTS model in just 82 Million parameters — Medium](https://medium.com/data-science-in-your-pocket/kokoro-82m-the-best-tts-model-in-just-82-million-parameters-512b4ba4f94c)
- [facebook/mms-tts-ind — HuggingFace](https://huggingface.co/facebook/mms-tts-ind)
- [MMS and NLLB protect linguistic diversity — Medium](https://medium.com/@klebnoel/leverage-metas-models-to-protect-the-world-s-languages-90c0c5daf88b)
- [rhasspy/piper-voices — Please add bahasa indonesia (HuggingFace discussion)](https://huggingface.co/rhasspy/piper-voices/discussions/40)
- [Piper voices licensing question — GitHub discussion](https://github.com/rhasspy/piper/discussions/271)
- [Chatterbox: Open Source Text-to-Speech — Resemble AI](https://www.resemble.ai/learn/models/chatterbox)
- [resemble-ai/chatterbox — GitHub](https://github.com/resemble-ai/chatterbox)
- [chatterbox-tts — PyPI](https://pypi.org/project/chatterbox-tts/)
- [grandhigh/Chatterbox-TTS-Indonesian — HuggingFace](https://huggingface.co/grandhigh/Chatterbox-TTS-Indonesian)
- [Chatterbox Turbo: Open Source, Ultrafast Text-to-Speech — Resemble AI](https://www.resemble.ai/learn/models/chatterbox-turbo)
- [devnen/Chatterbox-TTS-Server — GitHub](https://github.com/devnen/Chatterbox-TTS-Server)
- [boson-ai/higgs-audio — GitHub](https://github.com/boson-ai/higgs-audio)
- [bosonai/higgs-audio-v2-generation-3B-base — HuggingFace](https://huggingface.co/bosonai/higgs-audio-v2-generation-3B-base)
- [canopyai/Orpheus-TTS — GitHub](https://github.com/canopyai/Orpheus-TTS)
- [SWivid/F5-TTS — commercially usable models? (HuggingFace discussion)](https://huggingface.co/SWivid/F5-TTS/discussions/7)
- [Clarification on Training Data, Licensing, and Building a Commercial Base Model — F5-TTS GitHub discussion](https://github.com/SWivid/F5-TTS/discussions/997)
- [Eempostor/F5-TTS-INDO-FINETUNE-V2 — HuggingFace](https://huggingface.co/Eempostor/F5-TTS-INDO-FINETUNE-V2)
- [jerichosiahaya/vits-tts-id — HuggingFace](https://huggingface.co/jerichosiahaya/vits-tts-id)
- [HTMLMediaElement: preservesPitch property — MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch)
