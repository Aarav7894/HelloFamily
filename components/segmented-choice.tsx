import { Fragment } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@/components/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export type ChoiceTone = "positive" | "neutral" | "negative";

type ChoiceOption = {
  value: string;
  label: string;
  tone: ChoiceTone;
};

const TONE_STYLES: Record<
  ChoiceTone,
  { bg: string; text: string; badge: string }
> = {
  positive: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-500",
  },
  neutral: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-500",
  },
  negative: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    badge: "bg-orange-500",
  },
};

export function SegmentedChoice({
  options,
  selectedValue,
  onSelect,
}: {
  options: ChoiceOption[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
}) {
  return (
    <View className="flex-row overflow-hidden rounded-xl border border-border">
      {options.map((option, i) => {
        const selected = option.value === selectedValue;
        const styles = TONE_STYLES[option.tone];
        return (
          <Fragment key={option.value}>
            {i > 0 ? <View className="w-px bg-border" /> : null}
            <Pressable
              onPress={() => onSelect(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={cn(
                "flex-1 items-center justify-center gap-1 py-3",
                selected ? styles.bg : "bg-background active:bg-accent",
              )}
            >
              <View
                className={cn(
                  "h-5 w-5 items-center justify-center rounded-full",
                  selected ? styles.badge : "opacity-0",
                )}
              >
                <Feather name="check" size={12} className="text-white" />
              </View>
              <Text
                className={cn(
                  "text-center text-base font-semibold",
                  selected ? styles.text : "text-foreground",
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}
