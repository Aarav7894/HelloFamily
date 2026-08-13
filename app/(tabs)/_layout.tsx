import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import { useAuth } from "@/lib/auth-context";

export default function TabsLayout() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session || profile?.role !== "adult_child") {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#08515c",
        tabBarInactiveTintColor: "#6b7a79",
        tabBarStyle: {
          backgroundColor: "#fdf8f1",
          borderTopColor: "#e9ddc8",
        },
      }}
    >
      <Tabs.Screen
        name="family"
        options={{
          title: "Family",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
