# TRD — Skema Progres, Attempt Log & Rapor Anak

Technical Requirements Document untuk perubahan skema database "InggrisinYuk Kids".
Dokumen ini **desain**, bukan laporan implementasi: belum ada satu baris kode pun
yang diubah. Konteks produk: [PRD.md](PRD.md), aturan kerja: [CLAUDE.md](CLAUDE.md).

- **Status**: proposal, siap diimplementasi bertahap (§11 Rencana Migrasi).
- **Menggantikan**: `ChildProgress.data: Json` (satu blob opaque per anak,
  PRD §15.6 poin 3) — lihat §11.1 kenapa blob itu tidak cukup lagi.
- **Tidak mengubah**: `ParentAccount`, `ChildProfile` (kecuali daftar relasi),
  `PlacementTestResult`, dan **tidak mengubah perilaku offline `app/` sama sekali**.

---

## 1. Ringkasan Permintaan Baru

Permintaan user yang harus didukung skema baru:

1. **"Setiap mencoba pakai di save"** — tiap percobaan anak disimpan, bukan cuma
   counter agregat (`correctAttempts`/`totalAttempts`) dan bukan cuma "modul selesai".
2. **Kenalan Vocab** — tap tombol 🔊/🎤/🎮 per kata tersimpan, warnanya bertahan
   setelah pindah layar **dan** lintas perangkat lewat login.
3. **Latihan Inti** — status "sudah dikerjakan" per soal bertahan waktu topik
   dibuka ulang ⇒ **urutan 10 soal harus stabil/resumable per (anak, topik)**,
   tidak di-shuffle ulang tiap masuk. Plus navigasi bebas ⬅️ Kembali / ➡️ Lanjut.
4. **Tantangan** — dua hal yang sama (status per item + navigasi bebas) untuk
   sub-game-nya (Eja Kata, Contoh Penggunaan: mic + Terjemahkan).
5. **Analitik & "rapor anak"** — data yang bisa di-query: tren ketepatan, mastery
   per skill/topik, kata/topik yang masih susah, riwayat percobaan mic, pola waktu main.

## 2. Batasan & Invarian yang Tidak Boleh Rusak

| # | Invarian | Sumber | Konsekuensi ke skema |
|---|---|---|---|
| I1 | Main **tanpa akun & offline harus tetap penuh** | PRD §5, §14.4/§14.5 | localStorage tetap **source of truth**. Semua state baru (termasuk urutan soal stabil) wajib hidup di `Store` lokal dulu, DB cuma mirror. |
| I2 | Sync bersifat **best-effort**: debounce 1.5s, bisa gagal, duplikat, terbalik urutan, bolong | `app.ts` `wireProgressSync` | Semua write **idempotent** (upsert + merge monoton), tidak boleh ada logic yang benar hanya kalau semua baris sampai & urut. |
| I3 | `mergeFromServer` **union/max, bukan overwrite** | `progress.ts` | Server harus bisa merangkai ulang payload bentuk `Store` (kontacts API tidak berubah), dan merge server-side juga union/max. |
| I4 | Non-punitive: tidak ada gating, tidak ada skor sebagai hukuman, 3 step bebas dibuka | CLAUDE.md, PRD §4.5/§4.6 | Skema **tidak menyimpan flag "locked"**. Status soal murni penanda "sudah dicoba", bukan izin lanjut. |
| I5 | VPS murah 2 vCPU / 4 GB | CLAUDE.md | Write per tap harus ≤ beberapa upsert ber-index; agregasi berat **tidak** dilakukan saat write per-attempt maupun saat render rapor. |
| I6 | Konten (`content.ts`) tinggal di bundle client, bukan di DB | PRD §5 | Attempt/progres menyimpan `skill`/`topic_id`/`item_index`/`item_ref` sebagai string denormalisasi, **tanpa FK ke tabel konten**. |
| I7 | XP monoton naik, tidak pernah turun | `progress.ts` `addXp` | Merge XP pakai `GREATEST`, aman untuk write telat/duplikat. |
| I8 | `activeDays`/streak berbasis **tanggal lokal perangkat** | `progress.ts` `isoDate` | Hari disimpan sebagai string `YYYY-MM-DD` kiriman client, bukan hasil konversi timezone di server. |
| I9 | Mic/Speaking **tidak** masuk hitungan akurasi objektif | `progress.ts` komentar `correctAttempts` | Event mic disimpan terpisah (`kind='speak'`, `graded=false`), tidak menaikkan `total_attempts`. |

## 3. Bentuk Desain (Ringkas)

Satu **event log lebar** + **beberapa tabel state/rollup kecil**. Hybrid, bukan
event-sourcing murni dan bukan blob.

```
ChildProfile (existing)
 ├─ ChildProgressState      1:1   scalar & pointer  (xp, akurasi, nama, avatar, posisi terakhir)
 ├─ TopicCompletion         1:N   set "done"        (bintang per topik)
 ├─ BossClearance           1:N   set "bossCleared" (buka Peta Level)
 ├─ ChildDailyStat          1:N   rollup per hari   (activeDays + tren + pola jam)
 ├─ ChildSectionProgress    1:N   urutan soal stabil + cursor + hitungan per section
 ├─ ChildItemProgress       1:N   status per slot/kata (termasuk tap 🔊/🎤/🎮 Kenalan)
 ├─ LearningEvent           1:N   log mentah tiap percobaan (analitik & drill-down)
 └─ PlacementTestResult (existing, tidak diubah)
```

Tiga lapis dengan tanggung jawab beda — ini inti desainnya:

| Lapis | Isi | Sifat | Kalau ada baris hilang? |
|---|---|---|---|
| **State** (`ChildProgressState`, `TopicCompletion`, `BossClearance`, `ChildSectionProgress`, `ChildItemProgress`) | Kebenaran "di mana anak sekarang" | **Snapshot-derived**, di-upsert dari `Store` lokal ⇒ **self-healing** | Sembuh sendiri di sync berikutnya (client selalu kirim snapshot penuh) |
| **Rollup** (`ChildDailyStat`) | Angka harian untuk rapor | **Derived**, dihitung ulang dari event log per hari yang tersentuh | Bisa direparasi dengan re-run recompute |
| **Log** (`LearningEvent`) | Riwayat mentah tiap percobaan | **Append-only, dedup by client id** | Detail analitik berkurang, **progres/bintang tidak terpengaruh** |

Konsekuensi penting: **progres anak tidak pernah bergantung pada kelengkapan event
log** (I2). Event log boleh bolong karena offline/overflow outbox; bintang, XP,
unlock, dan status soal tetap benar karena berasal dari snapshot.

---

## 4. Skema Prisma (Konkret)

Konvensi mengikuti file yang sudah ada: field camelCase + `@map` snake_case,
model `@@map` ke nama tabel plural snake_case, `String @id @default(uuid())`.

### 4.1 `ChildProfile` — hanya daftar relasi yang berubah

```prisma
model ChildProfile {
  id                     String   @id @default(uuid())
  parentId               String   @map("parent_id")
  name                   String?
  level                  String   @default("starter")
  placementTestDone      Boolean  @default(false) @map("placement_test_done")
  dismissedPlacementTest Boolean  @default(false) @map("dismissed_placement_test")
  createdAt              DateTime @default(now()) @map("created_at")

  parent           ParentAccount         @relation(fields: [parentId], references: [id], onDelete: Cascade)
  placementResults PlacementTestResult[]

  // progress ChildProgress?  <-- DIHAPUS (blob lama, lihat §11)
  progressState    ChildProgressState?
  topicCompletions TopicCompletion[]
  bossClearances   BossClearance[]
  dailyStats       ChildDailyStat[]
  sectionProgress  ChildSectionProgress[]
  itemProgress     ChildItemProgress[]
  events           LearningEvent[]

  @@map("child_profiles")
}
```

### 4.2 `ChildProgressState` — pengganti bagian skalar blob

```prisma
/** Satu baris per anak — semua field SKALAR dari `Store` (app/src/progress.ts):
 *  xp, akurasi, identitas lokal, posisi terakhir. Semua angka di sini di-merge
 *  MONOTON (`GREATEST`) karena client selalu mengirim snapshot penuh dan XP/
 *  attempt counter cuma pernah naik (PRD §4.6) — jadi write duplikat, telat,
 *  atau dari 2 perangkat sekaligus tidak pernah menurunkan nilai. */
model ChildProgressState {
  id      String @id @default(uuid())
  childId String @unique @map("child_id")

  /** Merge: GREATEST(existing, incoming). Tidak pernah turun (invarian I7). */
  xp              Int @default(0)
  correctAttempts Int @default(0) @map("correct_attempts")
  totalAttempts   Int @default(0) @map("total_attempts")

  /** Nama panggilan & avatar yang DIPILIH ANAK di app (Store.name/avatar) —
   *  SENGAJA beda kolom dari `ChildProfile.name` (diisi orang tua saat daftar).
   *  Jangan digabung: rapor perlu menampilkan keduanya tanpa saling menimpa. */
  nickname String?
  avatar   String?

  /** "Lanjutkan di mana tadi" (Store.last). `lastTopicId` ditambahkan di
   *  samping index karena index bisa bergeser kalau urutan topik di content.ts
   *  diubah — resume prioritas pakai id, fallback ke index. */
  lastSkill      String? @map("last_skill")
  lastTopicId    String? @map("last_topic_id")
  lastTopicIndex Int?    @map("last_topic_index")
  lastStep       Int?    @map("last_step")
  lastLevel      String? @map("last_level")

  /** Hari lokal terakhir yang ada aktivitas — cache murni supaya rapor bisa
   *  menampilkan "terakhir main" tanpa query tabel harian. */
  lastActiveDay String? @map("last_active_day") @db.VarChar(10)

  /** Jam snapshot menurut CLIENT (bukan server) — dipakai sebagai guard
   *  last-write-wins khusus field yang memang bukan monoton (posisi terakhir). */
  clientUpdatedAt DateTime? @map("client_updated_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@map("child_progress_state")
}
```

### 4.3 `TopicCompletion` — set `done`

```prisma
/** Pengganti `Store.done: string[]` (tag `${skill}:${topicId}`). Kunci naturalnya
 *  DIBUAT SAMA PERSIS dengan tag client (skill + topicId, TANPA level) supaya
 *  union-merge lintas perangkat tidak pernah menghasilkan duplikat. `level` cuma
 *  atribut laporan (best-effort dari client), bukan bagian identitas.
 *  ⚠️ Invarian konten: `topic.id` harus tetap unik lintas level & append-only
 *  (per hari ini sudah: 27 id, tidak ada tabrakan) — kalau nanti ada 2 level
 *  pakai id topik sama, tag client-nya sendiri sudah ambigu, jadi itu harus
 *  diperbaiki di content.ts, bukan di sini. */
model TopicCompletion {
  id          String   @id @default(uuid())
  childId     String   @map("child_id")
  skill       String
  topicId     String   @map("topic_id")
  level       String?
  firstDoneAt DateTime @default(now()) @map("first_done_at")
  lastDoneAt  DateTime @default(now()) @map("last_done_at")

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, skill, topicId])
  @@map("topic_completions")
}
```

### 4.4 `BossClearance` — set `bossCleared`

```prisma
/** Pengganti `Store.bossCleared: LevelKey[]` — penggerak buka/kunci Peta Level
 *  (`levelUnlockMap`, dan `unlockLevelsUpTo()` yang menandai SEMUA level di bawah
 *  level anak sebagai sudah ditaklukkan — CLAUDE.md "Aturan Wajib" Peta Level).
 *  Idempotent by design: satu baris per (anak, level), upsert DO NOTHING. */
model BossClearance {
  id        String   @id @default(uuid())
  childId   String   @map("child_id")
  level     String
  clearedAt DateTime @default(now()) @map("cleared_at")

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, level])
  @@map("boss_clearances")
}
```

### 4.5 `ChildDailyStat` — `activeDays` + rollup rapor

```prisma
/** Rollup per HARI LOKAL PERANGKAT. Dua fungsi sekaligus:
 *  1. Pengganti `Store.activeDays` — ADA BARIS = hari itu aktif (persis semantik
 *     lama, jadi strip 7 hari & `getStreak` 1-hari-pelindung tidak berubah).
 *  2. Sumber SEMUA tren di rapor (ketepatan harian, XP harian, jam main) — inilah
 *     pra-agregasi yang bikin rapor tidak perlu men-scan `learning_events`.
 *  Semua counter DIHITUNG ULANG dari `learning_events` untuk hari yang tersentuh
 *  (bukan di-increment) — makanya aman terhadap event duplikat/terbalik (I2). */
model ChildDailyStat {
  id      String @id @default(uuid())
  childId String @map("child_id")

  /** `YYYY-MM-DD` menurut jam LOKAL perangkat (I8) — VarChar, bukan Date,
   *  supaya tidak ada konversi timezone di server yang bisa menggeser streak. */
  day String @db.VarChar(10)

  attempts    Int @default(0)
  correct     Int @default(0)
  hintsUsed   Int @default(0) @map("hints_used")
  micAttempts Int @default(0) @map("mic_attempts")
  /** Jumlah skor mic (0..100) — rata-rata = micScoreSum / micAttempts. Dipisah
   *  dari attempts/correct karena mic TIDAK ikut akurasi objektif (I9). */
  micScoreSum Int @default(0) @map("mic_score_sum")
  topicsDone  Int @default(0) @map("topics_done")
  xpGained    Int @default(0) @map("xp_gained")

  /** Histogram jam lokal: {"7":12,"19":40} — 24 slot, dihitung bareng rollup
   *  harian. Ini yang membuat "pola waktu main" gratis: rapor cukup men-SUM
   *  histogram dari ≤60 baris yang SUDAH diambil, tanpa query tambahan. */
  hourHistogram Json? @map("hour_histogram")

  firstEventAt DateTime? @map("first_event_at")
  lastEventAt  DateTime? @map("last_event_at")
  recomputedAt DateTime  @updatedAt @map("recomputed_at")

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, day])
  @@map("child_daily_stats")
}
```

### 4.6 `ChildSectionProgress` — urutan soal stabil + cursor

```prisma
/** Satu baris per (anak, skill, topik, SECTION). "Section" = unit yang punya
 *  urutan & navigasi sendiri — lebih halus dari 3 step app, karena Tantangan
 *  berisi beberapa sub-game yang masing-masing meng-iterasi item sendiri:
 *
 *    'kenalan'        — daftar kata (slot = index item)         [vocabulary]
 *    'latihan'        — 10 soal Latihan Inti (slot = 0..9)
 *    'tantangan-eja'  — Eja Kata (slot = index item)
 *    'tantangan-ucap' — Contoh Penggunaan, fase mic
 *    'tantangan-susun'— Contoh Penggunaan, fase Terjemahkan
 *
 *  String, bukan Prisma enum: daftar ini akan tumbuh saat pola Vocab dibawa ke
 *  listening/speaking/grammar/reading, dan `ALTER TYPE` Postgres tiap nambah
 *  section itu ribut tanpa manfaat. Preseden: `level` di ChildProfile juga String. */
model ChildSectionProgress {
  id      String @id @default(uuid())
  childId String @map("child_id")
  level   String
  skill   String
  topicId String @map("topic_id")
  section String

  /** Putaran ke-berapa. Naik saat anak menekan "🔁 Ulangi Modul Ini" SESUDAH
   *  section selesai — supaya anak tidak terjebak mengulang 10 soal yang persis
   *  sama selamanya, tapi juga tidak kehilangan status di tengah putaran.
   *  Dipakai sebagai guard anti write basi: upsert dengan round LEBIH KECIL
   *  ditolak (§7.6). */
  round Int @default(1)

  /** Rencana soal yang sudah dimaterialisasi — INI yang membuat urutan stabil.
   *  Bentuk: {"v":1,"slots":[{"kind":"audio","item":3},{"kind":"sentence","item":7}, ...]}
   *  NULL = urutan natural `topic.items` (kasus kenalan/eja/ucap/susun yang memang
   *  sudah tidak di-shuffle). Hanya 'latihan' yang butuh plan eksplisit karena
   *  `buildLatihanOrder()` sekarang mengacak 2 tipe soal × N kata tiap masuk.
   *  Sengaja JSON — lihat §10. */
  plan     Json? 
  /** Seed RNG yang dipakai client saat membangun plan — murni untuk reproduksi/
   *  debug, BUKAN sumber kebenaran urutan (plan-lah yang otoritatif, supaya
   *  perubahan algoritma pembangun soal nanti tidak mengubah urutan yang sudah
   *  dilihat anak). */
  planSeed Int?  @map("plan_seed")

  slotCount Int @map("slot_count")

  /** Posisi terakhir yang dilihat anak — untuk resume ⬅️/➡️. INI SATU-SATUNYA
   *  field di section yang last-write-wins (bukan monoton): anak boleh mundur,
   *  jadi "max" salah. Guard-nya `clientUpdatedAt` (§7.6). Tidak pernah dipakai
   *  untuk mengunci soal (I4) — cuma titik awal render. */
  cursorSlot Int @default(0) @map("cursor_slot")

  /** Dihitung ulang dari `child_item_progress` (≤10 baris) tiap ada write —
   *  supaya daftar mastery di rapor tidak perlu agregasi apa pun. */
  answeredSlots Int @default(0) @map("answered_slots")
  correctSlots  Int @default(0) @map("correct_slots")

  startedAt       DateTime  @default(now()) @map("started_at")
  completedAt     DateTime? @map("completed_at")
  clientUpdatedAt DateTime  @map("client_updated_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, skill, topicId, section])
  @@map("child_section_progress")
}
```

### 4.7 `ChildItemProgress` — status per slot (termasuk tap Kenalan)

```prisma
/** Satu baris per (anak, skill, topik, section, slot). Ini yang dibaca layar
 *  saat topik dibuka ulang untuk mewarnai "sudah dikerjakan" — baik penanda
 *  soal Latihan Inti/Tantangan MAUPUN tombol 🔊/🎤/🎮 per kata di Kenalan.
 *
 *  Interaksi kata Kenalan (`Store.wordInteractions`) SENGAJA dilebur ke sini,
 *  bukan tabel sendiri: kuncinya identik (anak+skill+topik+section+slot), pola
 *  aksesnya identik (upsert saat tap, baca semua baris saat layar dibuka), dan
 *  masa hidupnya identik. Tiga kolom timestamp menggantikan 3 tag string —
 *  jadi TIDAK ada sistem paralel yang tertinggal.
 *
 *  Jumlah baris terbatas: ~(kata/topik + 10) × section × topik per anak
 *  (orde 1.000–2.000 baris untuk anak yang sudah menuntaskan 1 level penuh). */
model ChildItemProgress {
  id      String @id @default(uuid())
  childId String @map("child_id")
  skill   String
  topicId String @map("topic_id")
  section String
  slot    Int
  round   Int    @default(1)
  level   String?

  /** Item konten yang diuji di slot ini. `itemRef` = kata/kalimat target
   *  (mis. "Mother") — DENORMALISASI SENGAJA (I6): rapor "kata apa yang masih
   *  susah" bisa langsung GROUP BY di sini tanpa tahu apa pun soal content.ts,
   *  dan tetap terbaca kalau urutan item di content.ts nanti bergeser. */
  itemIndex Int?    @map("item_index")
  itemRef   String? @map("item_ref")
  /** Tipe soal di slot ini: 'audio'|'sentence'|'eja'|'ucap'|'susun'|'counting'|'translate'. */
  kind      String?

  /** 0 = belum, 1 = dilihat/dibuka, 2 = sudah dijawab. INT, bukan string —
   *  supaya merge monoton cukup `GREATEST(existing, incoming)`; kalau string,
   *  'done' < 'seen' < 'todo' secara alfabet dan GREATEST jadi salah. */
  status Int @default(0)

  /** Pernah benar (union/OR — sekali benar tetap benar, non-punitive I4) vs
   *  hasil TERAKHIR (last-write-wins ber-guard `lastAnsweredAt`). Dua-duanya
   *  dipakai rapor: `everCorrect` untuk mastery, `lastCorrect` untuk "masih
   *  meleset di percobaan terbaru". */
  everCorrect Boolean  @default(false) @map("ever_correct")
  lastCorrect Boolean? @map("last_correct")

  /** Skor 0..100 (mic: rasio kata terdengar × 100, sesuai Aturan Wajib Speaking
   *  yang melarang nilai penuh untuk ucapan sepotong). GREATEST-merge. */
  bestScore Int? @map("best_score")

  attemptCount Int     @default(0) @map("attempt_count")
  wrongCount   Int     @default(0) @map("wrong_count")
  hintUsed     Boolean @default(false) @map("hint_used")

  /** Tap tombol di Kenalan — "pertama kali kena" (LEAST-merge, karena penanda
   *  visual "sudah dicoba" tidak pernah dibatalkan). */
  listenedAt DateTime? @map("listened_at")
  micAt      DateTime? @map("mic_at")
  gameAt     DateTime? @map("game_at")

  firstAnsweredAt DateTime? @map("first_answered_at")
  lastAnsweredAt  DateTime? @map("last_answered_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, skill, topicId, section, slot])
  /** Untuk "10 kata tersusah anak ini" — GROUP BY item_ref lintas section. */
  @@index([childId, itemRef])
  @@map("child_item_progress")
}
```

### 4.8 `LearningEvent` — log mentah tiap percobaan

```prisma
/** "Setiap mencoba pakai di save" (permintaan user #1) — satu baris per
 *  percobaan/kejadian. TABEL LEBAR & FLAT, tanpa join ke konten (I6).
 *
 *  `id` DIBUAT CLIENT (`crypto.randomUUID()`) dan jadi DEDUP KEY: insert selalu
 *  `ON CONFLICT (id) DO NOTHING`, sehingga outbox client boleh mengirim ulang
 *  batch yang sama berapa kali pun (I2). Tidak ada nomor urut yang wajib rapat —
 *  tabel ini boleh bolong tanpa merusak progres (§3).
 *
 *  `kind`: 'answer'  — soal berjawaban objektif (menaikkan akurasi)
 *          'speak'   — percobaan mic (graded=false, TIDAK menaikkan akurasi, I9)
 *          'interact'— tap 🎤/🎮 di Kenalan (tap 🔊 TIDAK dicatat sebagai event,
 *                      cukup `child_item_progress.listened_at` — menekan volume write)
 *          'topic_done' | 'boss_clear' | 'freeplay' — milestone pemberi XP,
 *                      dicatat di sini juga supaya XP harian bisa dihitung ulang
 *                      secara idempotent (SUM(xp_awarded) per hari). */
model LearningEvent {
  /** UUID dari client. @db.Uuid (16 byte) — bukan text 36 byte: ini satu-satunya
   *  tabel bervolume tinggi, jadi lebar PK-nya berpengaruh ke ukuran index. */
  id      String @id @db.Uuid
  childId String @map("child_id")
  kind    String

  /** Jam kejadian menurut CLIENT (bisa offline berjam-jam sebelum terkirim) vs
   *  jam server. Rapor selalu pakai occurredAt; receivedAt cuma untuk debug lag
   *  sync. `localDay`/`localHour` dikirim client karena hari & jam LOKAL tidak
   *  bisa direkonstruksi server tanpa timezone perangkat (I8). */
  occurredAt DateTime @map("occurred_at")
  localDay   String   @map("local_day") @db.VarChar(10)
  localHour  Int      @map("local_hour")
  receivedAt DateTime @default(now()) @map("received_at")

  level     String?
  skill     String?
  topicId   String? @map("topic_id")
  section   String?
  slot      Int?
  round     Int?
  itemIndex Int?    @map("item_index")
  itemRef   String? @map("item_ref")
  /** Sub-game/tipe soal: 'audio'|'sentence'|'eja'|'ucap'|'susun'|'counting'|'word-mini'|'boss'. */
  activity  String?

  /** graded=false untuk mic & interact — dipakai rollup supaya akurasi objektif
   *  tetap bersih (I9). */
  graded     Boolean  @default(true)
  correct    Boolean?
  /** 0..100. Untuk mic = rasio kata terdengar; untuk soal objektif = 0/100. */
  score      Int?
  hintUsed   Boolean  @default(false) @map("hint_used")
  /** Percobaan ke-berapa di slot yang sama (tombol "🔁 Coba Lagi"). */
  attemptNo  Int      @default(1) @map("attempt_no")
  durationMs Int?     @map("duration_ms")
  xpAwarded  Int      @default(0) @map("xp_awarded")

  /** Payload bebas per tipe kegiatan — lihat §10. */
  detail Json?

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  /** SENGAJA cuma 2 index sekunder (tiap index = biaya tiap insert):
   *  - (child_id, local_day, occurred_at): recompute rollup harian, feed
   *    aktivitas terbaru, pola jam. Prefix child_id juga melayani "semua event
   *    anak ini" tanpa index terpisah.
   *  - (child_id, kind, occurred_at): riwayat mic ("kind='speak' 30 terakhir").
   *  TIDAK dibuat: index per topic_id/item_ref — drill-down per kata dilayani
   *  `child_item_progress` yang jauh lebih kecil. */
  @@index([childId, localDay, occurredAt])
  @@index([childId, kind, occurredAt])
  @@map("learning_events")
}
```

### 4.9 Yang dihapus

```prisma
// model ChildProgress { childId @unique; data Json; updatedAt }  — DIHAPUS.
// Isinya hanya data dev/test (dikonfirmasi), jadi ini penggantian skema BERSIH
// tanpa backfill. Lihat §11 untuk urutan drop yang aman.
```

---

## 5. State Baru di Client (`Store`) — Wajib Ada Duluan

Konsekuensi langsung dari I1: **urutan soal stabil harus jalan tanpa login/offline**,
jadi ia hidup di localStorage dulu, DB menyusul. Tambahan field di `Store`
(`app/src/progress.ts`) — aditif, `read()` sudah toleran field hilang, jadi
**tidak perlu bump `KEY` v1→v2**:

```ts
type SectionKey = string; // `${skill}:${topicId}:${section}`

interface SectionState {
  round: number;                                  // naik saat "Ulangi" sesudah selesai
  seed: number;
  plan?: { kind: 'audio' | 'sentence'; item: number }[]; // hanya 'latihan'
  cursor: number;                                  // posisi ⬅️/➡️, preferensi perangkat
  slots: Record<number, {
    st: 0 | 1 | 2;                                 // todo | seen | done
    ok?: 1;                                        // pernah benar
    lc?: 0 | 1;                                    // hasil terakhir
    n?: number;                                    // jumlah percobaan
    w?: number;                                    // jumlah belum tepat
    h?: 1;                                         // hint dipakai
    sc?: number;                                   // skor terbaik 0..100
    a?: ('l' | 'm' | 'g')[];                       // tap Kenalan: listen/mic/game
    t?: number;                                    // epoch ms jawaban terakhir
  }>;
}

interface Store {
  /* ...field lama tetap... */
  sections: Record<SectionKey, SectionState>;
  /** LEGACY — dibaca (supaya warna tombol di perangkat lama tidak hilang) dan
   *  dimigrasi sekali ke `sections[...].slots[i].a`, TAPI tidak lagi ditulis.
   *  Dipertahankan minimal 1 rilis karena bundle statis bisa masih ter-cache. */
  wordInteractions: string[];
}
```

Aturan merge di `mergeFromServer` (mengikuti gaya union/max yang sudah ada):

| Field | Aturan |
|---|---|
| `sections[k].round` | `max(local, remote)` |
| `sections[k].plan` | ikut pemilik `round` yang lebih besar; kalau seri, **local menang** (anak sedang melihat urutan itu) |
| `sections[k].slots[i]` | per-slot: `st`/`n`/`w`/`sc` → `max`; `ok`/`h` → OR; `a` → union; `lc` ikut `t` terbesar |
| `sections[k].cursor` | **local selalu menang** (posisi UI = preferensi perangkat, sama seperti `last`/`name`/`avatar` yang sudah begitu) |

Round yang lebih kecil dari remote **tidak** menghapus slot lokal yang lebih maju;
mismatch round diselesaikan dengan mengambil round tertinggi lalu mereset slot
milik round lama (aturan yang sama di server, §7.6).

---

## 6. Urutan Soal Stabil — Mekanismenya

Masalah hari ini: `buildLatihanOrder(topic)` (`games/vocabulary.ts:387`) memanggil
`shuffle()` tiap `runLatihanInti()` dijalankan ⇒ "soal ke-3" tidak punya identitas,
jadi tidak ada tempat menempelkan penanda "sudah dikerjakan".

Aturan baru:

1. Saat section dibuka, client cari `store.sections['vocabulary:pekerjaan:latihan']`.
2. **Tidak ada** ⇒ generate seed acak, bangun order sekali, **materialisasi jadi
   `plan`** (`[{kind,item}, …]` panjang 10), simpan. Ini yang jadi urutan permanen
   untuk putaran ini.
3. **Ada** ⇒ pakai `plan` apa adanya. Soal ke-N selalu soal yang sama ⇒ penanda
   per soal (`slots[N].st === 2`) bermakna, dan ⬅️/➡️ bisa melompat bebas ke slot
   mana pun tanpa mengacak apa pun.
4. Distractor (opsi salah) **tetap boleh diacak setiap render** — yang harus stabil
   adalah identitas soal (kind + item target), bukan posisi tombol. Menyimpan
   distractor juga akan menggandakan ukuran plan tanpa manfaat.
5. Section selesai (semua slot `st===2`) → tombol "🔁 Ulangi": `round += 1`,
   `plan` dibangun ulang dengan seed baru, slot direset. Riwayat putaran lama
   tidak hilang — ia ada di `learning_events` (§3).
6. Section yang memang sudah urut natural (`kenalan`, `tantangan-eja`,
   `tantangan-ucap`, `tantangan-susun` — semuanya meng-iterasi `topic.items`
   tanpa shuffle) menyimpan `plan = null`; slot = index item. Tidak ada data baru
   yang perlu diarang.

**Kenapa plan dimaterialisasi, bukan cuma seed?** Seed + algoritma = urutan hanya
kalau algoritmanya tidak pernah berubah. `buildLatihanPool`/`LATIHAN_ROUND_SIZE`
jelas masih akan disentuh (target 10 soal/sub-modul di CLAUDE.md). Plan eksplisit
membuat anak yang sedang di tengah putaran tidak tiba-tiba melihat 10 soal berbeda
setelah deploy. `planSeed` tetap disimpan untuk debug.

---

## 7. Write Path — Per Event, Persis Baris Apa yang Tersentuh

### 7.0 Bentuk transport

- Client tetap men-debounce 1.5 s (`wireProgressSync`) dan mengirim **satu**
  request per burst: `PUT /api/progress` body `{ data: Store, events: LearningEventInput[] }`.
- 1 request = 1 transaksi Postgres. **Tidak ada** HTTP per tap. Anak yang menembak
  10 soal cepat menghasilkan **1** transaksi, bukan 10.
- Server membatasi `events` ≤ 200/request (sisanya ditolak dengan 200 + `accepted`
  count supaya client bisa mengirim sisa batch berikutnya) — proteksi murah untuk
  VPS kecil.
- Client menyimpan event di **outbox localStorage** (cap ~500, buang tertua saat
  penuh) dan menghapusnya hanya setelah 2xx. Kehilangan event = kehilangan detail
  analitik, bukan progres (§3).

### 7.1 Tap tombol kata di Kenalan (🔊 / 🎤 / 🎮)

| Yang tersentuh | Operasi | Index yang dipakai | Idempotent? |
|---|---|---|---|
| `child_item_progress` (section='kenalan', slot=itemIndex) | 1 upsert, set `listened_at/mic_at/game_at = LEAST(existing, incoming)`, `status = GREATEST(status, 1)` | `child_item_progress_child_id_skill_topic_id_section_slot_key` | ✅ first-write-wins pada timestamp, union pada status |
| `learning_events` | 1 insert `kind='interact'` **hanya untuk 🎤/🎮** (🔊 tidak) | PK dedup | ✅ `ON CONFLICT (id) DO NOTHING` |
| `child_section_progress` | 1 upsert (`cursor_slot`, `client_updated_at`) | unique (child,skill,topic,section) | ✅ ber-guard `client_updated_at` |

Hasil mic-nya sendiri (bintang/skor) datang sebagai event `kind='speak'` terpisah
(§7.3), bukan bagian dari tap.

### 7.2 Menjawab satu soal Latihan Inti / Tantangan (objektif)

```sql
-- (a) log mentah: batch, dedup by client uuid
INSERT INTO learning_events (id, child_id, kind, occurred_at, local_day, local_hour, level,
                             skill, topic_id, section, slot, round, item_index, item_ref,
                             activity, graded, correct, score, hint_used, attempt_no, xp_awarded, detail)
SELECT * FROM UNNEST(...)            -- Prisma: createMany({ skipDuplicates: true })
ON CONFLICT (id) DO NOTHING;

-- (b) status sticky per slot: merge MONOTON, tolak write dari round basi
INSERT INTO child_item_progress AS cip (id, child_id, skill, topic_id, section, slot, round,
       level, item_index, item_ref, kind, status, ever_correct, last_correct, best_score,
       attempt_count, wrong_count, hint_used, first_answered_at, last_answered_at)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, ...)
ON CONFLICT (child_id, skill, topic_id, section, slot) DO UPDATE SET
  round        = GREATEST(cip.round, EXCLUDED.round),
  -- round baru = putaran baru ⇒ RESET; round sama ⇒ merge monoton
  status       = CASE WHEN EXCLUDED.round > cip.round THEN EXCLUDED.status
                      ELSE GREATEST(cip.status, EXCLUDED.status) END,
  ever_correct = CASE WHEN EXCLUDED.round > cip.round THEN EXCLUDED.ever_correct
                      ELSE cip.ever_correct OR EXCLUDED.ever_correct END,
  attempt_count= CASE WHEN EXCLUDED.round > cip.round THEN EXCLUDED.attempt_count
                      ELSE GREATEST(cip.attempt_count, EXCLUDED.attempt_count) END,
  wrong_count  = CASE WHEN EXCLUDED.round > cip.round THEN EXCLUDED.wrong_count
                      ELSE GREATEST(cip.wrong_count, EXCLUDED.wrong_count) END,
  hint_used    = CASE WHEN EXCLUDED.round > cip.round THEN EXCLUDED.hint_used
                      ELSE cip.hint_used OR EXCLUDED.hint_used END,
  best_score   = GREATEST(cip.best_score, EXCLUDED.best_score),   -- GREATEST mengabaikan NULL
  last_correct = CASE WHEN EXCLUDED.last_answered_at >= COALESCE(cip.last_answered_at, 'epoch')
                      THEN EXCLUDED.last_correct ELSE cip.last_correct END,
  first_answered_at = LEAST(cip.first_answered_at, EXCLUDED.first_answered_at),
  last_answered_at  = GREATEST(cip.last_answered_at, EXCLUDED.last_answered_at),
  item_ref = COALESCE(EXCLUDED.item_ref, cip.item_ref),
  kind     = COALESCE(EXCLUDED.kind, cip.kind)
WHERE EXCLUDED.round >= cip.round;   -- write dari putaran basi dibuang total

-- (c) rollup section: ≤10 baris, dibaca lewat prefix unique index
UPDATE child_section_progress csp
   SET answered_slots = s.answered, correct_slots = s.correct,
       completed_at   = CASE WHEN s.answered >= csp.slot_count
                             THEN COALESCE(csp.completed_at, now()) ELSE csp.completed_at END
  FROM (SELECT count(*) FILTER (WHERE status = 2)  AS answered,
               count(*) FILTER (WHERE ever_correct) AS correct
          FROM child_item_progress
         WHERE child_id=$1 AND skill=$2 AND topic_id=$3 AND section=$4) s
 WHERE csp.child_id=$1 AND csp.skill=$2 AND csp.topic_id=$3 AND csp.section=$4;
```

Plus, **sekali per request** (bukan per soal):

```sql
-- (d) counter global: monoton, tidak pernah turun walau snapshot datang terbalik
INSERT INTO child_progress_state AS s (id, child_id, xp, correct_attempts, total_attempts,
        nickname, avatar, last_skill, last_topic_id, last_topic_index, last_step, last_level,
        last_active_day, client_updated_at)
VALUES (gen_random_uuid(), $1, ...)
ON CONFLICT (child_id) DO UPDATE SET
  xp               = GREATEST(s.xp, EXCLUDED.xp),
  total_attempts   = GREATEST(s.total_attempts, EXCLUDED.total_attempts),
  -- correct/total adalah PASANGAN (correct <= total): ambil pasangan dari snapshot
  -- dengan total terbesar, sama seperti mergeFromServer di client
  correct_attempts = CASE WHEN EXCLUDED.total_attempts >= s.total_attempts
                          THEN EXCLUDED.correct_attempts ELSE s.correct_attempts END,
  nickname         = COALESCE(EXCLUDED.nickname, s.nickname),
  avatar           = COALESCE(EXCLUDED.avatar, s.avatar),
  last_skill       = CASE WHEN EXCLUDED.client_updated_at >= COALESCE(s.client_updated_at,'epoch')
                          THEN EXCLUDED.last_skill ELSE s.last_skill END,
  /* last_topic_id / last_topic_index / last_step / last_level: guard yang sama */
  last_active_day  = GREATEST(s.last_active_day, EXCLUDED.last_active_day),
  client_updated_at= GREATEST(s.client_updated_at, EXCLUDED.client_updated_at);

-- (e) rollup harian: DIHITUNG ULANG, bukan di-increment, hanya untuk hari yang
--     ada di batch ini (biasanya 1 hari)
WITH ev AS (
  SELECT * FROM learning_events WHERE child_id = $1 AND local_day = $2
), agg AS (
  SELECT count(*) FILTER (WHERE kind='answer')                       AS attempts,
         count(*) FILTER (WHERE kind='answer' AND correct)           AS correct,
         count(*) FILTER (WHERE hint_used)                           AS hints_used,
         count(*) FILTER (WHERE kind='speak')                        AS mic_attempts,
         COALESCE(sum(score) FILTER (WHERE kind='speak'), 0)         AS mic_score_sum,
         count(*) FILTER (WHERE kind='topic_done')                   AS topics_done,
         COALESCE(sum(xp_awarded), 0)                                AS xp_gained,
         min(occurred_at) AS first_at, max(occurred_at) AS last_at
    FROM ev
), hist AS (
  SELECT COALESCE(jsonb_object_agg(local_hour, n), '{}'::jsonb) AS hour_histogram
    FROM (SELECT local_hour, count(*) AS n FROM ev GROUP BY local_hour) x
)
INSERT INTO child_daily_stats (id, child_id, day, attempts, correct, hints_used, mic_attempts,
        mic_score_sum, topics_done, xp_gained, hour_histogram, first_event_at, last_event_at)
SELECT gen_random_uuid(), $1, $2, agg.*, hist.hour_histogram FROM agg, hist
ON CONFLICT (child_id, day) DO UPDATE SET
  attempts = EXCLUDED.attempts, correct = EXCLUDED.correct, hints_used = EXCLUDED.hints_used,
  mic_attempts = EXCLUDED.mic_attempts, mic_score_sum = EXCLUDED.mic_score_sum,
  topics_done = EXCLUDED.topics_done, xp_gained = EXCLUDED.xp_gained,
  hour_histogram = EXCLUDED.hour_histogram,
  first_event_at = LEAST(child_daily_stats.first_event_at, EXCLUDED.first_event_at),
  last_event_at  = GREATEST(child_daily_stats.last_event_at, EXCLUDED.last_event_at);
```

**Biaya total per request** (misal 10 soal dalam 1 burst): 1 batch insert +
≤10 upsert 1-baris + ≤5 update rollup section + 1 upsert state + 1 recompute
harian (scan ratusan baris lewat index `(child_id, local_day, occurred_at)`).
Semuanya index-hit, dalam satu transaksi. Aman untuk 2 vCPU.

> **Kenapa recompute, bukan `attempts = attempts + 1`?** Increment tidak idempotent:
> satu batch yang terkirim dua kali (retry saat jaringan jelek) akan menggandakan
> angka rapor secara permanen dan tidak bisa dideteksi. Recompute dari log yang
> sudah ter-dedup selalu konvergen ke angka yang benar, berapa kali pun batch
> dikirim ulang atau datang terbalik. Ini poin desain terpenting untuk I2.

### 7.3 Percobaan mic (Speaking / Contoh Penggunaan / mic Kenalan)

- `learning_events`: 1 insert, `kind='speak'`, `graded=false`,
  `score = round(hitRatio*100)` (rasio kata terdengar — Aturan Wajib Speaking),
  `detail = {"heard": "...", "words":[{"word":"the","matched":true}, …], "stars":2}`.
- `child_item_progress`: upsert `best_score = GREATEST(...)`, `mic_at`, `status`.
- `child_progress_state`: **tidak** menaikkan `correct_attempts`/`total_attempts` (I9).
- `child_daily_stats`: masuk `mic_attempts` / `mic_score_sum`, **tidak** ke
  `attempts`/`correct`.
- **Audio mentah tidak pernah diunggah** — hanya transkrip & rasio (§12 privasi).

### 7.4 Topik ditandai selesai (`markDone` + `addXp(15)`)

- `topic_completions`: `INSERT … ON CONFLICT (child_id, skill, topic_id) DO UPDATE
  SET last_done_at = GREATEST(…), level = COALESCE(EXCLUDED.level, …)`. 1 baris.
- `learning_events`: 1 event `kind='topic_done'`, `xp_awarded=15`.
- `child_progress_state.xp`: `GREATEST`.
- `child_daily_stats`: ikut recompute (§7.2e).

### 7.5 XP, Bos ditaklukkan, hari aktif

| Kejadian | Baris | Idempotensi |
|---|---|---|
| XP naik (modul 15 / bos 50 / free play 3) | `child_progress_state.xp = GREATEST(...)` + event ber-`xp_awarded` | Snapshot monoton + event ter-dedup |
| Bos ditaklukkan / `unlockLevelsUpTo()` sesudah placement test | 1 upsert per level di `boss_clearances` (`DO NOTHING`) | Alami idempotent (set) |
| Hari aktif | Baris `child_daily_stats` (child_id, day) — `INSERT … DO NOTHING` untuk `activeDays` dari snapshot; counter-nya diisi recompute event | Presence, bukan counter ⇒ idempotent |

Catatan: `INSERT … DO NOTHING` untuk hari aktif **tidak boleh** menyentuh counter,
supaya sync snapshot-only (Fase 1) tidak menge-nol-kan rollup yang sudah benar.

### 7.6 Ringkasan aturan anti write-basi & write-bentrok

| Jenis field | Aturan | Contoh |
|---|---|---|
| Monoton naik | `GREATEST` | `xp`, `status`, `attempt_count`, `best_score`, `round` |
| Set/boolean sticky | `OR` / `DO NOTHING` | `ever_correct`, `hint_used`, `boss_clearances`, `topic_completions` |
| "Pertama kali" | `LEAST` | `first_done_at`, `listened_at`, `first_answered_at` |
| Pasangan terkait | ikut sumber dengan `total` terbesar | `correct_attempts`/`total_attempts` |
| Posisi UI (boleh mundur) | LWW ber-guard `client_updated_at` | `cursor_slot`, `last_*` |
| Putaran | `WHERE EXCLUDED.round >= existing.round` (write round lama dibuang) | slot `latihan` setelah "Ulangi" |
| Derived | recompute dari log | `child_daily_stats.*`, `answered_slots`, `correct_slots` |

Dua perangkat online bersamaan tidak pernah saling menghapus progres: satu-satunya
field yang benar-benar bisa "kalah" adalah posisi kursor/`last` — dan itu memang
preferensi perangkat, konsisten dengan aturan `mergeFromServer` yang sudah ada.

**Edge case yang harus dijaga di implementasi**: perangkat yang lama offline bisa
mengirim event ber-`local_day` yang sudah **di luar window retensi** (§12). Recompute
rollup untuk hari seperti itu akan menulis ulang baris historis dari log yang sudah
sebagian dipangkas ⇒ angka rapor lama jadi salah. Aturan: event tetap diterima
(masuk log), tapi recompute **hanya dijalankan untuk `local_day` di dalam window
retensi**; di luar itu rollup lama dibiarkan apa adanya.

---

## 8. Read Path — "Rapor Anak"

Satu endpoint `GET /api/report` (auth sama dengan `/api/me`), 7 query yang semuanya
dibatasi jumlah baris dan dilayani index dengan prefix `child_id`. Bisa dikirim
sekali jalan lewat `db.$transaction([...])`, plus `Cache-Control: private, max-age=60`
(rapor tidak perlu real-time).

| # | Kebutuhan rapor | Query | Index | Baris |
|---|---|---|---|---|
| Q1 | Header: XP, ketepatan total, nama/avatar, terakhir main | `SELECT * FROM child_progress_state WHERE child_id=$1` | `child_progress_state_child_id_key` (unique) | 1 |
| Q2 | Tren ketepatan/XP harian, strip 7 hari, streak, **pola jam** | `SELECT day, attempts, correct, mic_attempts, mic_score_sum, xp_gained, hour_histogram, first_event_at, last_event_at FROM child_daily_stats WHERE child_id=$1 AND day >= $2 ORDER BY day` | `child_daily_stats_child_id_day_key` (unique, range scan) | ≤ 60 |
| Q3 | Mastery per skill/topik/section + "sedang dikerjakan" | `SELECT skill, topic_id, level, section, slot_count, answered_slots, correct_slots, completed_at, updated_at FROM child_section_progress WHERE child_id=$1` | `child_section_progress_child_id_..._key` (prefix `child_id`) | ≤ ~250 |
| Q4 | **Kata/materi yang masih susah** | `SELECT item_ref, sum(attempt_count) att, sum(wrong_count) wrong, bool_or(ever_correct) ok FROM child_item_progress WHERE child_id=$1 AND wrong_count > 0 GROUP BY item_ref ORDER BY wrong DESC, att DESC LIMIT 10` | `child_item_progress_child_id_item_ref_idx` | ratusan → agregasi in-memory Postgres, sub-ms |
| Q5 | Riwayat percobaan mic (skor + apa yang terdengar) | `SELECT occurred_at, item_ref, score, detail FROM learning_events WHERE child_id=$1 AND kind='speak' ORDER BY occurred_at DESC LIMIT 30` | `learning_events_child_id_kind_occurred_at_idx` | 30 |
| Q6 | Bintang: topik apa saja yang tuntas | `SELECT skill, topic_id, level, first_done_at FROM topic_completions WHERE child_id=$1` | unique prefix `child_id` | ≤ ~50 |
| Q7 | Posisi di tangga level + hasil placement | `SELECT level FROM boss_clearances WHERE child_id=$1` + `child_profiles.level` + `placement_test_results` terbaru | unique prefix / relasi | ≤ 8 |

Yang **tidak** dilakukan saat render rapor: tidak ada `SELECT` tanpa `LIMIT` ke
`learning_events`, tidak ada `GROUP BY` lintas puluhan ribu baris, tidak ada
deserialisasi JSON blob di application code. Pola jam main — yang biasanya paling
mahal — sudah pra-agregasi di `hour_histogram` (Q2), jadi harganya nol query tambahan.

Drill-down opsional (kalau nanti ada halaman "detail satu topik"):
`SELECT … FROM learning_events WHERE child_id=$1 AND local_day BETWEEN … ORDER BY occurred_at`
lalu difilter `topic_id` di aplikasi — tetap ber-index, dan ini view yang jarang dibuka.

### 8.1 `GET /api/progress` — merangkai ulang bentuk `Store`

Supaya `mergeFromServer` di client **tidak perlu diubah** (I3), endpoint lama tetap
mengembalikan objek berbentuk `Store`, dirakit dari tabel:

| Field `Store` | Sumber |
|---|---|
| `done[]` | `topic_completions` → `` `${skill}:${topicId}` `` |
| `bossCleared[]` | `boss_clearances.level` |
| `xp`, `correctAttempts`, `totalAttempts`, `name`, `avatar`, `last` | `child_progress_state` |
| `activeDays[]` | `child_daily_stats.day`, 60 terakhir |
| `wordInteractions[]` | `child_item_progress` (section='kenalan', kolom timestamp ≠ NULL) → tag legacy |
| `sections{}` | `child_section_progress` + `child_item_progress` |

5 query, semuanya `child_id`-scoped, dijalankan hanya saat boot/login.

---

## 9. Peta Lengkap: Tidak Ada Field Lama yang Hilang

| `Store` sekarang | Rumah baru | Turunan/derived tetap jalan |
|---|---|---|
| `done: string[]` | `topic_completions` | `doneCount`, `doneCountFor`, `isDone` |
| `last` | `child_progress_state.last_*` (+ `last_topic_id` baru) | kartu "Lanjutkan" di Beranda |
| `bossCleared: string[]` | `boss_clearances` | `levelUnlockMap`, `unlockLevelsUpTo`, `poolFor` di `games/boss.ts` |
| `xp: number` | `child_progress_state.xp` | XP header (monoton, I7) |
| `activeDays: string[]` | ada-baris di `child_daily_stats` | `getWeekActivity`, `getStreak` (1 hari pelindung) **tanpa perubahan logic** |
| `correctAttempts` / `totalAttempts` | `child_progress_state` (+ `child_daily_stats` untuk tren) | `getAccuracy` |
| `name` | `child_progress_state.nickname` (≠ `child_profiles.name`) | sapaan "Hi {nama}" |
| `avatar` | `child_progress_state.avatar` | avatar header/Pengaturan |
| `wordInteractions: string[]` | `child_item_progress.listened_at/mic_at/game_at` | `hasWordInteraction` (warna tombol Kenalan) |
| — (baru) | `child_section_progress` + `child_item_progress` | penanda per soal + navigasi ⬅️/➡️ |
| — (baru) | `learning_events` | analitik & riwayat mic |
| `PlacementTestResult` | tidak diubah | jumlah baris tetap jadi penghitung "max 2 kali" |

Streak, akurasi, dan progres mingguan **tetap derived** dari data yang ada — tidak
ada field kebenaran baru untuk itu, sesuai pola yang sudah dipilih di `progress.ts`
(dan RESEARCH §13.1). Baris `child_daily_stats` yang 60 terakhir menggantikan array
`activeDays` yang juga sudah dipotong 60 di client — semantiknya identik.

---

## 10. Yang Sengaja Dibiarkan JSON (dan Alasannya)

Tiga tempat, semuanya **tidak pernah difilter/di-GROUP BY**:

1. **`LearningEvent.detail`** — payload per tipe kegiatan yang bentuknya beda-beda:
   speaking (`heard`, array word-match, stars), Eja Kata (huruf yang tersusun),
   Terjemahkan (kalimat yang dibangun), pilihan ganda (opsi yang dipilih).
   Menormalkan ini butuh 5+ tabel anak atau 20 kolom nullable, padahal isinya cuma
   dibuka saat drill-down satu baris. Semua yang dipakai untuk **query** sudah jadi
   kolom nyata (`correct`, `score`, `hint_used`, `item_ref`, `activity`).
   Preseden di repo: `PlacementTestResult.speakingSignals` & `correctByLevel`.
2. **`ChildSectionProgress.plan`** — daftar ≤10 `{kind, item}`. Kecil, replay-only,
   dibaca utuh atau tidak dibaca sama sekali. Menormalkan jadi tabel "slot plan"
   akan menduplikasi kunci `child_item_progress` tanpa satu pun query baru yang
   terbantu.
3. **`ChildDailyStat.hourHistogram`** — 24 slot counter. Alternatifnya tabel
   `child_hourly_stats` (24× baris dari harian) hanya untuk satu chart di rapor —
   mahal di write, tidak ada gunanya di query lain.

**Yang TIDAK lagi JSON**: seluruh isi `ChildProgress.data` (done/bossCleared/xp/
activeDays/attempts/last/name/avatar/wordInteractions) — semuanya jadi kolom/baris
nyata. Ini bedanya dengan blob sekarang: JSON yang tersisa adalah *lampiran detail*,
bukan *state yang perlu di-query*.

---

## 11. Rencana Migrasi

### 11.1 Kenapa blob lama tidak cukup

`ChildProgress.data` adalah **snapshot**, bukan riwayat: tidak ada jejak percobaan
per soal, tidak ada dimensi waktu selain `updatedAt`, dan setiap pertanyaan rapor
("ketepatan bulan ini vs bulan lalu", "kata apa yang paling sering meleset")
memerlukan deserialisasi blob tiap anak di application code. Menambal blob dengan
GIN index / generated column pun tidak menolong: yang kurang bukan cara mengindeks,
tapi **datanya memang tidak pernah direkam**.

### 11.2 Data lama: penggantian bersih, dinyatakan eksplisit

Tabel `child_progress` **hanya berisi data dev/test** (dikonfirmasi di brief), jadi:
**tidak ada backfill, tidak ada script konversi blob → tabel**. Ini keputusan sadar,
bukan asumsi diam-diam. Progres nyata anak tetap utuh karena sumber kebenarannya
localStorage (I1) — begitu client login lagi, snapshot lokal-nya mengisi ulang
tabel baru dengan sendirinya lewat write path §7.

### 11.3 Fase (masing-masing bisa dirilis & di-rollback sendiri)

| Fase | Isi | Perubahan client? | Risiko |
|---|---|---|---|
| **0** | `prisma migrate dev --name progress_structured` — buat 7 tabel baru. `child_progress` **dibiarkan ada** (tidak dipakai) satu rilis. | tidak | ~0 (aditif) |
| **1** | `PUT /api/progress` memproyeksikan snapshot `Store` → tabel baru; `GET` merangkai `Store` dari tabel baru (§8.1). Kontrak API **byte-compatible**. Helper raw upsert di `portal/lib/progress-write.ts` (Prisma `upsert` tidak bisa mengekspresikan `GREATEST`/`WHERE` pada `DO UPDATE`, jadi pakai `$executeRaw` di dalam `$transaction`). | tidak | rendah — verifikasi dengan membandingkan `Store` hasil rakitan vs yang dikirim client |
| **2** | Client: tambah `Store.sections`, urutan Latihan Inti stabil (§6), penanda per soal, navigasi ⬅️/➡️ di Latihan Inti & sub-game Tantangan, migrasi `wordInteractions` → `sections`. **Semua jalan offline tanpa login.** | ya | sedang (UI) — tapi tidak menyentuh DB |
| **3** | Client: outbox event + `events[]` di payload PUT; server insert `learning_events` + recompute rollup. | ya | rendah (aditif; kegagalan = analitik kosong, bukan progres hilang) |
| **4** | `GET /api/report` + tampilan rapor (§8). | ya (layar baru) | rendah (read-only) |
| **5** | Migrasi kedua: `DROP TABLE child_progress`. Job retensi (§12). | tidak | rendah |

Urutan ini penting: **Fase 2 mendahului Fase 3** karena urutan soal stabil adalah
kebutuhan offline (I1) — kalau ia dibuat server-first, anak tanpa akun tidak akan
pernah punya penanda soal, dan itu melanggar "main tanpa akun harus tetap penuh".

### 11.4 Tes yang wajib ada di implementasi

1. **Replay** — kirim batch yang sama 3×: semua tabel identik setelah write ke-1.
2. **Out-of-order** — kirim batch dalam urutan terbalik: state akhir sama.
3. **Bolong** — buang 30% event lalu sync snapshot: bintang/XP/status slot tetap
   benar (self-healing), hanya angka rollup harian yang lebih rendah.
4. **Round rotate** — write dari round lama sesudah "Ulangi": ditolak, slot round
   baru tidak ternodai.
5. **Dua perangkat** — sync bergantian: tidak ada progres yang hilang; hanya
   `cursor_slot`/`last` yang mengikuti write terakhir.
6. **Offline penuh** — matikan network, mainkan 1 topik penuh: urutan soal stabil,
   penanda bertahan, tidak ada error yang tampil ke anak.

---

## 12. Kapasitas, Retensi & Privasi di VPS 2 vCPU / 4 GB

**Estimasi ukuran `learning_events`** (satu-satunya tabel yang tumbuh): ~150 B/baris
+ 2 index ⇒ ~300 B all-in. Anak aktif ~200 event/hari ⇒ ~1,8 MB/bulan/anak.

| Skala | Volume/bulan | Retensi 90 hari |
|---|---|---|
| 10 anak (realitas sekarang) | 18 MB | ~55 MB |
| 100 anak | 180 MB | ~540 MB |
| 500 anak | 900 MB | ~2,7 GB |

Aturan:

- **Retensi event mentah 90 hari** (`DELETE FROM learning_events WHERE received_at < now() - interval '90 days'`,
  cron/systemd timer bulanan, batched `LIMIT` supaya tidak lock lama). Riwayat
  jangka panjang tetap hidup di `child_daily_stats` (≈365 baris/anak/tahun — kecil
  selamanya) dan di tabel state.
- Tabel state & rollup **tidak pernah dipangkas**.
- Kalau volume benar-benar naik: partisi native per bulan pada `learning_events`
  (`PARTITION BY RANGE (occurred_at)`) dan UUIDv7 untuk `id` (lokalitas insert lebih
  baik dari UUIDv4). Keduanya **belum perlu sekarang** — dicatat sebagai headroom,
  bukan pekerjaan hari ini.
- Job repair: `recompute_daily(child_id, day)` bisa dijalankan ulang kapan saja
  (idempotent) untuk N hari terakhir kalau ada kecurigaan angka rollup meleset.
- Tanpa dependency baru: tidak ada Redis, tidak ada queue, tidak ada warehouse.
  Semua di Postgres yang sudah ada, plus satu cron `psql`.

**Privasi anak** (produk untuk usia 5–13, PRD ramah anak):

- **Audio mentah tidak pernah dikirim/disimpan** — `MediaRecorder` tetap murni lokal
  untuk tombol "▶️ Play Suaramu". Yang tersimpan cuma transkrip pendek + rasio kata.
- Kalau user ingin lebih ketat, `detail.heard` (transkrip) bisa dimatikan dan hanya
  `score` + array matched/miss yang disimpan — skema tidak berubah, cuma isian
  `detail`-nya. Dicatat sebagai pilihan, bukan keputusan.
- `nickname` tetap opsional dan tidak pernah wajib; tidak ada field free-text lain
  dari anak.

---

## 13. Alternatif yang Ditolak

| Alternatif | Alasan ditolak |
|---|---|
| **A. Tetap satu blob JSON + GIN index / generated column** | Yang kurang bukan indexing, tapi datanya tidak pernah direkam (§11.1). Tren per hari & "kata tersusah" butuh riwayat, bukan snapshot yang lebih mudah dicari. |
| **B. Normalisasi konten ke DB** (tabel Level/Skill/Topic/Item + FK dari attempt) | Konten hidup di bundle client dan harus jalan tanpa DB (I1/I6). Menyalinnya ke Postgres = dua sumber kebenaran + migrasi tiap edit konten. Ganti: `skill`/`topic_id`/`item_index`/`item_ref` sebagai string denormalisasi. Konsekuensi yang diterima: tidak ada integritas FK; syaratnya `topic.id` diperlakukan append-only/tidak di-rename. |
| **C. Event-sourcing murni** (semua state direkonstruksi dari replay event) | Kebenaran akan bergantung pada tidak ada event yang hilang — mustahil dijanjikan client offline/best-effort (I2), dan replay bikin read mahal. Ganti: state dari snapshot (self-healing), event sebagai lapisan analitik aditif. |
| **D. Attempt log tanpa rollup, agregasi saat baca** | Rapor akan men-scan puluhan ribu baris tiap dibuka di box 2 vCPU. `child_daily_stats` menurunkannya ke ≤60 baris. |
| **E. Increment counter (`attempts = attempts + 1`)** | Tidak idempotent: satu retry menggandakan angka rapor secara permanen. Ganti: recompute dari log ter-dedup. |
| **F. Tabel terpisah untuk `wordInteractions`** | Kunci, pola akses, dan masa hidupnya identik dengan status slot ⇒ jadi sistem paralel tanpa manfaat. Dilebur ke `child_item_progress` (section='kenalan'). |
| **G. Tabel terpisah untuk `activeDays`** | Baris `child_daily_stats` **adalah** penanda hari aktif. Dua tabel untuk fakta yang sama = dua tempat bisa tidak sinkron. |
| **H. `round` masuk unique key slot (riwayat semua putaran)** | Tumbuh tanpa batas untuk anak yang suka mengulang. Riwayat sudah ada di event log; slot menyimpan putaran berjalan saja. |
| **I. Prisma enum untuk skill/section/level** | `ALTER TYPE` tiap nambah section/level saat pola Vocab dibawa ke skill lain. Preseden repo: `level` sudah `String`. |
| **J. Server yang menentukan "hari"** | Streak/strip 7 hari didefinisikan pada kalender **lokal perangkat** (I8); konversi di server akan menggeser hari untuk anak yang main malam/ganti timezone. Ganti: client mengirim `local_day`/`local_hour`. |
| **K. Hanya menyimpan seed urutan soal, bukan plan** | Perubahan algoritma pembangun soal (yang pasti terjadi, lihat target 10 soal/sub-modul) akan mengubah 10 soal di tengah putaran anak. Plan eksplisit imun terhadap itu (§6). |
| **L. Server-authoritative scoring** | ASR anak tidak reliabel (PRD §13.1) dan app harus bisa jalan offline penuh. Skor tetap dihitung client; server merekam, tidak menghakimi. |

---

## 14. Non-Goals

- Tidak ada login/akun untuk **anak** (PRD §14.5) — semua tabel di sini digantung
  ke `ChildProfile` milik akun **orang tua**.
- Tidak ada leaderboard, coin, atau perbandingan antar-anak (PRD §4.6) — skema ini
  tidak menyediakan query lintas-anak untuk peringkat, dan itu disengaja.
- Tidak ada realtime/streaming ke dashboard orang tua; rapor cukup segar 60 detik.
- Tidak ada perubahan pada `PlacementTestResult` (di luar scope). Satu catatan
  opsional untuk follow-up terpisah: Postgres tidak otomatis membuat index untuk
  kolom FK, jadi `@@index([childId])` di sana akan membantu kalau riwayat placement
  ikut ditampilkan di rapor — **tidak** dilakukan di TRD ini.
- Multi-anak per akun masih backlog (PRD §14); skema sudah siap (semua tabel
  ber-`child_id`), tapi tidak ada pekerjaan tambahan yang direncanakan di sini.
