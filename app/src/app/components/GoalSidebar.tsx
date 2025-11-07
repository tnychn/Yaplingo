import React, { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, Animated, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import { X, Target, Calendar, Save } from "lucide-react-native";

interface GoalSidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function GoalSidebar({ visible, onClose }: GoalSidebarProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [dailyGoal, setDailyGoal] = useState(10);
  const [weeklyGoal, setWeeklyGoal] = useState(70);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      loadGoals();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  async function loadGoals() {
    const storedDaily = await AsyncStorage.getItem("dailyGoal");
    const storedWeekly = await AsyncStorage.getItem("weeklyGoal");
    const storedStreak = await AsyncStorage.getItem("streakCount");
    if (storedDaily) setDailyGoal(Number(storedDaily));
    if (storedWeekly) setWeeklyGoal(Number(storedWeekly));
    if (storedStreak) setStreak(Number(storedStreak));
  }

  async function saveGoals() {
    await AsyncStorage.setItem("dailyGoal", String(dailyGoal));
    await AsyncStorage.setItem("weeklyGoal", String(weeklyGoal));
    onClose();
  }

  return (
    <Animated.View
      style={[
        tw`absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl border-l border-slate-200 p-5 z-50`,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <View style={tw`flex-row items-center justify-between mb-5`}>
        <Text style={tw`text-xl font-bold text-slate-800`}>Your Practice Goals</Text>
        <Pressable onPress={onClose}>
          <X color="#64748b" size={22} />
        </Pressable>
      </View>

      <View style={tw`mb-6`}>
        <View style={tw`flex-row items-center mb-2`}>
          <Target color="#f59e0b" size={18} />
          <Text style={tw`ml-2 text-slate-700 font-semibold`}>Daily Goal</Text>
        </View>
        <TextInput
          keyboardType="numeric"
          value={String(dailyGoal)}
          onChangeText={(t) => setDailyGoal(Number(t || 0))}
          style={tw`border border-slate-300 rounded-xl p-3 text-center text-lg font-bold text-slate-800`}
        />
        <Text style={tw`text-xs text-slate-500 mt-1`}>Sentences per day</Text>
      </View>

      <View style={tw`mb-6`}>
        <View style={tw`flex-row items-center mb-2`}>
          <Calendar color="#3b82f6" size={18} />
          <Text style={tw`ml-2 text-slate-700 font-semibold`}>Weekly Goal</Text>
        </View>
        <TextInput
          keyboardType="numeric"
          value={String(weeklyGoal)}
          onChangeText={(t) => setWeeklyGoal(Number(t || 0))}
          style={tw`border border-slate-300 rounded-xl p-3 text-center text-lg font-bold text-slate-800`}
        />
        <Text style={tw`text-xs text-slate-500 mt-1`}>Sentences per week</Text>
      </View>

      <View style={tw`mb-6`}>
        <Text style={tw`text-base font-semibold text-slate-700 mb-1`}>🔥 Current Streak</Text>
        <Text style={tw`text-3xl font-black text-amber-500 text-center`}>{streak} days</Text>
      </View>

      <Pressable
        style={tw`bg-amber-500 py-3 rounded-xl mt-auto flex-row items-center justify-center`}
        onPress={saveGoals}
      >
        <Save color="white" size={18} />
        <Text style={tw`text-white font-semibold ml-2`}>Save Goals</Text>
      </Pressable>
    </Animated.View>
  );
}
