/**
 * Data Story Quest (Raja Cerita) — dipisah dari `games/storyquest.ts`
 * supaya dicek otomatis `scripts/verify-vocab-content.mjs` tanpa ikut
 * mem-bundle kode DOM. Pola sama `wordmatch-data.ts`/`soundhunt-data.ts`.
 * Analisis & riset: `materi/pembeda_level_game.md` § Story Quest.
 *
 * 🔒 Bentuk game tetap (baca 1 halaman cerita → jawab 1 pertanyaan, 5
 * halaman = 5 soal per markas). Yang naik tiap markas = JENIS PEMAHAMAN yang
 * diuji (tangga proses membaca PIRLS/Barrett: temukan info tersurat →
 * rujukan kata ganti → parafrase → simpulkan yang tidak tertulis → gabung
 * beberapa kalimat), plus bentuk jawaban & bantuan yang memudar:
 *
 * | Markas     | Teks/halaman  | Jenis soal                              | Opsi          | 🔊 Dengar | 💡 Petunjuk                     |
 * |------------|---------------|-----------------------------------------|---------------|-----------|---------------------------------|
 * | Pemanasan  | 2 kalimat     | info tersurat, jawab dgn GAMBAR         | gambar saja   | ada       | sorot kalimat + coret 2 opsi    |
 * | Mudah      | 3 kalimat     | info tersurat, pengecoh IKUT disebut    | gambar + teks | ada       | sorot kalimat + coret 2 opsi    |
 * | Sedang     | 3 kalimat     | rujukan kata ganti (she/he/it = siapa?) | teks          | —         | sorot kalimat                   |
 * | Sulit      | 3 kalimat     | parafrase (jawaban pakai kata lain)     | teks          | —         | sorot kalimat                   |
 * | Jago       | 3 kalimat     | simpulkan yg tidak tertulis (perasaan/  | teks          | —         | 🔒 sampai 1x coba, sorot kalimat |
 * |            |               | alasan/siapa)                           |               |           |                                 |
 * | Legendaris | 4 kalimat     | gabung beberapa kalimat (hitung, lokasi,| teks          | —         | 🔒 sampai 1x coba, sorot kalimat |
 * |            |               | tebak kelanjutan)                       |               |           |                                 |
 *
 * 🔒 Anti-tebak (CLAUDE.md "Soal Tidak Boleh Bisa Ditebak" pola #2, dicek
 * build): jawaban benar TIDAK BOLEH jadi satu-satunya opsi yang paling
 * banyak memakai kata dari teks halaman itu — dulu 21 dari 25 soal bisa
 * dijawab cuma dgn mencocokkan kata ("A red collar" ↔ "a red collar").
 * Pengecoh sengaja memakai kata dari teks (hal yang disebut tapi bukan
 * jawabannya: "not food", "Lia stays home").
 */
import type { WordMatchDifficulty } from '../types';

export type AnswerStyle = 'picture' | 'picture-text' | 'text';

export interface TierConfig {
  label: string;
  answer: AnswerStyle;
  /** Tombol "🔊 Dengar" (TTS opt-in, tidak pernah auto-play). */
  listen: boolean;
  /** 💡 Petunjuk juga mencoret 2 opsi salah. */
  eliminate: boolean;
  /** 💡 Petunjuk terkunci 🔒 sampai anak 1x mencoba halaman itu. */
  hintGated: boolean;
  /** Label jenis soal di atas pertanyaan. */
  badge: string;
}

export const TIER_CONFIG: Record<WordMatchDifficulty, TierConfig> = {
  pemanasan: { label: 'Pemanasan', answer: 'picture', listen: true, eliminate: true, hintGated: false, badge: '🖼️ Baca, lalu Tunjuk Gambarnya' },
  mudah: { label: 'Mudah', answer: 'picture-text', listen: true, eliminate: true, hintGated: false, badge: '🔎 Cari di Cerita' },
  sedang: { label: 'Sedang', answer: 'text', listen: false, eliminate: false, hintGated: false, badge: '👉 Siapa yang Dimaksud?' },
  sulit: { label: 'Sulit', answer: 'text', listen: false, eliminate: false, hintGated: false, badge: '🔁 Artinya Sama' },
  jago: { label: 'Jago', answer: 'text', listen: false, eliminate: false, hintGated: true, badge: '🤔 Tebak dari Cerita' },
  legendaris: { label: 'Legendaris', answer: 'text', listen: false, eliminate: false, hintGated: true, badge: '🧩 Gabungkan Petunjuknya' },
};

export interface StoryOption {
  text: string;
  /** Wajib utk markas `picture`/`picture-text`, TIDAK dipakai di markas
   *  `text` (jawaban abstrak tidak punya ikon yang relevan). */
  emoji?: string;
}

export interface StoryPage {
  title: string;
  sceneEmoji: string;
  /** 1 baris per kalimat — supaya terasa halaman buku. */
  lines: string[];
  question: string;
  options: StoryOption[];
  /** Indeks opsi yang benar (diacak saat ditampilkan). */
  answer: number;
  /** Indeks kalimat bukti — disorot 💡 Petunjuk. */
  evidence: number[];
  /** Kalimat penuntun singkat (Indonesia) — TIDAK menyebut jawabannya. */
  clue: string;
}

export interface StoryBook {
  id: string;
  title: string;
  /** Kalimat ajakan — tampil di header markas. */
  subtitle: string;
  coverEmoji: string;
  difficulty: WordMatchDifficulty;
  pages: StoryPage[];
}

export const STORY_BOOKS: StoryBook[] = [
  {
    id: 'mia-at-the-park',
    title: 'Mia at the Park',
    subtitle: 'Temani Mia main di taman!',
    coverEmoji: '🪁',
    difficulty: 'pemanasan',
    pages: [
      {
        title: 'This Is Mia',
        sceneEmoji: '👧',
        lines: ['This is Mia.', 'Mia has a kite.'],
        question: 'What does Mia have?',
        options: [
          { text: 'A kite', emoji: '🪁' },
          { text: 'A balloon', emoji: '🎈' },
          { text: 'A ball', emoji: '⚽' },
          { text: 'A teddy bear', emoji: '🧸' },
        ],
        answer: 0,
        evidence: [1],
        clue: 'Lihat kalimat yang ada kata "has".',
      },
      {
        title: 'To the Park',
        sceneEmoji: '☀️',
        lines: ['Mia goes to the park.', 'The sun is hot.'],
        question: 'Where does Mia go?',
        options: [
          { text: 'The park', emoji: '🏞️' },
          { text: 'The school', emoji: '🏫' },
          { text: 'The beach', emoji: '🏖️' },
          { text: 'The house', emoji: '🏠' },
        ],
        answer: 0,
        evidence: [0],
        clue: 'Lihat kalimat yang ada kata "goes to".',
      },
      {
        title: 'A New Friend',
        sceneEmoji: '🐶',
        lines: ['Mia sees a dog.', 'The dog is small.'],
        question: 'What does Mia see?',
        options: [
          { text: 'A dog', emoji: '🐶' },
          { text: 'A cat', emoji: '🐱' },
          { text: 'A cow', emoji: '🐮' },
          { text: 'A frog', emoji: '🐸' },
        ],
        answer: 0,
        evidence: [0],
        clue: 'Lihat kalimat yang ada kata "sees".',
      },
      {
        title: 'Snack Time',
        sceneEmoji: '🌳',
        lines: ['Mia and the dog sit under a tree.', 'Mia eats apples.'],
        question: 'What does Mia eat?',
        options: [
          { text: 'Apples', emoji: '🍎🍎' },
          { text: 'Bananas', emoji: '🍌🍌' },
          { text: 'Carrots', emoji: '🥕🥕' },
          { text: 'Cookies', emoji: '🍪🍪' },
        ],
        answer: 0,
        evidence: [1],
        clue: 'Lihat kalimat yang ada kata "eats".',
      },
      {
        title: 'A Happy Day',
        sceneEmoji: '🥰',
        lines: ['Mia is happy.', 'She likes the park.'],
        question: 'How is Mia?',
        options: [
          { text: 'Happy', emoji: '😊' },
          { text: 'Sad', emoji: '😢' },
          { text: 'Angry', emoji: '😠' },
          { text: 'Sleepy', emoji: '😴' },
        ],
        answer: 0,
        evidence: [0],
        clue: 'Lihat kalimat pertama.',
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
        lines: ['Tom lives in a small village.', 'One morning, he walks past the school and the old bridge.', 'Near the bridge, he sees something small and brown.'],
        question: 'Where does Tom see the puppy?',
        options: [
          { text: 'Near the bridge', emoji: '🌉' },
          { text: 'Near the school', emoji: '🏫' },
          { text: 'In the forest', emoji: '🌲' },
          { text: 'In the castle', emoji: '🏰' },
        ],
        answer: 0,
        evidence: [2],
        clue: 'Tom melewati 2 tempat. Di dekat tempat yang mana dia melihat sesuatu?',
      },
      {
        title: 'The Puppy',
        sceneEmoji: '🐶',
        lines: ['The puppy looks very scared.', 'Tom gives it some water, not food.', 'Then he sees a red collar around its neck.'],
        question: 'What does Tom give the puppy?',
        options: [
          { text: 'Water', emoji: '💧' },
          { text: 'Food', emoji: '🍖' },
          { text: 'Milk', emoji: '🥛' },
          { text: 'A toy', emoji: '🧸' },
        ],
        answer: 0,
        evidence: [1],
        clue: 'Perhatikan kata "not" di kalimat kedua.',
      },
      {
        title: 'The Tag',
        sceneEmoji: '🏷️',
        lines: ['The collar has a small tag.', 'Tom reads a name on it.', 'There is no phone number.'],
        question: 'What is on the tag?',
        options: [
          { text: 'A name', emoji: '📛' },
          { text: 'A phone number', emoji: '📞' },
          { text: 'A map', emoji: '🗺️' },
          { text: 'A picture', emoji: '🖼️' },
        ],
        answer: 0,
        evidence: [1, 2],
        clue: 'Satu benda ADA di tag, satu benda TIDAK ada.',
      },
      {
        title: 'Asking for Help',
        sceneEmoji: '🍞',
        lines: ['Tom asks his neighbors for help.', 'The doctor does not know the puppy.', 'But the baker points to a small house.'],
        question: 'Who helps Tom?',
        options: [
          { text: 'The baker', emoji: '🍞' },
          { text: 'The doctor', emoji: '🩺' },
          { text: 'A firefighter', emoji: '🚒' },
          { text: 'A pilot', emoji: '✈️' },
        ],
        answer: 0,
        evidence: [1, 2],
        clue: 'Siapa yang TIDAK tahu, dan siapa yang menunjuk rumahnya?',
      },
      {
        title: 'Home Again',
        sceneEmoji: '🏠',
        lines: ['Tom knocks on the door of the house.', 'A little girl opens it and sees her puppy.', 'She hugs it and smiles.'],
        question: 'How does the girl feel?',
        options: [
          { text: 'Happy', emoji: '😊' },
          { text: 'Sad', emoji: '😢' },
          { text: 'Angry', emoji: '😠' },
          { text: 'Tired', emoji: '😴' },
        ],
        answer: 0,
        evidence: [2],
        clue: 'Apa yang dia lakukan sambil memeluk anak anjingnya?',
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
        sceneEmoji: '🍃',
        lines: ['Sam and his sister Lia fly a kite.', 'She holds the string first.', 'Then a strong wind pulls it away.'],
        question: 'Who holds the string first?',
        options: [{ text: 'Lia' }, { text: 'Sam' }, { text: 'The wind' }, { text: 'Mom' }],
        answer: 0,
        evidence: [0, 1],
        clue: '"She" di kalimat kedua itu siapa?',
      },
      {
        title: 'Where Is It?',
        sceneEmoji: '🏘️',
        lines: ['The kite flies over the houses.', 'Sam goes after it, but Lia stays home.', 'He wants to find it before dark.'],
        question: 'Who wants to find the kite before dark?',
        options: [{ text: 'Sam' }, { text: 'Lia' }, { text: 'Dad' }, { text: 'A friend' }],
        answer: 0,
        evidence: [1, 2],
        clue: '"He" di kalimat terakhir itu siapa? Siapa yang pergi, siapa yang di rumah?',
      },
      {
        title: 'The Fruit Seller',
        sceneEmoji: '🍊',
        lines: ['At the market, Sam meets Mrs. Rosa and Mr. Tono.', 'She saw the kite this morning, but he did not.', 'She points to the clock tower.'],
        question: 'Who saw the kite this morning?',
        options: [{ text: 'Mrs. Rosa' }, { text: 'Mr. Tono' }, { text: 'Sam' }, { text: 'Lia' }],
        answer: 0,
        evidence: [0, 1],
        clue: 'Ada 2 orang. "She" itu yang perempuan atau yang laki-laki?',
      },
      {
        title: 'Stuck on the Tower',
        sceneEmoji: '🗼',
        lines: ['The kite is stuck on the clock tower.', 'Sam cannot reach it.', 'A firefighter, Mr. Budi, brings a long ladder.'],
        question: 'What can Sam not reach?',
        options: [{ text: 'The kite' }, { text: 'The ladder' }, { text: 'Mr. Budi' }, { text: 'The fruit' }],
        answer: 0,
        evidence: [0, 1],
        clue: '"It" di kalimat kedua itu benda apa?',
      },
      {
        title: 'Got It!',
        sceneEmoji: '🥳',
        lines: ['Mr. Budi climbs up and gets the kite.', 'He gives it back to Sam.', 'Now the boy holds the string tightly.'],
        question: 'Who holds the string tightly now?',
        options: [{ text: 'Sam' }, { text: 'Mr. Budi' }, { text: 'Lia' }, { text: 'Mrs. Rosa' }],
        answer: 0,
        evidence: [1, 2],
        clue: '"The boy" itu siapa? Siapa yang menerima layang-layangnya?',
      },
    ],
  },
  {
    id: 'science-fair',
    title: "Rani's Science Project",
    subtitle: 'Bantu Rani menyiapkan proyek sainsnya!',
    coverEmoji: '🔬',
    difficulty: 'sulit',
    pages: [
      {
        title: 'A Big Problem',
        sceneEmoji: '🪴',
        lines: ["Rani's science project is due tomorrow.", 'She planted a seed two weeks ago.', 'But nothing has come out of the soil yet.'],
        question: 'What is the problem?',
        options: [{ text: 'The plant has not grown.' }, { text: 'The soil is too dry.' }, { text: 'She lost the seed.' }, { text: 'The project is due today.' }],
        answer: 0,
        evidence: [2],
        clue: 'Kalimat terakhir: apa artinya "nothing has come out"?',
      },
      {
        title: 'An Idea',
        sceneEmoji: '💡',
        lines: ['Her brother Adi sees that she is sad.', 'He says, "Tell everyone why the seed did not grow."', '"Scientists learn from mistakes too."'],
        question: "What is Adi's idea?",
        options: [{ text: 'Explain what went wrong.' }, { text: 'Buy a new seed.' }, { text: 'Tell everyone she is sad.' }, { text: 'Grow a bigger plant.' }],
        answer: 0,
        evidence: [1],
        clue: 'Cari kalimat yang artinya sama dengan ucapan Adi.',
      },
      {
        title: 'Working Together',
        sceneEmoji: '🧪',
        lines: ['That night, they dig up the seed carefully.', 'It is very far down in the pot.', 'The seed was too deep to reach the sunlight.'],
        question: 'Why did the seed not grow?',
        options: [{ text: 'It was buried too low.' }, { text: 'It had too much sunlight.' }, { text: 'The pot was too small.' }, { text: 'They dug it up at night.' }],
        answer: 0,
        evidence: [1, 2],
        clue: '"Far down" dan "too deep" artinya apa?',
      },
      {
        title: 'Notes',
        sceneEmoji: '📓',
        lines: ['Rani writes everything in her notebook.', 'She draws the pot and the seed.', 'She is not sad anymore.'],
        question: 'How does Rani feel now?',
        options: [{ text: 'She feels better.' }, { text: 'She is still sad.' }, { text: 'She feels angry.' }, { text: 'She wants to sleep.' }],
        answer: 0,
        evidence: [2],
        clue: 'Perhatikan "not ... anymore" di kalimat terakhir.',
      },
      {
        title: 'Science Fair',
        sceneEmoji: '🏆',
        lines: ['At the science fair, Rani shows her notebook.', 'Her teacher says, "Explaining a mistake is brave."', 'Rani gets a special prize.'],
        question: 'What does the teacher think?',
        options: [{ text: 'Rani showed courage.' }, { text: 'Rani made a mistake.' }, { text: 'The notebook is special.' }, { text: 'The fair is too long.' }],
        answer: 0,
        evidence: [1],
        clue: 'Kata "brave" punya arti yang sama dengan kata apa?',
      },
    ],
  },
  {
    id: 'hill-rescue',
    title: 'Rescue on the Hill',
    subtitle: 'Ikuti Dita dan Bayu menolong seekor anak kucing!',
    coverEmoji: '⛰️',
    difficulty: 'jago',
    pages: [
      {
        title: 'A Small Sound',
        sceneEmoji: '⛰️',
        lines: ['Dita and Bayu walk up a quiet hill.', 'Suddenly they hear a small "meow" from a tall tree.', 'Dita stops and looks up.'],
        question: 'What is in the tree?',
        options: [{ text: 'A kitten' }, { text: 'A bird' }, { text: 'A dog' }, { text: 'A kite' }],
        answer: 0,
        evidence: [1],
        clue: 'Hewan apa yang bersuara "meow"?',
      },
      {
        title: 'Up High',
        sceneEmoji: '🌳',
        lines: ['The kitten is on a high branch.', 'It holds the branch tightly and does not move.', 'It cries again and again.'],
        question: 'How does the kitten feel?',
        options: [{ text: 'Scared' }, { text: 'Sleepy' }, { text: 'Proud' }, { text: 'Bored' }],
        answer: 0,
        evidence: [1, 2],
        clue: 'Berpegangan erat dan terus menangis — perasaan apa itu?',
      },
      {
        title: 'The Old House',
        sceneEmoji: '🏠',
        lines: ['Bayu is tall, but the branch is too high.', 'Dita sees an old ladder next to a small house.', 'She knocks on the door of the house.'],
        question: 'Why does Dita knock on the door?',
        options: [{ text: 'To borrow something to climb.' }, { text: 'To look at the old house.' }, { text: 'To buy some food.' }, { text: 'To go home.' }],
        answer: 0,
        evidence: [0, 1],
        clue: 'Apa masalah Bayu, dan apa yang Dita lihat di dekat rumah?',
      },
      {
        title: 'Slowly, Slowly',
        sceneEmoji: '🪜',
        lines: ['A grandmother opens the door and smiles.', '"Of course you can use it," she says.', 'Bayu climbs up slowly and holds the kitten gently.'],
        question: 'Why does Bayu climb slowly?',
        options: [{ text: 'So the little cat stays safe.' }, { text: 'Because he is tired.' }, { text: 'Because the grandmother says so.' }, { text: 'He wants to see the house.' }],
        answer: 0,
        evidence: [2],
        clue: 'Dia memegang anak kucing itu dengan lembut. Kenapa harus hati-hati?',
      },
      {
        title: 'There You Are!',
        sceneEmoji: '🍪',
        lines: ['The grandmother laughs when she sees the kitten.', '"There you are, Coco!" she says.', 'She gives Dita and Bayu some cookies.'],
        question: 'Who is Coco?',
        options: [{ text: "The grandmother's cat" }, { text: "The grandmother's dog" }, { text: "Dita's friend" }, { text: 'The name of the hill' }],
        answer: 0,
        evidence: [0, 1],
        clue: 'Nenek itu bicara ke siapa saat bilang "There you are"?',
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
        title: 'A Metal Box',
        sceneEmoji: '🏗️',
        lines: ['Workers are fixing the old school playground.', 'They find a metal box under the ground.', 'On the lid, someone wrote: "Open in 50 years."', 'The date next to it is exactly 50 years ago today.'],
        question: 'Why can the students open the box today?',
        options: [{ text: 'Fifty years have passed.' }, { text: 'The workers broke the lid.' }, { text: 'The box is made of metal.' }, { text: 'It is the first day of school.' }],
        answer: 0,
        evidence: [2, 3],
        clue: 'Gabungkan tulisan di tutupnya dengan tanggal di sebelahnya.',
      },
      {
        title: 'Inside the Box',
        sceneEmoji: '📦',
        lines: ['Leo opens the box in front of his class.', 'He finds three photos, two letters and one key.', 'He gives one letter to his teacher.', 'He keeps everything else on his desk.'],
        question: "How many letters are on Leo's desk now?",
        options: [{ text: 'One' }, { text: 'Two' }, { text: 'Three' }, { text: 'None' }],
        answer: 0,
        evidence: [1, 2, 3],
        clue: 'Ada berapa surat, lalu berapa yang diberikan?',
      },
      {
        title: 'The Letter',
        sceneEmoji: '✉️',
        lines: ['The letter says: "We planted a tree near the old well."', '"Under the tree, there is a second box."', 'The school map shows three trees.', 'Only one of them is next to the well.'],
        question: 'Where is the second box?',
        options: [{ text: 'Below the tree by the well.' }, { text: 'Under all three trees.' }, { text: 'Inside the old well.' }, { text: 'Next to the school map.' }],
        answer: 0,
        evidence: [0, 1, 3],
        clue: 'Surat menyebut pohonnya di mana, dan kotaknya di mana?',
      },
      {
        title: 'The Second Box',
        sceneEmoji: '🔑',
        lines: ['The students dig under the right tree.', 'They find a small wooden box.', 'The key from the first box opens it.', 'Inside, there is a class photo from 50 years ago.'],
        question: 'Why was there a key in the first box?',
        options: [{ text: 'To open the second box.' }, { text: 'To open the school door.' }, { text: 'To lock the class photo.' }, { text: 'To dig under the tree.' }],
        answer: 0,
        evidence: [2],
        clue: 'Kunci itu akhirnya bisa membuka apa?',
      },
      {
        title: 'Your Turn',
        sceneEmoji: '🎉',
        lines: ['The old photo shows students holding a new box.', 'On the back, they wrote: "Now it is your turn."', "Leo's class smiles and starts to plan.", 'What will they leave for the future?'],
        question: "What will Leo's class probably do next?",
        options: [{ text: 'Bury their own time capsule.' }, { text: 'Take the old photo home.' }, { text: 'Plant three new trees.' }, { text: 'Close the school.' }],
        answer: 0,
        evidence: [1, 3],
        clue: '"Your turn" untuk melakukan apa, kalau dilihat dari seluruh cerita?',
      },
    ],
  },
];
