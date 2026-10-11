import { useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { analyzePhoto } from "../lib/api";
import { colors } from "../lib/theme";
import { saveLastResult } from "../lib/storage";

export default function PreviewScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    const result = await analyzePhoto(uri); // never throws
    setLoading(false);
    // Check status first, as the contract says.
           if (result.status === "success") {
         await saveLastResult(result, uri);
         router.push({ pathname: "/results", params: { uri, result: JSON.stringify(result) } });
    } else {
      router.push({
        pathname: "/error",
        params: { uri, error_type: result.error_type, message: result.message },
      });
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.preview} />
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing...</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.btn} onPress={send}>
            <Text style={styles.btnText}>Analyze this</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={() => router.back()}>
            <Text style={[styles.btnText, styles.btnAltText]}>Retake</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  preview: { width: 300, height: 300, borderRadius: 12, marginBottom: 16, backgroundColor: colors.border },
  loadingBox: { marginTop: 20, alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: colors.muted },
  btn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, marginTop: 14, minWidth: 250, alignItems: "center" },
  btnText: { color: colors.primaryText, fontSize: 16, fontWeight: "600" },
  btnAlt: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.primary },
  btnAltText: { color: colors.primary },
});
