import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../lib/theme";

// One title and hint per error_type in the contract.
const COPY: Record<string, { title: string; hint: string }> = {
  not_food: { title: "No food found", hint: "Make sure the food fills most of the frame and the light is good." },
  unclear_image: { title: "Photo too blurry", hint: "Hold steady, move closer and tap to focus." },
  multiple_items: { title: "Too many items", hint: "Photograph one food at a time." },
  server_error: { title: "Something went wrong", hint: "Check your connection and try again." },
};

export default function ErrorScreen() {
  const { error_type, message } = useLocalSearchParams<{ error_type: string; message: string }>();
  const router = useRouter();
  const copy = COPY[error_type] || COPY.server_error;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>{copy.hint}</Text>

      <TouchableOpacity style={styles.btn} onPress={() => router.dismissAll()}>
        <Text style={styles.btnText}>Take a new photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={() => router.back()}>
        <Text style={[styles.btnText, styles.btnAltText]}>Try this photo again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: "700", color: colors.error, textAlign: "center" },
  message: { fontSize: 16, color: colors.text, textAlign: "center", marginTop: 12 },
  hint: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, marginBottom: 12 },
  btn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, marginTop: 14, minWidth: 250, alignItems: "center" },
  btnText: { color: colors.primaryText, fontSize: 16, fontWeight: "600" },
  btnAlt: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.primary },
  btnAltText: { color: colors.primary },
});
