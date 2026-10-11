// PLACEHOLDER. Frontend 2 replaces this whole file with the real design.
// The success JSON from the contract arrives as a string in params.result, and the photo as params.uri.
import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, labelColors, labelNames } from "../lib/theme";
import type { SuccessResult } from "../lib/types";
import { getLastResult, logSavedItem } from "../lib/storage";
import Shell from "../components/Shell";
import { Card, Eyebrow, Pill } from "../components/ui";

// Matches the 4 labels in the contract
const TIERS = [
  { range: "0–30", name: "Crisp fresh", width: 30, color: "#1E4D36" },
  { range: "30–60", name: "Eat soon", width: 30, color: "#3E8A5E" },
  { range: "60–85", name: "Rescue & cook", width: 25, color: "#F5C842" },
  { range: "85–100", name: "Compost", width: 15, color: "#6B4423" },
];

const ACTION_TITLES: Record<string, string> = {
  eat: "Eat it now",
  cook: "Rescue & cook",
  store: "Store it right",
  compost: "Compost it",
};

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ uri: string; result: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [data, setData] = useState<{ result: SuccessResult; uri: string } | null>(
    params.result ? { result: JSON.parse(params.result), uri: params.uri } : null
  );
  const [loaded, setLoaded] = useState(!!params.result);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!params.result) {
      getLastResult().then((last) => {
        setData(last);
        setLoaded(true);
      });
    }
  }, []);

  if (!loaded) return <Shell><Text style={styles.muted}>Loading...</Text></Shell>;

  if (!data) {
    return (
      <Shell>
        <Card style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text style={styles.emptyTitle}>Scan something first</Text>
          <Text style={styles.muted}>Your freshness verdict shows up here after you inspect a photo.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => router.replace("/")}>
            <Text style={styles.primaryBtnText}>Go to Inspect Studio</Text>
          </TouchableOpacity>
        </Card>
      </Shell>
    );
  }

  const { result, uri } = data;
  const { item, freshness, analysis, recommendation, impact } = result;
  const labelColor = labelColors[freshness.label];
  const pos = Math.min(100, Math.max(0, freshness.score));
  const days = freshness.estimated_days_left;

  const onLog = async () => {
    if (logged) return;
    await logSavedItem(result);
    setLogged(true);
  };

  const footer = (
    <View style={styles.bar}>
      <View style={{ flex: 1, minWidth: 200 }}>
        <Text style={styles.barTitle}>{ACTION_TITLES[recommendation.action] ?? "Rescue it"}</Text>
        <Text style={styles.barSub}>
          Saves {impact.co2_saved_kg} kg CO2e and ${impact.money_saved_usd}
        </Text>
      </View>
      <TouchableOpacity style={styles.barGhost} onPress={onLog}>
        <Text style={styles.barGhostText}>{logged ? "Logged ✓  +XP" : "Log saved item"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.barMint} onPress={() => router.replace("/kitchen")}>
        <Text style={styles.barMintText}>See rescue recipes</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Shell footer={footer}>
      {/* Header */}
      <Card style={styles.header}>
        <Image source={{ uri }} style={styles.thumb} />
        <View style={{ flex: 1, minWidth: 180 }}>
          <Eyebrow>Freshness verdict</Eyebrow>
          <Text style={styles.title}>{item.name}</Text>
          <View style={styles.pillRow}>
            <Pill yellow>{item.category}</Pill>
            <Pill dark>{freshness.confidence} confidence</Pill>
          </View>
        </View>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => router.replace("/")}>
          <Text style={styles.outlineBtnText}>Rescan</Text>
        </TouchableOpacity>
      </Card>

      {freshness.confidence === "low" && (
        <Text style={styles.warn}>Not sure about this one. Try retaking the photo.</Text>
      )}

      <View style={[styles.grid, wide && { flexDirection: "row" }]}>
        {/* Left: score */}
        <Card style={[styles.col, wide && { flex: 1.2 }]}>
          <Eyebrow>Freshness index</Eyebrow>
          <View style={styles.ringWrap}>
            <View style={[styles.ring, { borderColor: labelColor }]}>
              <Text style={styles.ringScore}>
                {freshness.score}
                <Text style={styles.ringOf}>/100</Text>
              </Text>
              <View style={[styles.ringPill, { backgroundColor: labelColor }]}>
                <Text style={styles.ringPillText}>{labelNames[freshness.label]}</Text>
              </View>
            </View>
            <Text style={styles.small}>0 = perfectly fresh · 100 = spoiled</Text>
          </View>

          <View style={styles.window}>
            <View style={styles.windowIcon}>
              <Text style={{ fontSize: 18 }}>⏳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow>Sweet window</Eyebrow>
              <Text style={styles.windowText}>
                {days === null ? "Unknown" : days === 0 ? "Use today" : `${days} day${days === 1 ? "" : "s"} remaining`}
              </Text>
            </View>
          </View>

          <Eyebrow>Freshness spectrum</Eyebrow>
          <View style={styles.specWrap}>
            <View style={styles.specBar}>
              {TIERS.map((t) => (
                <View key={t.name} style={{ flex: t.width, backgroundColor: t.color }} />
              ))}
            </View>
            <View style={[styles.marker, { left: `${pos}%` }]} />
          </View>
          <View style={styles.specLabels}>
            {TIERS.map((t) => (
              <View key={t.name} style={{ flex: t.width }}>
                <Text style={styles.specRange}>{t.range}</Text>
                <Text style={styles.specName}>{t.name}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Right: insights + action */}
        <View style={[styles.col, wide && { flex: 1 }, { gap: 14 }]}>
          <Card>
            <Text style={styles.cardTitle}>Explainable AI insights</Text>
            {analysis.visual_signs.map((s, i) => (
              <View key={i} style={styles.insight}>
                <View style={[styles.insightDot, { backgroundColor: labelColor }]} />
                <Text style={styles.insightText}>{s}</Text>
              </View>
            ))}
            <Text style={styles.summary}>{analysis.summary}</Text>
          </Card>

          <Card style={styles.chef}>
            <Text style={styles.chefTitle}>{ACTION_TITLES[recommendation.action] ?? recommendation.action}</Text>
            {recommendation.tips.map((t, i) => (
              <Text key={i} style={styles.chefTip}>• {t}</Text>
            ))}
          </Card>
        </View>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 6 },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  header: { flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap", backgroundColor: colors.yellowSoft, borderColor: colors.yellow },
  thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: colors.border },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, textTransform: "capitalize", marginTop: 2 },
  pillRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  outlineBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  outlineBtnText: { fontSize: 14, fontWeight: "600", color: colors.text },
  warn: { fontSize: 15, color: colors.error, fontWeight: "600", marginTop: 12 },
  grid: { gap: 14, marginTop: 14 },
  col: {},
  ringWrap: { alignItems: "center", marginVertical: 16 },
  ring: {
    width: 190, height: 190, borderRadius: 95, borderWidth: 16,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  ringScore: { fontSize: 46, fontWeight: "800", color: colors.text },
  ringOf: { fontSize: 18, fontWeight: "500", color: colors.muted },
  ringPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  ringPillText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  small: { fontSize: 12, color: colors.muted },
  window: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.yellowSoft,
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  windowIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  windowText: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 2 },
  specWrap: { height: 22, justifyContent: "center", marginTop: 8 },
  specBar: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden" },
  marker: {
    position: "absolute", width: 4, height: 22, borderRadius: 2, marginLeft: -2,
    backgroundColor: colors.text,
  },
  specLabels: { flexDirection: "row", marginTop: 6 },
  specRange: { fontSize: 11, fontWeight: "700", color: colors.text },
  specName: { fontSize: 10, color: colors.muted },
  cardTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 6 },
  insight: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: colors.soft, borderRadius: 12, padding: 12, marginTop: 8 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  insightText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20, textTransform: "capitalize" },
  summary: { fontSize: 13, color: colors.muted, marginTop: 12, lineHeight: 19 },
  chef: { backgroundColor: "#E7F8EC", borderColor: colors.mint },
  chefTitle: { fontSize: 17, fontWeight: "800", color: colors.mintText, marginBottom: 4 },
  chefTip: { fontSize: 14, color: colors.mintText, marginTop: 5, lineHeight: 20 },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  primaryBtnText: { color: colors.primaryText, fontWeight: "700", fontSize: 15 },
  bar: {
    flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10,
    backgroundColor: colors.dark, margin: 12, borderRadius: 18, padding: 14,
  },
  barTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  barSub: { color: "#AEB8B2", fontSize: 12, marginTop: 2 },
  barGhost: { backgroundColor: colors.darkSoft, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  barGhostText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  barMint: { backgroundColor: colors.yellow, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  barMintText: { color: colors.yellowText, fontWeight: "800", fontSize: 14 },
});
