import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type InitialsCircleProps = {
  name: string;
  className?: string;
  textClassName?: string;
};

export function InitialsCircle({
  name,
  className,
  textClassName,
}: InitialsCircleProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <View
      className={cn(
        "h-12 w-12 items-center justify-center rounded-full bg-accent",
        className,
      )}
    >
      <Text
        className={cn(
          "text-lg font-semibold text-accent-foreground",
          textClassName,
        )}
      >
        {initial}
      </Text>
    </View>
  );
}
