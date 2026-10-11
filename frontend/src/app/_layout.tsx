import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Fresh Check" }} />
      <Stack.Screen name="preview" options={{ title: "Your photo" }} />
      <Stack.Screen name="results" options={{ title: "Results" }} />
      <Stack.Screen name="error" options={{ title: "Oops" }} />
    </Stack>
  );
}
