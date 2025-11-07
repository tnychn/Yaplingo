import React from "react";
import { View, Text, Pressable } from "react-native";
import tw from "twrnc";
import { Settings } from "lucide-react-native";
import { Menu } from "lucide-react-native";


export default function DailyGoal({
  count,
  goal,
  onOpenSidebar,
}: {
  count: number;
  goal: number;
  onOpenSidebar: () => void;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((count / goal) * 100)));

  return (
    <View style={tw`items-start my-3`}>
      <View style={tw`flex-row items-center justify-between w-full mb-2`}>
        <Text style={[tw`text-xl font-bold`, { color: "#374151" }]}>Daily Practice</Text>
      </View>

      <View style={tw`w-64 h-3 bg-slate-200 rounded-full overflow-hidden`}>
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: "#f59e0b",
            borderRadius: 999,
          }}
        />
      </View>

      <Text style={[tw`text-xs mt-2 font-semibold`, { color: "#6b7280" }]}>
        {count}/{goal} • {pct}% of daily goal
      </Text>
    </View>
  );
}
