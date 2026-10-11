import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { checkHealth } from "../lib/api";
import { USE_MOCK } from "../lib/config";
import { colors } from "../lib/theme";
import Shell from "../components/Shell";
import { Card, Eyebrow, Pill } from "../components/ui";

const STEPS = [
  { n: "01", title: "Snap one item", body: "A single fruit, vegetable or bread in good light." },
  { n: "02", title: "Gemini reads it", body: "Color, spots, texture and mold become a 0–100 freshness score." },
  { n: "03", title: "Rescue it", body: "Get days left, what to do, and recipes before it goes to waste." },
];

export default function HomeScreen() {
  const router = useRouter();
  const [serverUp, setServerUp] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setServerUp);
  }, []);

  const pick = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow access in your phone settings to continue.");
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (!result.canceled) {
      router.push({ pathname: "/preview", params: { uri: result.assets[0].uri } });
    }
  };

  const dev = USE_MOCK
    ? "Dev: using mock data"
    : serverUp === null
    ? "Dev: checking server..."
    : serverUp
    ? "Dev: server online"
    : "Dev: server offline";

  return (
    <Shell>
      <Pill yellow>Powered by Gemini vision</Pill>
      <Text style={styles.title}>Inspect Studio</Text>
      <Text style={styles.sub}>Is it still fresh? Photograph one item to get a freshness score and a plan to rescue it.</Text>

      <View style={styles.hero}>
        <View style={styles.reticle}>
          <View style={styles.reticleInner} />
        </View>
        <Text style={styles.heroTitle}>Drop in a photo of your produce</Text>
        <Text style={styles.heroSub}>Fruit, vegetables or bread · one item per photo</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btn} onPress={() => pick(true)}>
            <Text style={styles.btnText}>Take a photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAlt} onPress={() => pick(false)}>
            <Text style={styles.btnAltText}>Upload photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.steps}>
        {STEPS.map((s) => (
          <Card key={s.n} style={styles.step}>
            <Eyebrow>Step {s.n}</Eyebrow>
            <Text style={styles.stepTitle}>{s.title}</Text>
            <Text style={styles.stepBody}>{s.body}</Text>
          </Card>
        ))}
      </View>

      <Text style={styles.dev}>{dev}</Text>
    </Shell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "800", color: colors.text, marginTop: 10 },
  sub: { fontSize: 15, color: colors.muted, marginTop: 6, maxWidth: 560, lineHeight: 22 },
  hero: {
    backgroundColor: colors.dark, borderRadius: 22, padding: 28, marginTop: 20,
    alignItems: "center", minHeight: 300, justifyContent: "center",
  },
  reticle: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: colors.mint,
    alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  reticleInner: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.yellow },
  heroTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  heroSub: { fontSize: 14, color: "#AEB8B2", marginTop: 6, textAlign: "center" },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 22, justifyContent: "center" },
  btn: { backgroundColor: colors.yellow, paddingVertical: 14, paddingHorizontal: 26, borderRadius: 12, minWidth: 170, alignItems: "center" },
  btnText: { color: colors.yellowText, fontSize: 16, fontWeight: "700" },
  btnAlt: { borderWidth: 1.5, borderColor: "#5A665F", paddingVertical: 14, paddingHorizontal: 26, borderRadius: 12, minWidth: 170, alignItems: "center" },
  btnAltText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  steps: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 18 },
  step: { flexGrow: 1, flexBasis: 220, borderTopWidth: 4, borderTopColor: colors.yellow },
  stepTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 8 },
  stepBody: { fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 },
  dev: { marginTop: 16, fontSize: 11, color: colors.muted, textAlign: "center" },
});
