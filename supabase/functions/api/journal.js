// Work journal (Lolipop edition only, signed-in players).
// Pure helpers: validate what the page sends and shape rows for the page.
// Database access lives in index.ts.
import { GameError, fail, exactKeys } from './game/rules.js';
import { jstDay } from './passenger-talk.js';

export const JOURNAL_LIMITS = { body: 4000, note: 200, goal: 120, task: 120, entries: 80, listDays: 30 };
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/;
const LINE_BREAK = /[\r\n]/;

export function validDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function journalDay(value, now = new Date()) {
  if (value === undefined || value === null || value === '') return jstDay(now);
  if (!validDay(value)) fail('BAD_DAY', '日付の形式を確認してください。');
  return value;
}
function text(value, max, { multiline = false, label }) {
  if (typeof value !== 'string') fail('BAD_INPUT', `${label}を確認してください。`);
  const trimmed = value.replace(/\r\n?/g, '\n').trim();
  if ([...trimmed].length > max) fail('TOO_LONG', `${label}は${max}文字までです。`);
  if (CONTROL.test(trimmed.replace(/\n/g, '')) || (!multiline && LINE_BREAK.test(trimmed))) fail('BAD_INPUT', `${label}に使えない文字が含まれています。`);
  return trimmed;
}

// One POST /journal body -> the change to make. Entries always land on today's page (JST);
// notes and the memo may be edited on any day.
export function journalCommand(input, { now = new Date(), id }) {
  exactKeys(input, ['action', 'day', 'seconds', 'goal', 'text', 'entryId', 'note', 'body']);
  const today = jstDay(now), at = now.toISOString();
  switch (input.action) {
    case 'session': {
      exactKeys(input, ['action', 'seconds', 'goal']);
      if (!Number.isSafeInteger(input.seconds) || input.seconds < 5 || input.seconds > 86400) fail('BAD_INPUT', '作業時間を確認してください。');
      return { action: 'append', day: today, entry: { id, kind: 'session', at, seconds: input.seconds, goal: text(input.goal ?? '', JOURNAL_LIMITS.goal, { label: '目標' }), note: '' } };
    }
    case 'task': {
      exactKeys(input, ['action', 'text']);
      const task = text(input.text, JOURNAL_LIMITS.task, { label: 'タスク' });
      if (!task) fail('BAD_INPUT', 'タスクを確認してください。');
      return { action: 'append', day: today, entry: { id, kind: 'task', at, text: task } };
    }
    case 'note': {
      exactKeys(input, ['action', 'day', 'entryId', 'note']);
      if (typeof input.entryId !== 'string' || !/^[a-zA-Z0-9_-]{8,80}$/.test(input.entryId)) fail('BAD_INPUT', '記録を確認してください。');
      return { action: 'note', day: journalDay(input.day, now), entryId: input.entryId, note: text(input.note, JOURNAL_LIMITS.note, { label: 'ひとこと' }) };
    }
    case 'body': {
      exactKeys(input, ['action', 'day', 'body']);
      return { action: 'body', day: journalDay(input.day, now), body: text(input.body, JOURNAL_LIMITS.body, { multiline: true, label: 'メモ' }) };
    }
    case 'delete-day': {
      exactKeys(input, ['action', 'day']);
      return { action: 'delete-day', day: journalDay(input.day, now) };
    }
    case 'delete-all': {
      exactKeys(input, ['action']);
      return { action: 'delete-all' };
    }
    default: throw new GameError('BAD_INPUT', '日誌の操作を確認してください。', 400);
  }
}

export function journalView(row, day) {
  return { day: row?.day ?? day, body: row?.body ?? '', entries: Array.isArray(row?.entries) ? row.entries : [], updatedAt: row?.updated_at ?? null };
}
export function journalSummary(row) {
  const entries = Array.isArray(row.entries) ? row.entries : [], sessions = entries.filter((e) => e.kind === 'session');
  return { day: row.day, sessions: sessions.length, focusSeconds: sessions.reduce((n, e) => n + (Number(e.seconds) || 0), 0), tasks: entries.filter((e) => e.kind === 'task').length, preview: String(row.body || '').split('\n')[0].slice(0, 60) };
}
