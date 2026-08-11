import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppStateProvider } from "@/lib/app-state";

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </AppStateProvider>
  );
}
