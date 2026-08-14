import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import { useAuth } from "@/lib/auth-context";

export default function CheckInTabsLayout() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!session || profile?.role !== "older_adult") {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f2704a",
        tabBarInactiveTintColor: "#6b7a79",
        tabBarStyle: {
          backgroundColor: "#fdf8f1",
          borderTopColor: "#e9ddc8",
        },
      }}
    >
      <Tabs.Screen
        name="check-in"
        options={{
          title: "Check-In",
          tabBarIcon: ({ color, size }) => (
            <Feather name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="check-in-history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
