// Impact Dashboard: totals, level + XP, weekly streak, and the rescue ledger. All from scans logged on this device.
import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { colors, labelColors } from "../lib/theme";
import { getLog, getStats, clearLog, LogEntry, XP_PER_LEVEL } from "../lib/storage";
import Shell from "../components/Shell";
import { Card, Eyebrow, Pill, SectionTitle } from "../components/ui";

const LEVEL_NAMES = ["Sprout", "Seedling", "Pantry Guardian", "Waste Warrior", "Compost Captain", "Zero-Waste Legend"];

const CATEGORY_COLORS: Record<string, string> = {
  fruit: "#1E4D36",
  vegetable: "#3E8A5E",
  bread: "#C98F0A",
  other: "#A8EBBE",
};

export default function ImpactScreen() {
  const [log, setLog] = useState<LogEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      getLog().then(setLog);
    }, [])
  );

  const s = getStats(log);
  const levelName = LEVEL_NAMES[Math.min(s.level - 1, LEVEL_NAMES.length - 1)];
  const pct = Math.round((s.xpIntoLevel / XP_PER_LEVEL) * 100);

  const reset = () => {
    const doIt = async () => {
      await clearLog();
      setLog([]);
    };
    if (Platform.OS === "web") {
      if (window.confirm("Clear all logged rescues?")) doIt();
    } else {
      Alert.alert("Clear log?", "This removes all logged rescues.", [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: doIt },
      ]);
    }
  };

  const STATS = [
    { label: "CO2e avoided", value: `${s.co2}`, unit: "kg" },
    { label: "Money saved", value: `$${s.money.toFixed(2)}`, unit: "" },
    { label: "Items rescued", value: `${s.items}`, unit: "items" },
    { label: "Current streak", value: `${s.streak}`, unit: s.streak === 1 ? "day" : "days" },
  ];

  return (
    <Shell>
      <View style={styles.hero}>
        <Pill>Your impact</Pill>
        <Text style={styles.heroTitle}>Impact Dashboard</Text>
        <Text style={styles.heroSub}>Every item you log as saved adds to your totals, XP and streak.</Text>
      </View>

      <View style={styles.statGrid}>
        {STATS.map((st) => (
          <Card key={st.label} style={styles.stat}>
            <Eyebrow>{st.label}</Eyebrow>
            <Text style={styles.statValue}>
              {st.value}
              <Text style={styles.statUnit}> {st.unit}</Text>
            </Text>
          </Card>
        ))}
      </View>

      <View style={styles.twoCol}>
        {/* Level + streak */}
        <Card style={styles.colCard}>
          <View style={styles.levelHead}>
            <View>
              <Eyebrow>Gamified stewardship</Eyebrow>
              <SectionTitle>{levelName}</SectionTitle>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Level {s.level}</Text>
            </View>
          </View>

          <View style={styles.xpBox}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>
                Progress to Level {s.level + 1}
              </Text>
              <Text style={styles.xpNum}>
                {s.xpIntoLevel} / {XP_PER_LEVEL} XP
              </Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.xpHint}>+10 XP per rescue · +5 bonus when you eat or cook it</Text>
          </View>

          <Eyebrow>Zero-waste streak</Eyebrow>
          <View style={styles.week}>
            {s.week.map((d, i) => (
              <View key={i} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{d.label}</Text>
                <View
                  style={[
                    styles.dayBox,
                    d.done && styles.dayDone,
                    d.isToday && !d.done && styles.dayToday,
                  ]}
                >
                  <Text style={[styles.dayMark, d.done && { color: colors.mint }]}>{d.done ? "✓" : "·"}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Category breakdown */}
        <Card style={styles.colCard}>
          <Eyebrow>Rescue breakdown</Eyebrow>
          <SectionTitle>What you've saved</SectionTitle>
          {s.items === 0 ? (
            <Text style={styles.muted}>Log your first rescue to see this fill up.</Text>
          ) : (
            Object.entries(s.categories).map(([cat, count]) => {
              const share = Math.round((count / s.items) * 100);
              return (
                <View key={cat} style={styles.catRow}>
                  <View style={styles.catTop}>
                    <Text style={styles.catName}>{cat}</Text>
                    <Text style={styles.catPct}>{share}% · {count}</Text>
                  </View>
                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, { width: `${share}%`, backgroundColor: CATEGORY_COLORS[cat] ?? colors.primary }]} />
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </View>

      {/* Ledger */}
      <Card style={{ marginTop: 14 }}>
        <View style={styles.ledgerHead}>
          <View>
            <Eyebrow>History</Eyebrow>
            <SectionTitle>Rescue ledger</SectionTitle>
          </View>
          {log.length > 0 && (
            <TouchableOpacity style={styles.outlineBtn} onPress={reset}>
              <Text style={styles.outlineBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        {log.length === 0 ? (
          <Text style={styles.muted}>No rescues yet. Scan something and tap "Log saved item."</Text>
        ) : (
          log.slice(0, 15).map((e) => (
            <View key={e.id} style={styles.ledgerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ledgerName}>{e.name}</Text>
                <Text style={styles.ledgerDate}>
                  {new Date(e.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  {"  ·  "}
                  <Text style={{ color: labelColors[e.label] }}>score {e.score}</Text>
                </Text>
              </View>
              <Text style={styles.ledgerAction}>{e.action}</Text>
              <Text style={styles.ledgerMoney}>${e.money.toFixed(2)}</Text>
              <Text style={styles.ledgerCo2}>{e.co2} kg</Text>
            </View>
          ))
        )}
      </Card>
    </Shell>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: 14, color: colors.muted, marginTop: 10 },
  hero: { backgroundColor: colors.primary, borderRadius: 22, padding: 24 },
  heroTitle: { fontSize: 30, fontWeight: "800", color: "#FFFFFF", marginTop: 10 },
  heroSub: { fontSize: 14, color: "#C9E6D3", marginTop: 6 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 14 },
  stat: { flexGrow: 1, flexBasis: 160 },
  statValue: { fontSize: 30, fontWeight: "800", color: colors.text, marginTop: 8 },
  statUnit: { fontSize: 14, fontWeight: "500", color: colors.muted },
  twoCol: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 14 },
  colCard: { flexGrow: 1, flexBasis: 320 },
  levelHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  levelBadge: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  levelBadgeText: { color: colors.mint, fontWeight: "800", fontSize: 13 },
  xpBox: { backgroundColor: colors.soft, borderRadius: 14, padding: 14, marginVertical: 16 },
  xpRow: { flexDirection: "row", justifyContent: "space-between" },
  xpLabel: { fontSize: 13, fontWeight: "700", color: colors.text },
  xpNum: { fontSize: 13, fontWeight: "700", color: colors.primary },
  xpTrack: { height: 10, borderRadius: 5, backgroundColor: colors.border, marginTop: 10, overflow: "hidden" },
  xpFill: { height: 10, borderRadius: 5, backgroundColor: colors.primary },
  xpHint: { fontSize: 11, color: colors.muted, marginTop: 8 },
  week: { flexDirection: "row", gap: 6, marginTop: 10 },
  dayCol: { flex: 1, alignItems: "center" },
  dayLabel: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  dayBox: {
    width: "100%", aspectRatio: 0.8, maxWidth: 46, borderRadius: 10, backgroundColor: colors.soft,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border,
  },
  dayDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayToday: { borderColor: colors.primary, borderWidth: 2 },
  dayMark: { fontSize: 16, fontWeight: "800", color: colors.muted },
  catRow: { marginTop: 14 },
  catTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: "700", color: colors.text, textTransform: "capitalize" },
  catPct: { fontSize: 13, color: colors.muted },
  catTrack: { height: 10, borderRadius: 5, backgroundColor: colors.soft, overflow: "hidden" },
  catFill: { height: 10, borderRadius: 5 },
  ledgerHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  ledgerRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  ledgerName: { fontSize: 15, fontWeight: "700", color: colors.text, textTransform: "capitalize" },
  ledgerDate: { fontSize: 12, color: colors.muted, marginTop: 2 },
  ledgerAction: {
    fontSize: 12, fontWeight: "700", color: colors.mintText, backgroundColor: "#E7F8EC",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, textTransform: "capitalize", overflow: "hidden",
  },
  ledgerMoney: { fontSize: 14, fontWeight: "700", color: colors.text, width: 60, textAlign: "right" },
  ledgerCo2: { fontSize: 13, color: colors.primary, fontWeight: "600", width: 64, textAlign: "right" },
  outlineBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  outlineBtnText: { color: colors.text, fontWeight: "600", fontSize: 13 },
});
