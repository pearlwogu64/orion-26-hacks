// Small shared pieces so every screen looks the same.
import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../lib/theme";

export function Card({ children, style }: { children: ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Pill({ children, dark, yellow }: { children: ReactNode; dark?: boolean; yellow?: boolean }) {
  return (
    <View style={[styles.pill, dark && { backgroundColor: colors.primary }, yellow && { backgroundColor: colors.yellow }]}>
      <Text style={[styles.pillText, dark && { color: colors.mint }, yellow && { color: colors.yellowText }]}>{children}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: colors.border,
  },
  eyebrow: { fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 1, textTransform: "uppercase" },
  pill: { backgroundColor: colors.mint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.mintText },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 4 },
});
