import { Redirect, router } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@/components/icon";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function WelcomeScreen() {
  const { session, profile, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isNarrowScreen = width < 360;

  if (!loading && session && profile) {
    if (profile.role === "adult_child") return <Redirect href="/family" />;
    if (profile.role === "older_adult") return <Redirect href="/check-in" />;
    return <Redirect href="/role-select" />;
  }

  if (loading || (session && !profile)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#FBF8F3]">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FBF8F3]">
      <View className="w-full max-w-[520px] flex-1 items-center justify-center self-center px-7 pb-4 pt-5">
        <Image
          source={require("@/assets/images/icon.png")}
          className="h-16 w-16 rounded-2xl"
          resizeMode="contain"
          accessibilityLabel="HelloFamily logo"
        />

        <Text className="mt-2 text-center font-body-bold text-[22px] leading-[26px] text-[#173F43]">
          HelloFamily
        </Text>

        <Text
          className={cn(
            "mt-5 text-center font-display text-[#173F43]",
            isNarrowScreen
              ? "text-[30px] leading-[34px]"
              : "text-[34px] leading-[38px]",
          )}
        >
          {"Stay close,\neven from afar."}
        </Text>

        <Text className="mt-3 max-w-[300px] text-center font-body text-[15px] leading-[21px] text-[#5F6F70]">
          A simple daily check-in that gives families peace of mind while
          respecting independence.
        </Text>

        <Image
          source={require("@/assets/images/family-connection.png")}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          resizeMode="contain"
          className="mt-4 h-[174px] w-[320px]"
        />

        <View className="mt-4 w-full">
          <Pressable
            onPress={() => router.push("/login")}
            accessibilityRole="button"
            accessibilityLabel="Log in to HelloFamily"
            className="relative h-14 w-full items-center justify-center rounded-[29px] bg-[#F56F50] px-6 active:opacity-[0.88]"
          >
            <Text className="font-body-semibold text-[19px] text-white">
              Log In
            </Text>
            <View className="absolute bottom-0 right-6 top-0 items-center justify-center">
              <Feather name="arrow-right" size={22} className="text-white" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/sign-up")}
            accessibilityRole="button"
            accessibilityLabel="Create a HelloFamily account"
            className="mt-2.5 h-14 w-full items-center justify-center rounded-[29px] border-[1.5px] border-[#DED0B7] bg-[#FBF8F3] active:bg-card"
          >
            <Text className="font-body-semibold text-[18px] text-[#173F43]">
              Create Account
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center justify-center gap-[9px] px-4">
          <Feather name="lock" size={18} className="text-[#173F43]" />
          <Text className="max-w-[280px] text-center font-body text-[13px] leading-[18px] text-[#5F6F70]">
            Private by design. Your responses stay yours.
          </Text>
        </View>

        <Text className="mt-3 text-center font-body text-[12px] leading-[16px] text-[#5F6F70]">
          Keeping families connected, every day.
        </Text>
      </View>
    </SafeAreaView>
  );
}
