/**
 * Story Quest — Petualangan Cerita. Raja Game Hub, ditaruh TEPAT DI BAWAH
 * Sound Hunt (permintaan user "simpan di bawah game sound hunt", urutan
 * array `RAJA_LIST` di app.ts = urutan render `renderGame`). Fokus MURNI
 * Reading comprehension: baca 1 halaman cerita pendek lalu jawab 1
 * pertanyaan sederhana. Pola SAMA PERSIS raja lain (`games/wordmatch.ts`
 * dst): 1 file berdiri sendiri, cerita DATA-DRIVEN (`STORY_BOOKS` di bawah
 * — tambah cerita baru = tambah 1 entri array, TANPA sentuh logic/komponen
 * render sama sekali), TIDAK terikat topik/level Vocab manapun (generik
 * lintas level app, sama seperti raja lain).
 *
 * 🔒 **Revisi TOTAL (permintaan user "update game story quest dengan
 * konsep yang sama dengan game lain nya jadi ada sub list game, pemanasan,
 * mudah dan seterusnya")** — dulu file ini MVP "buku ajaib" (Magic
 * Library): 1 cerita lengkap ("The Lost Puppy", 5 halaman linear) + rak
 * 3 buku placeholder "🔒 Segera Hadir" (`UPCOMING_BOOKS`, sekadar sense of
 * progression tanpa konten beneran) — SATU-SATUNYA raja Game Hub yang
 * BELUM ikut pola Map Kerajaan 6-markas (Pemanasan→Legendaris) yang sudah
 * dipakai raja lain (`games/wordmatch.ts`/`balloonpop.ts`/
 * `sentencepuzzle.ts`/`memorymatch.ts`/`soundhunt.ts`). SEKARANG:
 * `UPCOMING_BOOKS`/`renderLibrary()` (rak buku placeholder) DIHAPUS TOTAL —
 * gantinya **Map Kerajaan Cerita 6-markas**, tiap markas = 1 cerita BERDIRI
 * SENDIRI (bukan lagi 1 cerita + rak kosong): `STORY_BOOKS` sekarang py 6
 * entri (`day-at-park`/Pemanasan BARU, `lost-puppy`/Mudah — cerita LAMA,
 * TIDAK diubah 1 kalimat pun, `missing-kite`/Sedang BARU,
 * `science-fair`/Sulit BARU, `mountain-rescue`/Jago BARU,
 * `time-capsule`/Legendaris BARU), tiap `StoryBook` dapat field BARU
 * `difficulty: WordMatchDifficulty` (reuse union yang SAMA dgn raja
 * lain, BUKAN bikin tipe baru). `runStoryQuest()` (nama EXPORT TETAP SAMA,
 * dipanggil `app.ts`) SEKARANG orkestrator penuh: **Map Kerajaan Cerita**
 * (`renderMap()`, grid `.raja-grid`/`.raja-card` — lihat riwayat desain
 * lengkap komponen ini di komentar `renderMap()` `games/wordmatch.ts`,
 * TIDAK diulang di sini) → tap markas → 1 cerita penuh via
 * `runStoryBookRound()` (dulu bernama `drawPage`+`renderComplete`, jadi
 * fungsi INTERNAL) → balik ke Map → markas ke-6 tuntas → "Semua Cerita
 * Selesai!" → `onDone()`. Mekanik BACA 1 CERITA ITU SENDIRI (halaman-demi-
 * halaman, TTS opt-in, hint, jawaban salah non-punitive TAPI cerita baru
 * lanjut halaman setelah jawaban BENAR) TIDAK berubah sama sekali — lihat
 * paragraf di bawah, itu SATU-SATUNYA bagian raja ini yang beda dari raja
 * lain (mekanik internalnya "baca halaman→jawab", bukan "cocokkan
 * pasangan"/dst), tapi BUNGKUSNYA (Map 6-markas, tag kesulitan, GAME_STAR_
 * FIELD, "Cara Main", footer standar, back-button popup hanya di halaman
 * mengerjakan) SEKARANG SAMA PERSIS raja lain.
 *
 * 🔒 TTS SENGAJA OPT-IN LEWAT TOMBOL, TIDAK PERNAH auto-play (beda dari
 * kebanyakan Kenalan skill lain) — CLAUDE.md eksplisit memperingatkan lensa
 * Reading "diucapkan TTS jadi diam-diam menguji Listening, bukan Reading".
 * "🔊 Dengar" tetap disediakan sbg bantuan opsional pembaca pemula, TIDAK
 * pernah otomatis berbunyi saat halaman dibuka.
 *
 * Jawaban SALAH tidak pernah dead-end (non-punitive, CLAUDE.md) — opsi yang
 * salah cuma dinonaktifkan SENDIRI (anak langsung bisa tap opsi lain tanpa
 * tombol "Coba Lagi" terpisah), "💡 Petunjuk" tersedia sejak awal (eliminasi
 * 2 opsi salah + bocorkan 1 kalimat penuntun, BUKAN jawabannya langsung).
 * Cerita SENGAJA baru lanjut ke halaman berikutnya setelah jawaban BENAR
 * (bukan "Lanjut selalu aktif apa pun hasilnya" spt raja lain) — comprehension
 * check di sini memang gerbang lembut alur inti fitur ini ("Read → Understand
 * → Choose → Continue the Adventure"), bukan sekadar catatan progres.
 *
 * State internal (markas mana yang sudah tuntas, halaman berapa yang lagi
 * dibaca) HANYA hidup selama 1 sesi main, direset tiap "▶️ Main"/"🔁 Main
 * Lagi" dari Game Hub — konsisten pola raja lain, TIDAK disimpan ke
 * progress.ts/localStorage lintas sesi (di luar scope MVP). `onDone()`
 * tetap menambah XP via app.ts sama seperti raja lain.
 */
import { isDevTestAccount } from '../account';
import { setGameRoundActive, setHandlers } from '../interaction';
import { recordAttempt } from '../progress';
import { speak, playCorrectTone, playTryAgainTone } from '../speech';
import { pickPraise, pickEncourage } from '../praise';
import { fireConfetti } from '../confetti';
import { GAME_STAR_FIELD } from '../scenery';
import { shuffle } from '../util';
import type { LevelKey, OnDone, WordMatchDifficulty } from '../types';

/** `RajaKey` game ini — dikirim ke `recordAttempt()`, lihat komentar
 *  `GAME_KEY` `games/wordmatch.ts`. */
const GAME_KEY = 'storyquest';

export interface StoryOption {
  emoji: string;
  text: string;
}

export interface StoryPage {
  title: string;
  sceneEmoji: string;
  /** Kalimat cerita, dirender 1 baris per kalimat (bukan 1 paragraf padat)
   *  supaya terasa halaman buku, bukan blok teks ujian. */
  lines: string[];
  question: string;
  options: StoryOption[];
  correctIndex: number;
  /** Kalimat penuntun singkat diungkap lewat "💡 Petunjuk" — BUKAN jawaban
   *  langsung, cuma mengarahkan anak baca ulang bagian yang relevan. */
  clue: string;
}

export interface StoryBook {
  id: string;
  title: string;
  /** Kalimat ajakan singkat — dipakai DUA kali: teks di kartu Map & baris
   *  "sapaan" (`bookHeaderHtml`) begitu markas ini dibuka, pola SAMA dgn
   *  `JourneyNode.guideLine` raja lain (BUKAN field terpisah — subtitle
   *  cerita ITU SENDIRI sudah kalimat ajakan yang pas dipakai dobel). */
  subtitle: string;
  coverEmoji: string;
  /** Tag kesulitan markas ini — reuse union `WordMatchDifficulty` yang
   *  SAMA dgn raja lain (Kata/Balon/Susun/Ingatan/Sound Hunt), BUKAN tipe
   *  baru, supaya penamaan tingkat konsisten lintas Game Hub. */
  difficulty: WordMatchDifficulty;
  pages: StoryPage[];
}

/** 6 markas Kerajaan Cerita (Pemanasan→Legendaris, permintaan user "update
 *  story quest dengan konsep yang sama dengan game lain... sub list game,
 *  pemanasan, mudah dan seterusnya") — tiap markas = 1 cerita BERDIRI
 *  SENDIRI (Beginning→...→Happy Ending, CLAUDE.md storytelling arc),
 *  jumlah halaman naik SEDIKIT tiap tingkat (3→5) & kosakata/plot makin
 *  kompleks (Pemanasan: 1 tokoh, kejadian sehari-hari — Legendaris: alur
 *  berlapis, perlu simpulkan info lintas beberapa kalimat). Tiap halaman
 *  dalam 1 cerita menguji comprehension BEDA (tempat/benda/isi-teks/
 *  tokoh/emosi/alasan) — bukan 1 pola soal diulang. `lost-puppy` (Mudah)
 *  cerita LAMA dari MVP awal, TIDAK diubah 1 kalimat pun — 5 markas
 *  lainnya BARU. */
export const STORY_BOOKS: StoryBook[] = [
  {
    id: 'day-at-park',
    title: 'A Day at the Park',
    subtitle: 'Temani Mia main di taman!',
    coverEmoji: '⚽',
    difficulty: 'pemanasan',
    pages: [
      {
        title: 'The Park',
        sceneEmoji: '🏞️',
        lines: ['Mia goes to the park.', 'She sees a red ball.', 'She wants to play with it.'],
        question: 'What does Mia see?',
        options: [
          { emoji: '🔴', text: 'A red ball' },
          { emoji: '🟡', text: 'A yellow ball' },
          { emoji: '🐶', text: 'A small dog' },
          { emoji: '🌳', text: 'A big tree' },
        ],
        correctIndex: 0,
        clue: 'Baca kalimat kedua — apa warna bolanya?',
      },
      {
        title: 'New Friend',
        sceneEmoji: '⚽',
        lines: ['Mia kicks the ball softly.', 'The ball rolls to a boy.', 'The boy smiles and kicks it back.'],
        question: 'Who kicks the ball back?',
        options: [
          { emoji: '👦', text: 'A boy' },
          { emoji: '👧', text: 'A girl' },
          { emoji: '🐱', text: 'A cat' },
          { emoji: '👴', text: 'An old man' },
        ],
        correctIndex: 0,
        clue: 'Siapa yang menendang bola itu kembali ke Mia?',
      },
      {
        title: 'Happy Ending',
        sceneEmoji: '🥰',
        lines: ['Mia and the boy play together.', 'They laugh and run around the park.', 'Mia has a fun new friend.'],
        question: 'How does Mia feel?',
        options: [
          { emoji: '😢', text: 'Sad' },
          { emoji: '😊', text: 'Happy' },
          { emoji: '😠', text: 'Angry' },
          { emoji: '😴', text: 'Sleepy' },
        ],
        correctIndex: 1,
        clue: 'Mia tertawa dan berlari-lari — bagaimana perasaannya?',
      },
    ],
  },
  {
    id: 'lost-puppy',
    title: 'The Lost Puppy',
    subtitle: 'Bantu Tom menemukan pemilik anak anjing itu!',
    coverEmoji: '🐶',
    difficulty: 'mudah',
    pages: [
      {
        title: 'The Village',
        sceneEmoji: '🌉',
        lines: ['Tom lives in a small village.', 'One sunny morning, he walks to the square.', 'Near an old bridge, he sees something small and brown.'],
        question: 'Where does Tom see the puppy?',
        options: [
          { emoji: '🌲', text: 'In the forest' },
          { emoji: '🌉', text: 'Near the bridge' },
          { emoji: '🏰', text: 'In the castle' },
          { emoji: '🏫', text: 'At school' },
        ],
        correctIndex: 1,
        clue: 'Baca ulang kalimat terakhir — di dekat apa Tom berdiri?',
      },
      {
        title: 'The Puppy',
        sceneEmoji: '🐶',
        lines: ['The puppy looks very scared.', 'Tom sits down and gives it some water.', 'Then he notices a red collar around its neck.'],
        question: 'What does Tom see on the puppy?',
        options: [
          { emoji: '🎩', text: 'A blue hat' },
          { emoji: '🔴', text: 'A red collar' },
          { emoji: '🎒', text: 'A big bag' },
          { emoji: '📕', text: 'A yellow book' },
        ],
        correctIndex: 1,
        clue: 'Coba dengar lagi — apa warna benda di leher anak anjing itu?',
      },
      {
        title: 'A Little Mystery',
        sceneEmoji: '🏷️',
        lines: ['The collar has a small silver tag.', 'Tom reads a name and a phone number on it.', 'But there is no owner nearby — where did the puppy come from?'],
        question: 'What is written on the tag?',
        options: [
          { emoji: '📛', text: 'A name and a phone number' },
          { emoji: '🐱', text: 'A picture of a cat' },
          { emoji: '🎂', text: 'A birthday date' },
          { emoji: '🗺️', text: 'A secret map' },
        ],
        correctIndex: 0,
        clue: 'Kalimat kedua bilang apa yang Tom baca di tag itu.',
      },
      {
        title: 'The Search',
        sceneEmoji: '🍞',
        lines: ['Tom decides to help the puppy find its home.', 'He walks around the village and asks his neighbors.', 'An old baker points to a small house near the school.'],
        question: 'Who helps Tom find the way?',
        options: [
          { emoji: '🍞', text: 'A baker' },
          { emoji: '🩺', text: 'A doctor' },
          { emoji: '🚒', text: 'A firefighter' },
          { emoji: '✈️', text: 'A pilot' },
        ],
        correctIndex: 0,
        clue: 'Siapa yang menunjuk arah rumah kecil itu di kalimat terakhir?',
      },
      {
        title: 'Happy Ending',
        sceneEmoji: '🥰',
        lines: ['Tom knocks on the door of the small house.', 'A little girl opens it and sees her puppy.', 'She hugs the puppy and thanks Tom with a big smile.'],
        question: 'How does the girl feel?',
        options: [
          { emoji: '😠', text: 'Angry' },
          { emoji: '😢', text: 'Sad' },
          { emoji: '😊', text: 'Happy' },
          { emoji: '😴', text: 'Tired' },
        ],
        correctIndex: 2,
        clue: 'Dia memeluk anak anjingnya sambil tersenyum lebar — bagaimana perasaannya?',
      },
    ],
  },
  {
    id: 'missing-kite',
    title: 'The Missing Kite',
    subtitle: 'Bantu Sam mencari layang-layangnya!',
    coverEmoji: '🪁',
    difficulty: 'sedang',
    pages: [
      {
        title: 'Windy Day',
        sceneEmoji: '🌬️',
        lines: ['Sam flies his new kite on a windy day.', 'Suddenly, a strong gust pulls the string from his hand.', 'The kite flies high over the rooftops and disappears.'],
        question: 'What pulls the kite away?',
        options: [
          { emoji: '🌬️', text: 'A strong wind' },
          { emoji: '🐦', text: 'A big bird' },
          { emoji: '⚡', text: 'A storm' },
          { emoji: '🚗', text: 'A car' },
        ],
        correctIndex: 0,
        clue: 'Apa yang tiba-tiba menarik talinya dari tangan Sam?',
      },
      {
        title: 'Following the Trail',
        sceneEmoji: '👣',
        lines: ['Sam runs down the street to find his kite.', 'He asks a fruit seller if she has seen it.', 'She points toward the tall clock tower in the square.'],
        question: 'Who tells Sam where to look?',
        options: [
          { emoji: '🍎', text: 'A fruit seller' },
          { emoji: '👮', text: 'A police officer' },
          { emoji: '🧑‍🍳', text: 'A chef' },
          { emoji: '🧑‍⚕️', text: 'A doctor' },
        ],
        correctIndex: 0,
        clue: 'Siapa yang menunjuk arah menara jam?',
      },
      {
        title: 'Stuck on the Tower',
        sceneEmoji: '🗼',
        lines: ['Sam finds his kite stuck on the clock tower.', 'It is too high for him to reach alone.', 'A friendly firefighter offers to help him get it down.'],
        question: 'Where is the kite stuck?',
        options: [
          { emoji: '🌳', text: 'On a tree' },
          { emoji: '🗼', text: 'On the clock tower' },
          { emoji: '🏠', text: 'On a roof' },
          { emoji: '🚌', text: 'On a bus' },
        ],
        correctIndex: 1,
        clue: 'Kalimat pertama bilang layang-layang tersangkut di mana.',
      },
      {
        title: 'Happy Ending',
        sceneEmoji: '🥳',
        lines: ['The firefighter climbs up and grabs the kite.', 'Sam thanks her with a big smile.', 'He flies his kite again, holding the string tightly this time.'],
        question: 'How does Sam hold the string now?',
        options: [
          { emoji: '😴', text: 'Loosely' },
          { emoji: '🤝', text: 'Tightly' },
          { emoji: '🙅', text: 'Not at all' },
          { emoji: '🎈', text: 'With balloons' },
        ],
        correctIndex: 1,
        clue: 'Kalimat terakhir bilang bagaimana Sam memegang talinya sekarang.',
      },
    ],
  },
  {
    id: 'science-fair',
    title: 'The Science Fair Surprise',
    subtitle: 'Bantu Rani menyiapkan proyeknya!',
    coverEmoji: '🔬',
    difficulty: 'sulit',
    pages: [
      {
        title: 'A Big Problem',
        sceneEmoji: '😟',
        lines: ["Rani's science project is due tomorrow morning.", 'She planned to grow a plant, but it has not sprouted at all.', 'She feels worried because she has no time left to start over.'],
        question: 'Why is Rani worried?',
        options: [
          { emoji: '🌱', text: "Her plant hasn't grown" },
          { emoji: '📚', text: 'She lost her books' },
          { emoji: '🚌', text: 'She missed the bus' },
          { emoji: '🖊️', text: 'She lost her pen' },
        ],
        correctIndex: 0,
        clue: 'Baca kalimat kedua — apa masalah dengan tanamannya?',
      },
      {
        title: 'An Idea',
        sceneEmoji: '💡',
        lines: ["Rani's older brother notices she looks upset.", "He suggests she explain WHY the seed didn't grow instead.", 'He says real scientists learn a lot from failed experiments too.'],
        question: "What does Rani's brother suggest?",
        options: [
          { emoji: '🌻', text: 'Buy a new plant' },
          { emoji: '🔍', text: "Explain why it didn't grow" },
          { emoji: '😴', text: 'Give up and sleep' },
          { emoji: '🎨', text: 'Draw a picture instead' },
        ],
        correctIndex: 1,
        clue: 'Apa saran dari kakak Rani di kalimat kedua?',
      },
      {
        title: 'Working Together',
        sceneEmoji: '🧪',
        lines: ['That night, Rani and her brother check the soil and water.', 'They discover the seed was planted too deep in the pot.', 'Rani writes down everything they learned as her real project.'],
        question: 'What was wrong with the seed?',
        options: [
          { emoji: '💧', text: 'Too much water' },
          { emoji: '🕳️', text: 'Planted too deep' },
          { emoji: '❄️', text: 'Too cold' },
          { emoji: '🐛', text: 'Eaten by bugs' },
        ],
        correctIndex: 1,
        clue: 'Kalimat kedua bilang apa yang mereka temukan soal bijinya.',
      },
      {
        title: 'Presentation Day',
        sceneEmoji: '🏆',
        lines: ['At the science fair, Rani proudly presents her discovery.', 'Her teacher says explaining a mistake takes real courage.', 'Rani realizes that failing first taught her the most valuable lesson.'],
        question: 'What does the teacher praise?',
        options: [
          { emoji: '😨', text: 'Being scared' },
          { emoji: '💪', text: 'Explaining a mistake bravely' },
          { emoji: '🏃', text: 'Running fast' },
          { emoji: '🎁', text: 'Bringing a gift' },
        ],
        correctIndex: 1,
        clue: 'Apa yang dipuji gurunya di kalimat kedua?',
      },
    ],
  },
  {
    id: 'mountain-rescue',
    title: 'The Mountain Rescue',
    subtitle: 'Ikuti tim penjelajah menyelamatkan seekor elang!',
    coverEmoji: '🦅',
    difficulty: 'jago',
    pages: [
      {
        title: 'A Strange Sound',
        sceneEmoji: '⛰️',
        lines: ['Two young hikers, Dita and Bayu, are climbing a quiet mountain trail.', 'They suddenly hear a faint, distressed cry coming from a rocky ledge.', 'Curious and a little nervous, they carefully climb closer to look.'],
        question: 'What do the hikers hear?',
        options: [
          { emoji: '🎵', text: 'Music playing' },
          { emoji: '😢', text: 'A distressed cry' },
          { emoji: '🚗', text: 'A car horn' },
          { emoji: '🔔', text: 'A bell ringing' },
        ],
        correctIndex: 1,
        clue: 'Kalimat kedua bilang suara apa yang mereka dengar.',
      },
      {
        title: 'The Trapped Eagle',
        sceneEmoji: '🦅',
        lines: ['On the ledge, they find a young eagle with its wing caught in some wire.', 'The eagle looks exhausted and cannot fly away on its own.', 'Dita realizes they must act carefully, or the bird could get more hurt.'],
        question: 'What is wrong with the eagle?',
        options: [
          { emoji: '🦴', text: 'Its leg is broken' },
          { emoji: '🪢', text: 'Its wing is caught in wire' },
          { emoji: '👀', text: 'It cannot see' },
          { emoji: '🥶', text: 'It is too cold' },
        ],
        correctIndex: 1,
        clue: 'Kalimat pertama bilang sayapnya tersangkut apa.',
      },
      {
        title: 'Working as a Team',
        sceneEmoji: '🤝',
        lines: ['Bayu gently holds the eagle still while Dita carefully cuts the wire.', 'It takes several tense minutes, and they move slowly to stay calm.', "Finally, the wire snaps loose and the eagle's wing is free again."],
        question: 'What does Dita do to help?',
        options: [
          { emoji: '🧵', text: 'She cuts the wire' },
          { emoji: '🍎', text: 'She feeds it fruit' },
          { emoji: '📞', text: 'She calls for a doctor' },
          { emoji: '🏃', text: 'She runs away' },
        ],
        correctIndex: 0,
        clue: 'Siapa yang memotong kawatnya, dan pakai apa?',
      },
      {
        title: 'Flying Free',
        sceneEmoji: '🌄',
        lines: ['The eagle rests for a moment, testing its wing slowly.', 'Then, with a powerful flap, it soars up into the open sky.', 'Dita and Bayu watch proudly, knowing they made a real difference.'],
        question: 'How do Dita and Bayu feel at the end?',
        options: [
          { emoji: '😔', text: 'Disappointed' },
          { emoji: '😨', text: 'Frightened' },
          { emoji: '😌', text: 'Proud' },
          { emoji: '😡', text: 'Angry' },
        ],
        correctIndex: 2,
        clue: 'Kalimat terakhir bilang bagaimana perasaan mereka.',
      },
    ],
  },
  {
    id: 'time-capsule',
    title: 'The Time Capsule Mystery',
    subtitle: 'Pecahkan misteri kapsul waktu bersama Leo!',
    coverEmoji: '🕰️',
    difficulty: 'legendaris',
    pages: [
      {
        title: 'A Strange Discovery',
        sceneEmoji: '🏗️',
        lines: ['Workers repairing the old school playground uncover a rusty metal box.', "Engraved on the lid are the words: 'Open in 50 years.'", 'The date carved beside it shows that fifty years have passed exactly today.'],
        question: 'When should the box be opened, according to the engraving?',
        options: [
          { emoji: '🎂', text: "On someone's birthday" },
          { emoji: '⏳', text: 'After 50 years' },
          { emoji: '🎓', text: 'On graduation day' },
          { emoji: '🎄', text: 'On a holiday' },
        ],
        correctIndex: 1,
        clue: 'Baca ulang kalimat kedua — kapan kotak itu boleh dibuka?',
      },
      {
        title: 'Inside the Box',
        sceneEmoji: '📦',
        lines: ['Leo, a curious student, is chosen to open the box during assembly.', 'Inside, he finds old photographs, a handwritten letter, and a small key.', "The letter is addressed 'To whoever finds this, fifty years from now.'"],
        question: 'What is inside the box, besides photos and a letter?',
        options: [
          { emoji: '🔑', text: 'A small key' },
          { emoji: '💰', text: 'A bag of coins' },
          { emoji: '🧸', text: 'A toy bear' },
          { emoji: '📱', text: 'A phone' },
        ],
        correctIndex: 0,
        clue: 'Kalimat kedua menyebut 3 benda — salah satunya benda kecil untuk membuka sesuatu.',
      },
      {
        title: 'A Puzzling Clue',
        sceneEmoji: '✉️',
        lines: ['The letter describes a tree that the students planted fifty years ago.', 'It says the key belongs to a box buried beneath that very tree.', 'But the old playground map shows three trees planted around that time.'],
        question: 'Why is finding the second box tricky?',
        options: [
          { emoji: '🗝️', text: 'The key is broken' },
          { emoji: '🌳', text: 'There are three possible trees' },
          { emoji: '🗺️', text: 'The map is missing' },
          { emoji: '🌧️', text: "It's raining hard" },
        ],
        correctIndex: 1,
        clue: 'Kalimat terakhir bilang berapa pohon yang mungkin jadi lokasinya.',
      },
      {
        title: 'Solving the Mystery',
        sceneEmoji: '🌳',
        lines: ["Leo notices the letter mentions the tree standing 'closest to the old well'.", 'Checking the map again, only one tree matches that exact description.', 'The students dig carefully beneath it and find a second, smaller box.'],
        question: 'How does Leo know which tree is the right one?',
        options: [
          { emoji: '🎲', text: 'He guesses randomly' },
          { emoji: '📍', text: "It's closest to the old well" },
          { emoji: '🌈', text: 'It has the prettiest leaves' },
          { emoji: '📏', text: "It's the tallest tree" },
        ],
        correctIndex: 1,
        clue: 'Petunjuk dari surat itu soal jarak pohon ke apa?',
      },
      {
        title: 'A Message for the Future',
        sceneEmoji: '🎉',
        lines: ['Inside the second box, they find a class photo and a new letter.', "The letter asks Leo's class to bury a new time capsule of their own.", 'Excited, the students begin planning what to leave for students fifty years from now.'],
        question: 'What does the new letter ask the students to do?',
        options: [
          { emoji: '🏫', text: 'Build a new school' },
          { emoji: '📦', text: 'Bury a new time capsule' },
          { emoji: '🎨', text: 'Paint a mural' },
          { emoji: '🏃', text: 'Run a race' },
        ],
        correctIndex: 1,
        clue: 'Baca ulang kalimat kedua — apa yang diminta surat baru itu?',
      },
    ],
  },
];

export interface DifficultyMeta {
  label: string;
}

/** Label tag kesulitan (`.tag.diff-*`) — duplikat lokal ringan (pola sama
 *  `DIFFICULTY_LABEL` `games/soundhunt.ts`, cuma label krn tiap markas di
 *  sini sudah ditulis manual 1-1, bukan digenerate dari 1 bank+meta). */
export const DIFFICULTY_META: Record<WordMatchDifficulty, DifficultyMeta> = {
  pemanasan: { label: 'Pemanasan' },
  mudah: { label: 'Mudah' },
  sedang: { label: 'Sedang' },
  sulit: { label: 'Sulit' },
  jago: { label: 'Jago' },
  legendaris: { label: 'Legendaris' },
};

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

/** Duplikat lokal `.opt-btn.answer-card` (konvensi app ini: helper generik
 *  diduplikasi per file game — lihat games/soundhunt.ts dst). */
function optionCardsHtml(options: StoryOption[], wrong: Set<number>, eliminated: Set<number>): string {
  return `<div class="opt-grid">
    ${options
      .map((o, i) => {
        const classes = ['opt-btn', 'answer-card'];
        if (wrong.has(i)) classes.push('wrong');
        if (eliminated.has(i)) classes.push('eliminated');
        const disabled = wrong.has(i) || eliminated.has(i) ? 'disabled' : '';
        return `
      <button class="${classes.join(' ')}" type="button" data-action="pick" data-payload="${i}" ${disabled}>
        <span class="answer-card-emoji" aria-hidden="true">${o.emoji}</span>
        <span class="answer-card-bottom">
          <span class="answer-card-label">${o.text}</span>
          <span class="answer-card-badge" aria-hidden="true">${ANSWER_LETTERS[i] ?? i + 1}</span>
        </span>
      </button>`;
      })
      .join('')}
  </div>`;
}

function lockAllOptions(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.opt-btn').forEach((b) => (b.disabled = true));
}

/** "Cara Main" — duplikat lokal, lihat komentar lengkap `gameHowToHtml`
 *  `games/wordmatch.ts`. */
function gameHowToHtml(steps: string[]): string {
  return `
    <h2 class="game-howto-title">Cara Main</h2>
    <div class="card game-howto-card">
      <ol class="game-howto-list">
        ${steps.map((s, i) => `<li><span class="game-howto-num" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`).join('')}
      </ol>
    </div>`;
}

/** Opsional — dipasok `runStoryQuest()` (orkestrator Map Kerajaan Cerita)
 *  supaya 1 markas tahu posisinya, pola SAMA PERSIS `RoundJourneyCtx`
 *  `games/wordmatch.ts`. */
interface RoundJourneyCtx {
  isLast: boolean;
  headerHtml: string;
}

/** Header dalam layar 1 markas (dipasok ke `runStoryBookRound()` via
 *  `journey.headerHtml`) — pola SAMA PERSIS `games/wordmatch.ts`
 *  `nodeHeaderHtml()`, `book.subtitle` dipakai LANGSUNG sbg "guideLine"
 *  (lihat komentar `StoryBook.subtitle`). */
function bookHeaderHtml(book: StoryBook, doneCount: number, total: number): string {
  return `
    <div class="latihan-head">
      <span class="stage-badge">${book.coverEmoji} ${book.title}</span>
      <span class="tag accent">📖 ${doneCount}/${total}</span>
    </div>
    <p class="meta" style="margin-top:var(--s3)">📯 "${book.subtitle}"</p>`;
}

/** Mesin 1 markas — baca 1 cerita penuh, halaman demi halaman. Dulu bernama
 *  `drawPage`+`renderComplete`, satu-satunya alur di file ini (SUDAH
 *  DIRENAME jadi fungsi INTERNAL, lihat komentar puncak file). Sekarang
 *  dipakai `runStoryQuest()` orkestrator di bawah (dipanggil 1× tiap markas
 *  ditap). Mekanik baca-halaman/jawab/hint SAMA PERSIS versi sebelumnya,
 *  TIDAK diubah — cuma dibungkus `journey` context & pemanggilan `onDone()`
 *  di halaman TERAKHIR (dulu `renderComplete()`/`renderLibrary()` lokal,
 *  sekarang balik ke Map Kerajaan Cerita lewat callback). */
function runStoryBookRound(container: HTMLElement, book: StoryBook, onDone: OnDone, level: LevelKey, journey?: RoundJourneyCtx): void {
  const total = book.pages.length;

  function drawPage(idx: number): void {
    const page = book.pages[idx];
    const wrong = new Set<number>();
    const eliminated = new Set<number>();
    let hintUsed = false;
    let answered = false;

    function dotsHtml(): string {
      const dots = book.pages
        .map((_, i) => {
          const cls = i < idx ? 'done' : i === idx ? 'current' : '';
          return `<span class="quiz-dot static ${cls}" aria-hidden="true">${i < idx ? '✓' : i + 1}</span>`;
        })
        .join('');
      return `<div class="quiz-nav"><div class="quiz-dots">${dots}</div></div>`;
    }

    function paint(): void {
      container.innerHTML = `
        ${journey?.headerHtml ?? ''}
        <div class="latihan-head">
          <span class="stage-badge">📖 ${page.title}</span>
          <span class="tag accent">Halaman ${idx + 1}/${total}</span>
        </div>
        ${dotsHtml()}
        <div class="story-page story-page-enter">
          <div class="story-scene" aria-hidden="true"><span>${page.sceneEmoji}</span></div>
          ${page.lines.map((l) => `<p class="story-line">${l}</p>`).join('')}
        </div>
        <div class="speak-row">
          <button class="speak-btn-ghost" type="button" data-action="listen">🔊 Dengar</button>
          ${!answered && !hintUsed ? `<button class="speak-btn-ghost" type="button" data-action="hint">💡 Petunjuk</button>` : ''}
        </div>
        ${hintUsed ? `<p class="meta story-clue">💭 ${page.clue}</p>` : ''}
        <div class="story-divider" aria-hidden="true">✨ · · · ✨</div>
        <p class="story-question">${page.question}</p>
        ${optionCardsHtml(page.options, wrong, eliminated)}
        <div class="feedback" id="fb"></div>
      `;
      setHandlers({
        listen: () => speak([...page.lines, page.question].join(' ')),
        hint: () => {
          if (hintUsed) return;
          hintUsed = true;
          const untried = page.options.map((_, i) => i).filter((i) => i !== page.correctIndex && !wrong.has(i));
          shuffle(untried)
            .slice(0, 2)
            .forEach((i) => eliminated.add(i));
          paint();
        },
        pick: (payload) => onPick(Number(payload)),
      });
    }

    function onPick(i: number): void {
      if (answered || wrong.has(i) || eliminated.has(i)) return;
      const correct = i === page.correctIndex;
      recordAttempt(correct, GAME_KEY);
      const fb = container.querySelector<HTMLElement>('#fb')!;
      const btn = container.querySelectorAll<HTMLButtonElement>('.opt-btn')[i];

      if (correct) {
        answered = true;
        lockAllOptions(container);
        btn.classList.add('correct', 'win-burst');
        playCorrectTone();
        fireConfetti();
        fb.textContent = pickPraise(level);
        fb.className = 'feedback good';
        const isLastPage = idx === total - 1;
        const isLast = isLastPage && (journey?.isLast ?? true);
        fb.insertAdjacentHTML(
          'afterend',
          `<div class="round-actions"><button class="primary-btn" type="button" data-action="nextRound" style="margin-top:0">${isLast ? 'Selesai ✅' : 'Lanjut ➡️'}</button></div>`
        );
        setHandlers({ nextRound: () => (isLastPage ? onDone() : drawPage(idx + 1)) });
      } else {
        wrong.add(i);
        btn.classList.add('wrong');
        btn.disabled = true;
        playTryAgainTone();
        fb.textContent = pickEncourage(level);
        fb.className = 'feedback bad';
      }
    }

    paint();
  }

  drawPage(0);
}

/**
 * Story Quest — orkestrator penuh (dipanggil `app.ts runRajaRound`), pola
 * SAMA PERSIS `games/wordmatch.ts` `runWordMatch()` — Map Kerajaan Cerita
 * 6-markas → tap markas → 1 cerita penuh via `runStoryBookRound()` →
 * balik ke Map → markas ke-6 tuntas → "Semua Cerita Selesai!" →
 * `onDone()`. State `visited` cuma hidup di closure ini, TIDAK disimpan
 * progress.ts/localStorage, konsisten semua raja Game Hub lain.
 */
export function runStoryQuest(container: HTMLElement, onDone: OnDone, level: LevelKey): void {
  const total = STORY_BOOKS.length;
  const visited = new Set<number>();

  function renderMap(): void {
    // 🔒 Back dari layar Map TIDAK perlu pop up konfirmasi lagi (permintaan
    // user) — lihat komentar `isGameRoundActive` `interaction.ts`.
    setGameRoundActive(false);
    const stops = STORY_BOOKS.map((book, i) => {
      const cleared = visited.has(i);
      // Akun tes dev ("124") lihat SEMUA markas terbuka — lihat account.ts isDevTestAccount().
      const unlocked = isDevTestAccount() || i === 0 || visited.has(i - 1);
      const stateClass = cleared ? 'is-cleared' : unlocked ? 'is-open' : 'is-locked';
      const pct = cleared ? 100 : 0;
      const badge = `<span class="skill-pct${pct >= 100 ? ' done' : ''}">${pct}%</span>`;
      const meta = DIFFICULTY_META[book.difficulty];
      return `
      <button class="raja-card map-card ${stateClass}" type="button" data-action="enterNode" data-payload="${i}" ${unlocked ? '' : 'disabled aria-disabled="true"'} style="--band-deep:var(--brand-500)">
        ${badge}
        <span class="raja-card-icon" aria-hidden="true"><span class="mascot-idle" style="font-size:clamp(52px,14vw,68px);animation-delay:${(i * 0.15).toFixed(2)}s">${book.coverEmoji}</span></span>
        <h3>${book.title}</h3>
        <span class="tag diff-${book.difficulty}">${meta.label}</span>
      </button>`;
    }).join('');

    const dots = STORY_BOOKS.map((_, i) => {
      const done = visited.has(i);
      return `<span class="game-progress-dot${done ? ' done' : ''}" aria-hidden="true">${done ? '✓' : ''}</span>`;
    }).join('');

    container.innerHTML = `
      <div class="raja-map-wrap">
        ${GAME_STAR_FIELD}
        <div class="card game-progress-card">
          <h2>Taklukkan markas satu per satu, ya!</h2>
          <div class="game-progress-dots">${dots}<span class="game-progress-label">Selesai ${visited.size} dari ${total}</span></div>
        </div>
        <div class="raja-grid">${stops}</div>
        ${gameHowToHtml([
          'Baca tiap halaman cerita pelan-pelan',
          'Jawab pertanyaan di bawahnya',
          'Jawaban benar membuka halaman berikutnya',
          'Taklukkan markas satu per satu sampai tuntas!',
        ])}
      </div>`;
    setHandlers({ enterNode: (payload) => playStage(Number(payload)) });
  }

  function playStage(idx: number): void {
    setGameRoundActive(true); // masuk markas = "halaman mengerjakan", popup keluar aktif lagi
    const book = STORY_BOOKS[idx];
    const isLast = idx === total - 1;
    runStoryBookRound(
      container,
      book,
      () => {
        visited.add(idx);
        if (visited.size >= total) renderMissionComplete();
        else renderMap();
      },
      level,
      { isLast, headerHtml: bookHeaderHtml(book, visited.size, total) }
    );
  }

  function renderMissionComplete(): void {
    setGameRoundActive(false); // layar selesai, tidak ada progres yang bisa hilang
    container.innerHTML = `
      <div class="done-wrap win">
        <div class="sunburst lg mascot-pop" aria-hidden="true"><span class="face">📖</span><span class="crown">✨</span></div>
        <h2 class="win-banner">Semua Cerita Selesai!</h2>
        <p class="done-sub">Kamu berhasil menjelajahi seluruh Kerajaan Cerita & menamatkan semua kisahnya!</p>
        <button class="primary-btn" type="button" data-action="finish">Selesai ✅</button>
      </div>`;
    setHandlers({ finish: () => onDone() });
  }

  renderMap();
}
