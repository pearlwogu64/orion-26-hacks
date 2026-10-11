// PLACEHOLDER. Frontend 2 replaces this whole file with the real design.
// The success JSON from the contract arrives as a string in params.result, and the photo as params.uri.
import { ScrollView, Text, Image, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors, labelColors } from "../lib/theme";
import { DISCLAIMER } from "../lib/config";
import type { SuccessResult } from "../lib/types";

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ uri: string; result: string }>();
  const result: SuccessResult = JSON.parse(params.result);
  const { item, freshness, analysis, recommendation, impact } = result;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: params.uri }} style={styles.photo} />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={[styles.score, { color: labelColors[freshness.label] }]}>
        {freshness.score}/100 ({freshness.label})
      </Text>
      <Text style={styles.line}>0 = perfectly fresh, 100 = spoiled</Text>
      <Text style={styles.line}>Confidence: {freshness.confidence}</Text>
      {freshness.confidence === "low" && (
        <Text style={styles.warn}>Not sure about this one. Try retaking the photo.</Text>
      )}
      <Text style={styles.line}>Days left: {freshness.estimated_days_left ?? "unknown"}</Text>

      <Text style={styles.head}>What we saw</Text>
      {analysis.visual_signs.map((s, i) => (
        <Text key={i} style={styles.line}>- {s}</Text>
      ))}
      <Text style={styles.line}>{analysis.summary}</Text>

      <Text style={styles.head}>What to do: {recommendation.action}</Text>
      {recommendation.tips.map((t, i) => (
        <Text key={i} style={styles.line}>- {t}</Text>
      ))}

      <Text style={styles.head}>Impact</Text>
      <Text style={styles.line}>
        CO2 saved: {impact.co2_saved_kg} kg, money saved: ${impact.money_saved_usd}
      </Text>

      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.bg },
  photo: { width: "100%", height: 220, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, textTransform: "capitalize" },
  score: { fontSize: 22, fontWeight: "700", marginVertical: 4 },
  head: { fontSize: 18, fontWeight: "700", marginTop: 16, color: colors.text },
  line: { fontSize: 15, color: colors.text, marginTop: 4 },
  warn: { fontSize: 15, color: colors.error, fontWeight: "600", marginTop: 6 },
  disclaimer: { marginTop: 24, fontSize: 13, color: colors.muted, textAlign: "center" },
});
