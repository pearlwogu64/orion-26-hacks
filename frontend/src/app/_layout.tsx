import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="index" options={{ title: "Inspect Studio" }} />
      <Stack.Screen name="preview" options={{ title: "Your photo", headerShown: true, animation: "default" }} />
      <Stack.Screen name="results" options={{ title: "Freshness Verdict" }} />
      <Stack.Screen name="kitchen" options={{ title: "Rescue Kitchen" }} />
      <Stack.Screen name="impact" options={{ title: "Impact Dashboard" }} />
      <Stack.Screen name="error" options={{ title: "Oops", headerShown: true, animation: "default" }} />
    </Stack>
  );
}
