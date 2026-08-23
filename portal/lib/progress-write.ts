import { db } from './db';

/**
 * Write/read path untuk skema progres terstruktur — desain lengkap & alasan
 * tiap keputusan: lihat TRD.md (§7 write path, §8 read path). Ringkasan:
 * localStorage (`app/src/progress.ts` `Store`) tetap sumber kebenaran
 * offline; endpoint di sini murni upsert snapshot itu ke tabel per-anak
 * (self-healing, idempotent) + insert log `learning_events` (dedup by
 * client-generated id) + recompute rollup harian dari log yang ter-dedup.
 *
 * `round` di skema DISEDIAKAN untuk "Ulangi Modul" nanti, tapi belum ada
 * tombolnya di UI — semua tempat di sini mengasumsikan round selalu 1
 * (client juga selalu mengirim 1), jadi SQL di bawah tidak perlu cabang
 * "round baru vs lama" dari TRD §7.2 secara eksplisit; begitu ada tombol
 * "Ulangi", tinggal tambah `GREATEST`/`WHERE round>=` di query slot.
 */

export interface SlotStateInput {
  st: 0 | 1 | 2;
  ok?: 1;
  lc?: 0 | 1;
  n?: number;
  w?: number;
  h?: 1;
  sc?: number;
  a?: ('l' | 'm' | 'g')[];
  ir?: string;
  t?: number;
}

export interface SectionStateInput {
  round?: number;
  seed?: number;
  plan?: { kind: string; item: number }[] | null;
  cursor?: number;
  slots?: Record<string, SlotStateInput>;
}

export interface StoreInput {
  done?: unknown;
  last?: { skill?: string; topicIndex?: number } | null;
  bossCleared?: unknown;
  xp?: number;
  activeDays?: unknown;
  correctAttempts?: number;
  totalAttempts?: number;
  name?: string;
  avatar?: string;
  sections?: Record<string, SectionStateInput>;
}

export interface LearningEventInput {
  id: string;
  kind: string;
  occurredAt: string;
  localDay: string;
  localHour: number;
  level?: string;
  skill?: string;
  topicId?: string;
  section?: string;
  slot?: number;
  round?: number;
  itemIndex?: number;
  itemRef?: string;
  activity?: string;
  graded?: boolean;
  correct?: boolean;
  score?: number;
  hintUsed?: boolean;
  attemptNo?: number;
  durationMs?: number;
  xpAwarded?: number;
  detail?: unknown;
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const isDateStr = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Section key dari `Store.sections` (`${skill}:${topicId}:${section}`) —
 *  di-split balik jadi 3 kolom. `topicId` boleh berisi `:` (belum ada di
 *  konten sekarang, tapi dijaga: split cuma di 2 pemisah PERTAMA). */
function parseSectionKey(key: string): { skill: string; topicId: string; section: string } | null {
  const first = key.indexOf(':');
  const last = key.lastIndexOf(':');
  if (first === -1 || last === -1 || first === last) return null;
  return { skill: key.slice(0, first), topicId: key.slice(first + 1, last), section: key.slice(last + 1) };
}

/**
 * Proyeksikan snapshot `Store` client ke semua tabel STATE (self-healing —
 * aman dipanggil berkali-kali/telat/duplikat, TRD.md §7). Dijalankan dalam
 * 1 transaksi interaktif supaya "1 request = 1 transaksi Postgres" (§7.0).
 */
export async function upsertStoreSnapshot(childId: string, level: string | null, data: StoreInput): Promise<void> {
  await db.$transaction(async (tx) => {
    // (a) child_progress_state — counter monoton + posisi terakhir (LWW).
    const last = data.last ?? null;
    await tx.$executeRaw`
      INSERT INTO child_progress_state AS s
        (id, child_id, xp, correct_attempts, total_attempts, nickname, avatar,
         last_skill, last_topic_id, last_topic_index, last_level, client_updated_at, updated_at)
      VALUES
        (gen_random_uuid(), ${childId}, ${data.xp ?? 0}, ${data.correctAttempts ?? 0}, ${data.totalAttempts ?? 0},
         ${data.name ?? null}, ${data.avatar ?? null},
         ${last?.skill ?? null}, ${null}, ${last?.topicIndex ?? null}, ${level},
         now(), now())
      ON CONFLICT (child_id) DO UPDATE SET
        xp               = GREATEST(s.xp, EXCLUDED.xp),
        total_attempts   = GREATEST(s.total_attempts, EXCLUDED.total_attempts),
        correct_attempts = CASE WHEN EXCLUDED.total_attempts >= s.total_attempts
                                THEN EXCLUDED.correct_attempts ELSE s.correct_attempts END,
        nickname         = COALESCE(EXCLUDED.nickname, s.nickname),
        avatar           = COALESCE(EXCLUDED.avatar, s.avatar),
        last_skill       = COALESCE(EXCLUDED.last_skill, s.last_skill),
        last_topic_index = COALESCE(EXCLUDED.last_topic_index, s.last_topic_index),
        last_level       = COALESCE(EXCLUDED.last_level, s.last_level),
        client_updated_at = now(),
        updated_at        = now()
    `;

    // (b) topic_completions — set `done`.
    for (const tag of strings(data.done)) {
      const sep = tag.indexOf(':');
      if (sep === -1) continue;
      const skill = tag.slice(0, sep);
      const topicId = tag.slice(sep + 1);
      await tx.$executeRaw`
        INSERT INTO topic_completions (id, child_id, skill, topic_id, level, first_done_at, last_done_at)
        VALUES (gen_random_uuid(), ${childId}, ${skill}, ${topicId}, ${level}, now(), now())
        ON CONFLICT (child_id, skill, topic_id) DO UPDATE SET
          last_done_at = now(),
          level = COALESCE(topic_completions.level, EXCLUDED.level)
      `;
    }

    // (c) boss_clearances — set `bossCleared`.
    for (const lvl of strings(data.bossCleared)) {
      await tx.$executeRaw`
        INSERT INTO boss_clearances (id, child_id, level, cleared_at)
        VALUES (gen_random_uuid(), ${childId}, ${lvl}, now())
        ON CONFLICT (child_id, level) DO NOTHING
      `;
    }

    // (d) child_daily_stats — presence-only untuk `activeDays` (TIDAK
    // menyentuh counter — itu tugas `recomputeDailyStats` dari event log).
    for (const day of strings(data.activeDays)) {
      if (!isDateStr(day)) continue;
      await tx.$executeRaw`
        INSERT INTO child_daily_stats (id, child_id, day, recomputed_at)
        VALUES (gen_random_uuid(), ${childId}, ${day}, now())
        ON CONFLICT (child_id, day) DO NOTHING
      `;
    }

    // (e) child_section_progress + child_item_progress.
    const sections = data.sections && typeof data.sections === 'object' ? data.sections : {};
    for (const [key, section] of Object.entries(sections)) {
      const parsed = parseSectionKey(key);
      if (!parsed || !section) continue;
      const { skill, topicId, section: sectionName } = parsed;
      const slots = section.slots && typeof section.slots === 'object' ? section.slots : {};
      const slotCount = Object.keys(slots).length;

      await tx.$executeRaw`
        INSERT INTO child_section_progress
          (id, child_id, level, skill, topic_id, section, round, plan, plan_seed,
           slot_count, cursor_slot, client_updated_at, updated_at)
        VALUES
          (gen_random_uuid(), ${childId}, ${level ?? ''}, ${skill}, ${topicId}, ${sectionName},
           ${section.round ?? 1}, ${section.plan ? JSON.stringify(section.plan) : null}::jsonb, ${section.seed ?? null},
           ${slotCount}, ${section.cursor ?? 0}, now(), now())
        ON CONFLICT (child_id, skill, topic_id, section) DO UPDATE SET
          plan         = COALESCE(child_section_progress.plan, EXCLUDED.plan),
          plan_seed    = COALESCE(child_section_progress.plan_seed, EXCLUDED.plan_seed),
          slot_count   = GREATEST(child_section_progress.slot_count, EXCLUDED.slot_count),
          cursor_slot  = EXCLUDED.cursor_slot,
          client_updated_at = now(),
          updated_at        = now()
      `;

      for (const [slotStr, slot] of Object.entries(slots)) {
        const slotNum = Number(slotStr);
        if (!Number.isFinite(slotNum) || !slot) continue;
        const listenedAt = slot.a?.includes('l') ? new Date() : null;
        const micAt = slot.a?.includes('m') ? new Date() : null;
        const gameAt = slot.a?.includes('g') ? new Date() : null;
        const answered = (slot.st ?? 0) >= 2;

        await tx.$executeRaw`
          INSERT INTO child_item_progress
            (id, child_id, skill, topic_id, section, slot, round, level, item_ref, status,
             ever_correct, last_correct, best_score, attempt_count, wrong_count, hint_used,
             listened_at, mic_at, game_at, first_answered_at, last_answered_at, updated_at)
          VALUES
            (gen_random_uuid(), ${childId}, ${skill}, ${topicId}, ${sectionName}, ${slotNum}, 1, ${level}, ${slot.ir ?? null},
             ${slot.st ?? 0}, ${slot.ok === 1}, ${slot.lc === undefined ? null : slot.lc === 1}, ${slot.sc ?? null},
             ${slot.n ?? 0}, ${slot.w ?? 0}, ${slot.h === 1},
             ${listenedAt}, ${micAt}, ${gameAt},
             ${answered ? new Date() : null}, ${answered ? new Date() : null}, now())
          ON CONFLICT (child_id, skill, topic_id, section, slot) DO UPDATE SET
            item_ref          = COALESCE(EXCLUDED.item_ref, child_item_progress.item_ref),
            status            = GREATEST(child_item_progress.status, EXCLUDED.status),
            ever_correct      = child_item_progress.ever_correct OR EXCLUDED.ever_correct,
            last_correct      = COALESCE(EXCLUDED.last_correct, child_item_progress.last_correct),
            best_score        = GREATEST(COALESCE(child_item_progress.best_score, 0), COALESCE(EXCLUDED.best_score, 0)),
            attempt_count     = GREATEST(child_item_progress.attempt_count, EXCLUDED.attempt_count),
            wrong_count       = GREATEST(child_item_progress.wrong_count, EXCLUDED.wrong_count),
            hint_used         = child_item_progress.hint_used OR EXCLUDED.hint_used,
            listened_at       = LEAST(COALESCE(child_item_progress.listened_at, EXCLUDED.listened_at), COALESCE(EXCLUDED.listened_at, child_item_progress.listened_at)),
            mic_at            = LEAST(COALESCE(child_item_progress.mic_at, EXCLUDED.mic_at), COALESCE(EXCLUDED.mic_at, child_item_progress.mic_at)),
            game_at           = LEAST(COALESCE(child_item_progress.game_at, EXCLUDED.game_at), COALESCE(EXCLUDED.game_at, child_item_progress.game_at)),
            first_answered_at = LEAST(COALESCE(child_item_progress.first_answered_at, EXCLUDED.first_answered_at), COALESCE(EXCLUDED.first_answered_at, child_item_progress.first_answered_at)),
            last_answered_at  = GREATEST(COALESCE(child_item_progress.last_answered_at, EXCLUDED.last_answered_at), COALESCE(EXCLUDED.last_answered_at, child_item_progress.last_answered_at)),
            updated_at        = now()
        `;
      }

      // Rollup section: dihitung dari child_item_progress (≤10 baris).
      await tx.$executeRaw`
        UPDATE child_section_progress csp SET
          answered_slots = agg.answered,
          correct_slots  = agg.correct,
          completed_at   = CASE WHEN agg.answered >= csp.slot_count AND csp.slot_count > 0
                                THEN COALESCE(csp.completed_at, now()) ELSE csp.completed_at END
        FROM (
          SELECT count(*) FILTER (WHERE status = 2) AS answered,
                 count(*) FILTER (WHERE ever_correct) AS correct
          FROM child_item_progress
          WHERE child_id = ${childId} AND skill = ${skill} AND topic_id = ${topicId} AND section = ${sectionName}
        ) agg
        WHERE csp.child_id = ${childId} AND csp.skill = ${skill} AND csp.topic_id = ${topicId} AND csp.section = ${sectionName}
      `;
    }
  });
}

/** Insert log mentah (dedup by client id) — TIDAK dalam transaksi yang sama
 *  dengan snapshot (kegagalan di sini tidak boleh membatalkan state di
 *  atas, TRD.md §3: progres tidak pernah bergantung pada log). */
export async function insertLearningEvents(childId: string, events: LearningEventInput[]): Promise<string[]> {
  const touchedDays = new Set<string>();
  for (const e of events) {
    if (!e || typeof e.id !== 'string' || typeof e.kind !== 'string') continue;
    if (!isDateStr(e.localDay)) continue;
    touchedDays.add(e.localDay);
    await db.$executeRaw`
      INSERT INTO learning_events
        (id, child_id, kind, occurred_at, local_day, local_hour, level, skill, topic_id, section,
         slot, round, item_index, item_ref, activity, graded, correct, score, hint_used,
         attempt_no, duration_ms, xp_awarded, detail, received_at)
      VALUES
        (${e.id}::uuid, ${childId}, ${e.kind}, ${new Date(e.occurredAt)}, ${e.localDay}, ${e.localHour},
         ${e.level ?? null}, ${e.skill ?? null}, ${e.topicId ?? null}, ${e.section ?? null},
         ${e.slot ?? null}, ${e.round ?? null}, ${e.itemIndex ?? null}, ${e.itemRef ?? null}, ${e.activity ?? null},
         ${e.graded ?? true}, ${e.correct ?? null}, ${e.score ?? null}, ${e.hintUsed ?? false},
         ${e.attemptNo ?? 1}, ${e.durationMs ?? null}, ${e.xpAwarded ?? 0},
         ${e.detail ? JSON.stringify(e.detail) : null}::jsonb, now())
      ON CONFLICT (id) DO NOTHING
    `;
  }
  return Array.from(touchedDays);
}

/** Recompute (BUKAN increment — idempotent terhadap retry/duplikat/urutan
 *  terbalik, TRD.md §7.2) rollup 1 hari dari `learning_events` yang sudah
 *  ter-dedup. Dipanggil untuk tiap `local_day` yang tersentuh di batch ini. */
export async function recomputeDailyStats(childId: string, day: string): Promise<void> {
  await db.$executeRaw`
    WITH ev AS (
      SELECT * FROM learning_events WHERE child_id = ${childId} AND local_day = ${day}
    ), agg AS (
      SELECT count(*) FILTER (WHERE kind = 'answer')                     AS attempts,
             count(*) FILTER (WHERE kind = 'answer' AND correct)         AS correct,
             count(*) FILTER (WHERE hint_used)                          AS hints_used,
             count(*) FILTER (WHERE kind = 'speak')                     AS mic_attempts,
             COALESCE(sum(score) FILTER (WHERE kind = 'speak'), 0)       AS mic_score_sum,
             count(*) FILTER (WHERE kind = 'topic_done')                 AS topics_done,
             COALESCE(sum(xp_awarded), 0)                                AS xp_gained,
             min(occurred_at) AS first_at, max(occurred_at) AS last_at
      FROM ev
    ), hist AS (
      SELECT COALESCE(jsonb_object_agg(local_hour, n), '{}'::jsonb) AS hour_histogram
      FROM (SELECT local_hour, count(*) AS n FROM ev GROUP BY local_hour) x
    )
    INSERT INTO child_daily_stats
      (id, child_id, day, attempts, correct, hints_used, mic_attempts, mic_score_sum,
       topics_done, xp_gained, hour_histogram, first_event_at, last_event_at, recomputed_at)
    SELECT gen_random_uuid(), ${childId}, ${day}, agg.attempts, agg.correct, agg.hints_used,
           agg.mic_attempts, agg.mic_score_sum, agg.topics_done, agg.xp_gained, hist.hour_histogram,
           agg.first_at, agg.last_at, now()
    FROM agg, hist
    ON CONFLICT (child_id, day) DO UPDATE SET
      attempts = EXCLUDED.attempts, correct = EXCLUDED.correct, hints_used = EXCLUDED.hints_used,
      mic_attempts = EXCLUDED.mic_attempts, mic_score_sum = EXCLUDED.mic_score_sum,
      topics_done = EXCLUDED.topics_done, xp_gained = EXCLUDED.xp_gained,
      hour_histogram = EXCLUDED.hour_histogram,
      first_event_at = LEAST(COALESCE(child_daily_stats.first_event_at, EXCLUDED.first_event_at), COALESCE(EXCLUDED.first_event_at, child_daily_stats.first_event_at)),
      last_event_at  = GREATEST(COALESCE(child_daily_stats.last_event_at, EXCLUDED.last_event_at), COALESCE(EXCLUDED.last_event_at, child_daily_stats.last_event_at)),
      recomputed_at  = now()
  `;
}

/* ------------------------------------------------------------- read path -- */

/** Rangkai ulang bentuk `Store` (§8.1) — kontrak `GET /api/progress` TETAP
 *  sama byte-nya supaya `app/src/progress.ts` `mergeFromServer` tidak perlu
 *  tahu apa pun soal perubahan skema ini. */
export async function rebuildStoreForChild(childId: string): Promise<Record<string, unknown> | null> {
  const [state, topics, bosses, days, sections, items] = await Promise.all([
    db.childProgressState.findUnique({ where: { childId } }),
    db.topicCompletion.findMany({ where: { childId } }),
    db.bossClearance.findMany({ where: { childId } }),
    db.childDailyStat.findMany({ where: { childId }, orderBy: { day: 'desc' }, take: 60 }),
    db.childSectionProgress.findMany({ where: { childId } }),
    db.childItemProgress.findMany({ where: { childId } }),
  ]);

  if (!state && topics.length === 0 && bosses.length === 0 && sections.length === 0) return null;

  const sectionsOut: Record<string, SectionStateInput> = {};
  for (const s of sections) {
    sectionsOut[`${s.skill}:${s.topicId}:${s.section}`] = {
      round: s.round,
      seed: s.planSeed ?? undefined,
      plan: (s.plan as { kind: string; item: number }[] | null) ?? undefined,
      cursor: s.cursorSlot,
      slots: {},
    };
  }
  for (const it of items) {
    const key = `${it.skill}:${it.topicId}:${it.section}`;
    const bucket = (sectionsOut[key] ??= { round: 1, cursor: 0, slots: {} });
    const actions: ('l' | 'm' | 'g')[] = [];
    if (it.listenedAt) actions.push('l');
    if (it.micAt) actions.push('m');
    if (it.gameAt) actions.push('g');
    bucket.slots![String(it.slot)] = {
      st: it.status as 0 | 1 | 2,
      ok: it.everCorrect ? 1 : undefined,
      lc: it.lastCorrect === null || it.lastCorrect === undefined ? undefined : it.lastCorrect ? 1 : 0,
      n: it.attemptCount || undefined,
      w: it.wrongCount || undefined,
      h: it.hintUsed ? 1 : undefined,
      sc: it.bestScore ?? undefined,
      a: actions.length ? actions : undefined,
      ir: it.itemRef ?? undefined,
    };
  }

  // wordInteractions LEGACY, dibaca balik dari section 'kenalan' supaya
  // klien lama (kalau ada) tetap dapat sesuatu yang match tag lamanya.
  const wordInteractions: string[] = [];
  for (const it of items) {
    if (it.section !== 'kenalan') continue;
    if (it.listenedAt) wordInteractions.push(`${it.skill}:${it.topicId}:${it.slot}:listen`);
    if (it.micAt) wordInteractions.push(`${it.skill}:${it.topicId}:${it.slot}:mic`);
    if (it.gameAt) wordInteractions.push(`${it.skill}:${it.topicId}:${it.slot}:game`);
  }

  return {
    done: topics.map((t) => `${t.skill}:${t.topicId}`),
    last:
      state?.lastSkill && state.lastTopicIndex !== null
        ? { skill: state.lastSkill, topicIndex: state.lastTopicIndex }
        : null,
    bossCleared: bosses.map((b) => b.level),
    xp: state?.xp ?? 0,
    activeDays: days.map((d) => d.day),
    correctAttempts: state?.correctAttempts ?? 0,
    totalAttempts: state?.totalAttempts ?? 0,
    name: state?.nickname ?? '',
    avatar: state?.avatar ?? '',
    wordInteractions,
    sections: sectionsOut,
  };
}
