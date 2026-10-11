// Saves scans on the device so the Impact Dashboard, levels and streak work.
// Needs: npx expo install @react-native-async-storage/async-storage
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SuccessResult } from "./types";

const LOG_KEY = "ripe_log";
const LAST_KEY = "ripe_last_result";

export interface LogEntry {
  id: string;
  date: string; // ISO timestamp
  name: string;
  category: string;
  score: number;
  label: string;
  action: string;
  co2: number;
  money: number;
}

export const XP_PER_LEVEL = 100;

// ---------- last scanned result (so Verdict and Kitchen work from the sidebar) ----------

export async function saveLastResult(result: SuccessResult, uri: string) {
  await AsyncStorage.setItem(LAST_KEY, JSON.stringify({ result, uri }));
}

export async function getLastResult(): Promise<{ result: SuccessResult; uri: string } | null> {
  const raw = await AsyncStorage.getItem(LAST_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ---------- rescue log ----------

export async function getLog(): Promise<LogEntry[]> {
  const raw = await AsyncStorage.getItem(LOG_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function logSavedItem(result: SuccessResult): Promise<LogEntry[]> {
  const log = await getLog();
  const entry: LogEntry = {
    id: String(Date.now()),
    date: new Date().toISOString(),
    name: result.item.name,
    category: result.item.category,
    score: result.freshness.score,
    label: result.freshness.label,
    action: result.recommendation.action,
    co2: result.impact.co2_saved_kg,
    money: result.impact.money_saved_usd,
  };
  const next = [entry, ...log];
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next));
  return next;
}

export async function clearLog() {
  await AsyncStorage.removeItem(LOG_KEY);
}

// ---------- stats, XP, levels, streak ----------

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getStats(log: LogEntry[]) {
  let co2 = 0;
  let money = 0;
  let xp = 0;
  for (const e of log) {
    co2 += e.co2;
    money += e.money;
    // 10 XP for every rescue, +5 bonus if it got eaten or cooked instead of composted
    xp += 10 + (e.action === "eat" || e.action === "cook" ? 5 : 0);
  }

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;

  // Which days have at least one log
  const days = new Set(log.map((e) => dayKey(new Date(e.date))));

  // Streak: count back from today (or yesterday, so the streak isn't "broken" before you scan today)
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Last 7 days, oldest first, for the streak tracker
  const week: { label: string; done: boolean; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    week.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      done: days.has(dayKey(d)),
      isToday: i === 0,
    });
  }

  // Count per category
  const categories: Record<string, number> = {};
  for (const e of log) categories[e.category] = (categories[e.category] || 0) + 1;

  return {
    co2: Math.round(co2 * 100) / 100,
    money: Math.round(money * 100) / 100,
    items: log.length,
    xp,
    level,
    xpIntoLevel,
    streak,
    week,
    categories,
  };
}
