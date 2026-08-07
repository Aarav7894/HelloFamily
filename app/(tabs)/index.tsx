import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-foreground mb-3">
          Welcome to your Lumos App
        </Text>
        <Text className="text-base text-muted-foreground text-center">
          Get started by editing app/(tabs)/index.tsx
        </Text>
      </View>
    </SafeAreaView>
  );
}
