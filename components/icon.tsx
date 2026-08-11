import { Feather } from "@expo/vector-icons";
import { cssInterop } from "nativewind";

cssInterop(Feather, {
  className: {
    target: "style",
  },
});

export { Feather };
