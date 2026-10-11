import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { checkHealth } from "../lib/api";
import { DISCLAIMER, USE_MOCK } from "../lib/config";
import { colors } from "../lib/theme";

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
    <View style={styles.container}>
      <Text style={styles.title}>Is it still fresh?</Text>
      <Text style={styles.sub}>Photograph a fruit, vegetable or bread to get a freshness score.</Text>

      <TouchableOpacity style={styles.btn} onPress={() => pick(true)}>
        <Text style={styles.btnText}>Take a photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={() => pick(false)}>
        <Text style={[styles.btnText, styles.btnAltText]}>Choose from gallery</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      <Text style={styles.dev}>{dev}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, textAlign: "center" },
  sub: { fontSize: 16, color: colors.muted, textAlign: "center", marginVertical: 12 },
  btn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, marginTop: 14, minWidth: 250, alignItems: "center" },
  btnText: { color: colors.primaryText, fontSize: 16, fontWeight: "600" },
  btnAlt: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.primary },
  btnAltText: { color: colors.primary },
  disclaimer: { marginTop: 28, fontSize: 13, color: colors.muted, textAlign: "center" },
  dev: { marginTop: 8, fontSize: 11, color: colors.border },
});
