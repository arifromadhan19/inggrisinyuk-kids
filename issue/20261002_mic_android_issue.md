# Mic tidak mendengar di Android (production) — "Belum kedengaran, coba lagi ya 🎧"

Dilaporkan user 2026-10-02: di https://inggrisinyuk.com (VPS), Chrome Android, 2 HP berbeda. Tap 🎤 (contoh: Vocab Little Stars "Kenal Warna (Colors)", Kenalan, kata "Yellow") → izin mikrofon diberikan → anak bicara → popup selalu "Belum kedengaran, coba lagi ya 🎧". Hasil sama di kedua HP, jadi masalahnya bukan di 1 perangkat.

**Info tambahan dari user:** popup muncul **beberapa detik setelah** mic ditap, tidak langsung. Error yang cepat (`audio-capture`, `not-allowed`) jadi kecil kemungkinannya. Yang paling cocok adalah jalur `no-speech`: recognizer berjalan tapi hanya menerima hening (#1), atau mendengar tapi tidak pernah mengirim hasil final (#2).

Status: **solusi 1, 2 & 4 sudah dikerjakan 2026-10-02 (lihat "Yang Sudah Dikerjakan" di bawah), menunggu tes di HP Android sungguhan.** Belum dicek langsung di HP (perlu remote debugging, lihat bagian Cara Memastikan).

## Issue

Popup itu muncul dari cabang `onError` di `micFor()` (`app/src/games/vocabulary.ts:379`). Cabang itu dipanggil `listenAndRecordOnce()` (`app/src/speech.ts:720`) untuk **semua** jenis error kecuali `aborted`: `no-speech`, `not-allowed`, `audio-capture`, `network`, dan `error`. Akibatnya dari layar tidak bisa dibedakan apakah:

- recognizer jalan tapi tidak menerima suara (`no-speech`, atau `onend` tanpa transkrip final),
- mic dipakai proses lain (`audio-capture`),
- layanan pengenalan suara Google tidak bisa dihubungi (`network`),
- izin ditolak di level sistem atau layanan (`not-allowed` / `service-not-allowed`).

HTTPS bukan penyebabnya: prompt izin mic muncul dan diizinkan, dan itu hanya terjadi di secure context. Konfigurasi nginx juga tidak mengirim header `Permissions-Policy` yang memblokir mic (`deploy/nginx.conf`).

Kemungkinan besar bug ini sudah ada sejak awal dan baru terlihat sekarang: sebelum deploy, aplikasi hanya dites di desktop lewat `http://localhost`. HP tidak bisa memakai mic lewat `http://<ip-lan>` karena bukan secure context, jadi production adalah tes Android pertama.

## Root Cause (urut dari yang paling mungkin)

### 1. Mic dipakai dua pihak sekaligus: `getUserMedia` + `MediaRecorder` berebut dengan `SpeechRecognition` (paling mungkin)

`listenAndRecordOnce()` memanggil `ensureMicStream()` (`getUserMedia` + `MediaRecorder.start()`, untuk "▶️ Play Suaramu") dan `rec.start()` (SpeechRecognition) secara **paralel** (`speech.ts:736-773`).

- **Desktop Chrome:** pengenalan suara memakai audio capture milik browser, dan beberapa konsumen bisa berbagi mic. Itu sebabnya di laptop berjalan normal.
- **Chrome Android:** `webkitSpeechRecognition` diteruskan ke recognizer sistem (layanan Google / Android SpeechRecognizer), yang membuka mic **sendiri**. Begitu halaman sudah memegang mic lewat `getUserMedia`, Android memberi input audio ke satu pihak saja. Recognizer kebagian hening, lalu berakhir dengan `no-speech` atau `audio-capture`, atau `onend` tanpa hasil final. Ini keterbatasan Chrome Android yang sudah dikenal (Web Speech + getUserMedia bersamaan tidak andal di Android).
- Urutannya juga balapan: `getUserMedia` itu asinkron. Pada tap pertama (saat prompt izin muncul) stream biasanya didapat **setelah** `rec.start()`, jadi siapa yang menang bisa berbeda tiap tap. Tapi di kedua HP hasilnya konsisten gagal, jadi kemungkinan besar recognizer selalu kalah.

Ini cocok dengan semua gejala: izin diberikan, tidak ada pesan error yang jelas, gagal di semua perangkat Android, normal di desktop.

### 2. `continuous = true` + hanya memakai hasil `isFinal` (tidak andal di Android)

`wireContinuousListen()` (`speech.ts:519`) menyetel `continuous = true` dan `interimResults = true`, tapi transkrip hanya dikumpulkan dari hasil yang `isFinal` (`speech.ts:561-569`). Saat diam, kode memanggil `rec.stop()` sendiri lewat `silenceTimer`.

Mode continuous di Chrome Android punya perilaku yang menyimpang dan sudah dikenal:
- sesi bisa berakhir sendiri setelah beberapa detik,
- hasil sering datang sebagai interim yang berulang/dobel,
- setelah `stop()`, hasil `isFinal` kadang tidak pernah dikirim sebelum `onend`.

Kalau final tidak pernah datang, `finalTranscript` tetap kosong. `onend` lalu memanggil `onErr('no-speech')` (`speech.ts:589-596`), padahal recognizer sebenarnya sudah mendengar kata (sebagai interim). Hasilnya juga "Belum kedengaran". Penyebab ini bisa muncul sendiri, atau bersamaan dengan penyebab #1.

### 3. `stopSpeaking()` tepat sebelum `rec.start()` (kontributor kecil)

`wireContinuousListen()` memanggil `speechSynthesis.cancel()` lalu langsung `rec.start()`. Di Android, TTS dan recognizer sama-sama layanan sistem yang berebut audio focus. Memulai pengenalan pada milidetik yang sama dengan pembatalan TTS bisa membuat recognizer langsung berakhir. Ini lebih jarang, tapi bisa menambah kegagalan di kata pertama setelah 🔊.

### 4. Layanan pengenalan suara di HP tidak tersedia (kurang mungkin karena terjadi di 2 HP)

Recognizer di Android bergantung pada aplikasi Google / "Speech Recognition & Synthesis" serta koneksi ke server Google. Kalau layanan itu dimatikan, versinya lama, atau tidak ada (HP tanpa Google Mobile Services, misalnya beberapa Huawei), error-nya `network` / `service-not-allowed`. Karena pesannya digabung, kasus ini juga tampil sebagai "Belum kedengaran".

### Masalah penyerta: pesan error menyamarkan penyebab

Pola ini sama dengan `20260924_login_124_issue.md`. Semua `ListenErrorKind` di 9 titik pemanggil (`vocabulary.ts`, `speaking.ts`, `grammar.ts`, `boss.ts`, dll.) ditampilkan dengan satu kalimat yang sama. Pengguna dan developer tidak bisa membedakan "anak kurang keras" dari "mic dipakai proses lain" atau "layanan Google tidak tersedia". Komentar di `speech.ts:461-467` sendiri sudah menyebut bahwa pesan harus dipisah, tapi pemanggilnya belum mengikuti.

## Cara Memastikan (sebelum memperbaiki)

1. **Remote debugging:** sambungkan HP lewat USB, aktifkan USB debugging, buka `chrome://inspect` di laptop, lalu inspect tab inggrisinyuk.com. Tap 🎤 dan catat `event.error` di `onerror` serta apakah `onresult` muncul (interim atau final).
2. **Uji isolasi penyebab #1:** di console Android, jalankan `webkitSpeechRecognition` polos **tanpa** `getUserMedia` (`continuous=false`), lalu bicara.
   - Kalau berhasil, sedangkan versi app gagal → penyebab #1 terkonfirmasi.
   - Kalau ikut gagal → periksa #4 (layanan Google di HP).
3. **Uji penyebab #2:** sama seperti langkah 2 tapi dengan `continuous=true, interimResults=true`. Catat apakah `isFinal` pernah `true` sebelum `onend`.
4. **Data tambahan dari user:** apakah popup muncul langsung (kurang dari 1 detik) atau setelah menunggu bicara; merek/versi Android; versi Chrome. Muncul langsung → mengarah ke `audio-capture` / `network`. Muncul setelah menunggu → mengarah ke `no-speech` (#1 atau #2).

### Snippet tes di console (tempel di DevTools tab inggrisinyuk.com)

```js
// Tes A — recognizer polos, tanpa getUserMedia
(() => { const r = new webkitSpeechRecognition(); r.lang='en-US'; r.continuous=false; r.interimResults=true;
  ['start','audiostart','soundstart','speechstart','speechend','soundend','audioend','end','nomatch'].forEach(ev => r['on'+ev] = () => console.log('A', ev));
  r.onresult = e => console.log('A result', [...e.results].map(x => [x[0].transcript, x.isFinal]));
  r.onerror = e => console.log('A error', e.error); r.start(); })();

// Tes B — sama, tapi mic dibuka dulu lewat getUserMedia (meniru app)
navigator.mediaDevices.getUserMedia({audio:true}).then(s => { new MediaRecorder(s).start(); console.log('B mic held');
  const r = new webkitSpeechRecognition(); r.lang='en-US'; r.interimResults=true;
  ['audiostart','soundstart','speechstart','end'].forEach(ev => r['on'+ev] = () => console.log('B', ev));
  r.onresult = e => console.log('B result', [...e.results].map(x => [x[0].transcript, x.isFinal]));
  r.onerror = e => console.log('B error', e.error); r.start(); });

// Tes C — continuous=true seperti app: ganti r.continuous=true di Tes A, cek apakah isFinal pernah true
```

Cara membaca hasil:
- **A berhasil, B gagal / tanpa `soundstart`:** penyebab #1 terkonfirmasi.
- **A dan B mendapat interim tapi `isFinal` tidak pernah `true` sebelum `end`:** penyebab #2.
- **A pun gagal:** penyebab #4 (layanan Google di HP).

## Fundamental Solution (usulan, belum dikerjakan)

1. **Jangan buka `getUserMedia` paralel dengan `SpeechRecognition` di Android.**
   - Deteksi Android (`/Android/i.test(navigator.userAgent)`) atau, lebih aman, sebuah capability flag.
   - Di Android, lewati `ensureMicStream()`/`MediaRecorder`. Pengenalan suara (skor) adalah fungsi inti; "▶️ Play Suaramu" adalah pelengkap. CLAUDE.md sudah mengizinkan tombol ini nonaktif kalau perekaman tidak bisa ("best-effort ... bukan dead-end").
   - Alternatif kalau Play Suaramu tetap wajib di Android: rekam **berurutan** (misalnya mic MediaRecorder dulu, lalu kirim audio ke pengenalan). Web Speech tidak menerima input audio, jadi ini butuh STT server. Itu bertentangan dengan PRD v1 (tanpa backend AI), jadi sebaiknya tidak dipilih untuk sekarang.
2. **Simpan transkrip interim terakhir sebagai cadangan.** Kalau `onend` datang tanpa final tapi ada interim, pakai interim tersebut (`onFinal(lastInterim, 0)`). Pertimbangkan `continuous = false` di Android: satu ucapan pendek (1 kata atau kalimat Vocab) memang cukup dengan mode non-continuous. Jeda napas yang memotong kalimat panjang (alasan awal memakai `continuous`) lebih jarang terjadi untuk materi pendek.
3. **Beri jeda sekitar 150–300 ms antara `stopSpeaking()` dan `rec.start()`**, atau mulai setelah `speechSynthesis.speaking === false`.
4. **Pisahkan pesan error per jenis** di satu helper bersama, misalnya `micErrorText(kind)` di `speech.ts`, lalu pakai di semua pemanggil. Teks tetap kid-friendly dan non-punitive, misalnya:
   - `no-speech` → "Belum kedengaran, coba lagi ya 🎧"
   - `not-allowed` → "Mic belum diizinkan — minta tolong Ayah/Bunda buka izin mikrofon 🎤"
   - `audio-capture` → "Mic sedang dipakai aplikasi lain, tutup dulu ya"
   - `network` → "Butuh internet untuk mendengar suaramu 📶"
5. **Verifikasi wajib di HP Android sungguhan** (minimal 2 perangkat, Chrome terbaru) sebelum dianggap selesai. Tes di desktop atau Playwright tidak bisa mereproduksi bug ini karena recognizer Android berbeda.

Berkas terkait: `app/src/speech.ts` (`wireContinuousListen`, `listenAndRecordOnce`, `ensureMicStream`), serta semua pemanggil `listenAndRecordOnce` (`games/vocabulary.ts`, `speaking.ts`, `grammar.ts`, `listening.ts`, `boss.ts`, `placement.ts`).

## Yang Sudah Dikerjakan (2026-10-02)

1. **Perekaman tidak lagi dijalankan bersamaan di Android.** `voiceRecordingSupported` (`speech.ts`) bernilai `false` di Android, jadi `listenAndRecordOnce()` tidak memanggil `ensureMicStream()`/`MediaRecorder` dan mic sepenuhnya dipakai pengenalan suara. Di Android, tombol "▶️ Play Suaramu" tetap nonaktif (best-effort, sesuai CLAUDE.md). Desktop/iOS tidak berubah.
2. **Interim dipakai sebagai cadangan.** `wireContinuousListen()` sekarang menyimpan `interimTranscript`. Kalau `onend` (atau `no-speech`) datang tanpa hasil final, transkrip interim yang dipakai.
3. **Pesan error dipisah per jenis.** Helper `micErrorText(kind)` di `speech.ts` dipakai di semua layar ber-mic (`vocabulary`, `listening`, `grammar`, `speaking`, `boss`, `placement`). Pesan "Belum kedengaran" hanya muncul untuk `no-speech`.

Solusi #3 (jeda setelah `stopSpeaking()`) belum dikerjakan. Dikerjakan nanti kalau tes HP masih menunjukkan kegagalan setelah 🔊.

`npm run build` lolos. Tes wajib berikutnya: deploy, lalu coba 🎤 di 2 HP Android (Kenalan Vocab, Speaking, placement test).

## Lanjutan: "Play Suaramu" dikembalikan di Android (2026-10-02)

Setelah perbaikan di atas, mic Android **sudah berhasil** (dikonfirmasi user). User lalu meminta "▶️ Play Suaramu" tetap ada di Android, dan dipilih **opsi 1: urutan dibalik**:
- Di Android, `MediaRecorder` baru dimulai di `rec.onaudiostart`, yaitu setelah recognizer memegang mic. Sebelumnya rekaman jalan paralel sejak awal.
- **Pengaman:** kalau saat rekaman ikut jalan sesi mic berakhir `no-speech`/`audio-capture` 2x berturut-turut, rekaman dimatikan permanen di perangkat itu (localStorage `iyk-android-rec-off`). Satu kali berhasil mereset hitungan (`iyk-android-rec-fails`). Dengan begitu skor tidak bisa rusak permanen gara-gara Play Suaramu.
- Cara reset manual di HP (via Eruda): `localStorage.removeItem('iyk-android-rec-off')`.

Yang perlu dicek di HP:
1. Skor tetap jalan.
2. Tombol Play Suaramu aktif.
3. Rekamannya berisi suara anak, bukan hening.

Kalau rekamannya hening atau terpotong, ganti ke opsi 2 (tombol rekam terpisah).
