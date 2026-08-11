import { Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type ChoiceButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function ChoiceButton({ label, selected, onPress }: ChoiceButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "flex-1 items-center justify-center rounded-xl border-2 px-3 py-4",
        selected
          ? "border-primary bg-primary"
          : "border-border bg-background active:bg-accent",
      )}
    >
      <Text
        className={cn(
          "text-center text-lg font-semibold",
          selected ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
