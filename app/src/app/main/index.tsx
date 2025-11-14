import React, { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import tw from "twrnc";
import { Settings } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DailyGoal from "../components/DailyGoal";
import { useFocusEffect } from "@react-navigation/native";


export default function MainHomeScreen() {
  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(50);
  const [dailyCount, setDailyCount] = useState<number>(3);
  const [weeklyCount, setWeeklyCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [today, setToday] = useState<string>(new Date().toDateString());
  const [tempDaily, setTempDaily] = useState<string>("");
  const [tempWeekly, setTempWeekly] = useState<string>("");

useFocusEffect(
  React.useCallback(() => {
    async function loadStats() {
      const today = new Date().toDateString();

      const rawDaily = await AsyncStorage.getItem("dailyProgress");
      if (rawDaily) {
        const d = JSON.parse(rawDaily);
        setDailyCount(d.date === today ? d.count : 0);
      }

      const rawWeekly = await AsyncStorage.getItem("weeklyProgress");
      if (rawWeekly) {
        const w = JSON.parse(rawWeekly);
        setWeeklyCount(w.count || 0);
      }

      const rawStreak = await AsyncStorage.getItem("streakData");
      if (rawStreak) {
        const s = JSON.parse(rawStreak);
        setStreak(s.streak || 0);
      }
    }

    loadStats();
  }, [])
);

  const saveGoals = async () => {
    try {
      const newDaily = parseInt(tempDaily || dailyGoal.toString());
      const newWeekly = parseInt(tempWeekly || weeklyGoal.toString());
      if (isNaN(newDaily) || isNaN(newWeekly)) {
        Alert.alert("Invalid Input", "Please enter valid numbers for goals.");
        return;
      }
      await AsyncStorage.setItem("dailyGoal", newDaily.toString());
      await AsyncStorage.setItem("weeklyGoal", newWeekly.toString());
      setDailyGoal(newDaily);
      setWeeklyGoal(newWeekly);
      Alert.alert("Success", "Goals updated successfully!");
    } catch (error) {
      console.error("Error saving goals:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-white`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={tw`flex-grow p-5 pt-4`}>
          <View style={tw`items-center mb-4`}>
            <Text style={tw`text-4xl font-bold text-green-700 text-center`}>
              Daily Progress
            </Text>
          </View>

          <View style={tw`items-center mb-6`}>
            <Text style={tw`text-xl font-bold text-black`}>
              {today}
            </Text>

            <Text style={tw`text-lg font-semibold text-gray-700 mt-2`}>
              🔥 You’re on a {streak}-day streak!
            </Text>

            {streak >= 3 && (
              <Text style={tw`text-base font-medium text-green-600 mt-1`}>
                Keep going! Amazing consistency!
              </Text>
            )}
          </View>

        <View style={tw`items-center mb-6`}>
          <DailyGoal
            count={dailyCount}
            goal={dailyGoal}
            weeklyCount={weeklyCount}
            weeklyGoal={weeklyGoal}
            onOpenSidebar={() => {}}
          />
        </View>


        {/* Embedded Goal Settings (formerly GoalSidebar) */}
        <View style={tw`bg-white rounded-2xl p-5 shadow-md`}>
          <Text style={tw`text-3xl font-bold text-black mb-3`}>
            Set Your Goals
          </Text>

          <View style={tw`mb-4`}>
            <Text style={tw`text-xl font-bold text-green-700 mb-1`}>Daily Goal</Text>
            <TextInput
              style={[
                tw`border border-green-600 rounded-lg p-2 bg-green-50`,
                { textAlign: "center", textAlignVertical: "center", height: 48, fontSize: 18 },
              ]}
              keyboardType="numeric"
              value={tempDaily}
              onChangeText={setTempDaily}
              placeholder={`${dailyGoal}`}
              placeholderTextColor="#a1a1aa"
            />
          </View>

          <View style={tw`mb-4`}>
            <Text style={tw`text-xl font-bold text-green-700 mb-1`}>Weekly Goal</Text>
            <TextInput
              style={[
                tw`border border-green-600 rounded-lg p-2 bg-green-50`,
                { textAlign: "center", textAlignVertical: "center", height: 48, fontSize: 18 },
              ]}
              keyboardType="numeric"
              value={tempWeekly}
              onChangeText={setTempWeekly}
              placeholder={`${weeklyGoal}`}
              placeholderTextColor="#a1a1aa"
            />
          </View>

          <Pressable
            onPress={saveGoals}
            style={tw`bg-green-300 rounded-xl p-3 mt-2`}
          >
            <Text style={tw`text-green-800 text-center font-semibold text-xl`}>
              Save Goals
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
