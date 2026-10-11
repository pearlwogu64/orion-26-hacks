// App frame: sidebar on wide screens (web/laptop), bottom tab bar on phones.
import { ReactNode } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { colors } from "../lib/theme";
import { DISCLAIMER } from "../lib/config";

const NAV = [
  { path: "/", label: "Inspect Studio", short: "Inspect", icon: "◎" },
  { path: "/results", label: "Freshness Verdict", short: "Verdict", icon: "◐" },
  { path: "/kitchen", label: "Rescue Kitchen", short: "Kitchen", icon: "✦" },
  { path: "/impact", label: "Impact Dashboard", short: "Impact", icon: "▲" },
];

export default function Shell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const go = (path: string) => {
    if (path !== pathname) router.replace(path as any);
  };

  const content = (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.content, wide && styles.contentWide]}>
        {children}
        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      </ScrollView>
      {footer}
    </View>
  );

  if (wide) {
    return (
      <View style={styles.row}>
        <View style={styles.sidebar}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>R</Text>
            </View>
            <Text style={styles.brandName}>Ripe</Text>
          </View>
          {NAV.map((n) => {
            const active = pathname === n.path;
            return (
              <TouchableOpacity
                key={n.path}
                onPress={() => go(n.path)}
                style={[styles.navItem, active && styles.navItemActive]}
              >
                <Text style={[styles.navIcon, active && styles.navTextActive]}>{n.icon}</Text>
                <Text style={[styles.navText, active && styles.navTextActive]}>{n.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {content}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {content}
      <View style={styles.tabBar}>
        {NAV.map((n) => {
          const active = pathname === n.path;
          return (
            <TouchableOpacity key={n.path} onPress={() => go(n.path)} style={styles.tab}>
              <Text style={[styles.tabIcon, active && { color: colors.primary }]}>{n.icon}</Text>
              <Text style={[styles.tabText, active && { color: colors.primary, fontWeight: "700" }]}>
                {n.short}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: "row", backgroundColor: colors.bg },
  sidebar: {
    width: 230, backgroundColor: colors.card, borderRightWidth: 1, borderRightColor: colors.border,
    paddingHorizontal: 14, paddingTop: 20,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28, paddingHorizontal: 6 },
  logo: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.mint, fontWeight: "800", fontSize: 16 },
  brandName: { fontSize: 20, fontWeight: "800", color: colors.text },
  navItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  navItemActive: { backgroundColor: colors.primary },
  navIcon: { fontSize: 14, color: colors.muted, width: 16, textAlign: "center" },
  navText: { fontSize: 14, color: colors.text, fontWeight: "500" },
  navTextActive: { color: colors.primaryText, fontWeight: "700" },
  content: { padding: 18, paddingBottom: 40, width: "100%", maxWidth: 1100, alignSelf: "center" },
  contentWide: { padding: 28 },
  disclaimer: { marginTop: 24, fontSize: 12, color: colors.muted, textAlign: "center" },
  tabBar: {
    flexDirection: "row", backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    paddingBottom: 18, paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 16, color: colors.muted },
  tabText: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
