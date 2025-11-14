import React from "react";
import { View, Text, Pressable } from "react-native";
import tw from "twrnc";
import { Settings } from "lucide-react-native";
import { Menu } from "lucide-react-native";


export default function DailyGoal({
  count,
  goal,
  onOpenSidebar,
  weeklyCount,
  weeklyGoal,
}: {
  count: number;
  goal: number;
  onOpenSidebar: () => void;
  weeklyCount?: number;
  weeklyGoal?: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((count / goal) * 100)));

return (
  <View style={tw`items-center my-3 w-full`}>
    <Text style={[tw`text-2xl font-bold mb-2 text-center`, { color: "#6366f1" }]}>
      Daily Practice
    </Text>

    <View style={tw`w-80 h-4 bg-slate-200 rounded-full overflow-hidden`}>
      <View
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: "#6366f1",
          borderRadius: 999,
        }}
      />
    </View>

    <Text style={[tw`text-sm mt-2 font-semibold text-gray-500`]}>
      {count}/{goal} • {pct}%
    </Text>

    {/* WEEKLY PRACTICE */}
    {typeof weeklyCount !== "undefined" && typeof weeklyGoal !== "undefined" && (
      <View style={tw`items-center mt-6`}>
        <Text
          style={[tw`text-2xl font-bold mb-2 text-center`, { color: "#6366f1" }]}
        >
          Weekly Practice
        </Text>

        <View style={tw`w-80 h-4 bg-slate-200 rounded-full overflow-hidden`}>
          <View
            style={{
              width: `${Math.min(100, Math.round((weeklyCount / weeklyGoal) * 100))}%`,
              height: "100%",
              backgroundColor: "#6366f1",
              borderRadius: 999,
            }}
          />
        </View>

        <Text style={[tw`text-sm mt-2 font-semibold text-gray-500`]}>
          {weeklyCount}/{weeklyGoal} •{" "}
          {Math.round((weeklyCount / weeklyGoal) * 100)}%
        </Text>
      </View>
    )}
  </View>
);
}