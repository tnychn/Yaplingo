"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AudioModule,
  AudioQuality,
  RecordingOptions,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as Speech from "expo-speech";
import tw from "twrnc";
import {
  Mic,
  Square,
  Volume2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react-native";
import Svg, { Circle, G } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import { useTeachMutation, useTranscriptQuery } from "~/client";
import { getLocalFileBase64 } from "~/utils";
import { Platform } from "react-native";
import WordFeedback from "../components/WordFeedback";


const SCREEN_WIDTH = Dimensions.get("window").width;

const RECORDING_OPTIONS: RecordingOptions = {
  extension: ".wav",
  bitRate: 128_000,
  sampleRate: 48_000,
  numberOfChannels: 1,
  ios: {
    extension: ".wav",
    outputFormat: "lpcm",
    audioQuality: AudioQuality.HIGH,
  },
  android: {
    outputFormat: "aac_adts",
    audioEncoder: "aac",
  },
};

interface Transcript {
  id: string;
  text: string;
  sequence: string;
}

interface PhonemeAlignment {
  token: string;
  score: number;
  interval: [number, number];
}

interface TeachResult {
  feedback: {
    text: string;
    audio: string;
  };
  phonemes: {
    alignments: PhonemeAlignment[];
    predictions: string[];
    differences: Array<{
      type: "insert" | "delete" | "replace";
      position: number;
      expected: string;
      predicted: string;
    }>;
  };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function PieChart({
  progress,
  size = 180,
  strokeWidth = 18,
  color,
  backgroundColor = "#e5e7eb",
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  backgroundColor?: string;
}) {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = (animatedProgress as any).interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[tw`items-center justify-center`, { width: size, height: size }]}>
      <Svg height={size} width={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={tw`absolute items-center`}>
        <Text style={[tw`text-5xl font-black`, { color }]}>{progress}%</Text>
        <Text style={[tw`text-sm font-semibold text-center -mt-1`, { color: "#6b7280" }]}>
          Accuracy
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  // CONSTANT COLORS (no useTheme hook)
  const colors = {
    background: "#ffffff",
    card: "#f9fafb",
    text: "#111827",
    textSecondary: "#6b7280",
    accent: "#10B981",
  };

  // simple local state/hooks (always called in same order)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState<"idle" | "recording" | "analysing" | "loading">("idle");
  const [feedback, setFeedback] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const [progressSidebarVisible, setProgressSidebarVisible] = useState(false);
  const [wordFeedback, setWordFeedback] = useState<{ token: string; score: number }[]>([]);
  

  const router = useRouter();

  // animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlideAnim = useRef(new Animated.Value(-30)).current;
  const cardSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const cardRotateAnim = useRef(new Animated.Value(0)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const recordPulseAnim = useRef(new Animated.Value(1)).current;
  const iconFloatAnim = useRef(new Animated.Value(0)).current;
  const progressSidebarAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.7)).current;

  // audio hooks (always called)
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder);

  const {
    data: transcript,
    isLoading: isTranscriptLoading,
    isFetching: isTranscriptFetching,
    error: transcriptError,
    refetch: refetchTranscript,
  } = useTranscriptQuery();

  const mutation = useTeachMutation(transcript);

  // Mic permission
  useEffect(() => {
    (async () => {
      try {
        const statusReq = await AudioModule.requestRecordingPermissionsAsync();
        if (!statusReq.granted) {
          Alert.alert("Permission Denied", "Microphone access is required.");
        }
      } catch (e) {
        console.warn("permission request error", e);
      }
    })();
  }, []);

  // auto-play feedback when available
  useEffect(() => {
    if (playerStatus.isLoaded) {
      player.seekTo(0);
      player.play();
    }
  }, [player, playerStatus.isLoaded]);

  // set loading/idle based on transcript fetch
  useEffect(() => {
    if (isTranscriptLoading || isTranscriptFetching) setStatus("loading");
    else if (transcript) setStatus("idle");
  }, [isTranscriptLoading, isTranscriptFetching, transcript]);

  useEffect(() => {
    if (transcriptError) {
      Alert.alert("Error", "Failed to load sentence.");
      setStatus("idle");
    }
  }, [transcriptError]);

  useEffect(() => {
    if (mutation.isPending) setStatus("analysing");
  }, [mutation.isPending]);

  // Daily progress helpers
  async function savePracticeHistory(sentence: string, s: number) {
    try {
      const newEntry = { sentence, score: s, date: new Date().toISOString() };
      const prevRaw = await AsyncStorage.getItem("practiceHistory");
      const prev = prevRaw ? JSON.parse(prevRaw) : [];
      prev.unshift(newEntry);
      await AsyncStorage.setItem("practiceHistory", JSON.stringify(prev.slice(0, 100)));
    } catch (e) {
      console.warn("savePracticeHistory error", e);
    }
  }

async function incrementDailyCount() {
  try {
    const today = new Date().toDateString();
    const dayNum = new Date().getDay(); // 0 = Sun

    /* ---------------- DAILY ---------------- */
    const rawDaily = await AsyncStorage.getItem("dailyProgress");
    let daily = rawDaily ? JSON.parse(rawDaily) : { date: today, count: 0 };
    if (daily.date !== today) daily = { date: today, count: 0 };
    daily.count += 1;
    await AsyncStorage.setItem("dailyProgress", JSON.stringify(daily));
    setDailyCount(daily.count);

    /* ---------------- WEEKLY ---------------- */
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - dayNum);
    const weekKey = startOfWeek.toDateString();

    const rawWeekly = await AsyncStorage.getItem("weeklyProgress");
    let weekly = rawWeekly ? JSON.parse(rawWeekly) : { weekStart: weekKey, count: 0 };

    if (weekly.weekStart !== weekKey) {
      weekly = { weekStart: weekKey, count: 0 };
    }
    weekly.count += 1;
    await AsyncStorage.setItem("weeklyProgress", JSON.stringify(weekly));

    /* ---------------- STREAK ---------------- */
    const rawStreak = await AsyncStorage.getItem("streakData");
    let streakData = rawStreak ? JSON.parse(rawStreak) : { lastDate: today, streak: 0 };

    if (streakData.lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (streakData.lastDate === yesterdayStr) {
        streakData.streak += 1;
      } else {
        streakData.streak = 1;
      }
      streakData.lastDate = today;
    }

    await AsyncStorage.setItem("streakData", JSON.stringify(streakData));

  } catch (e) {
    console.warn("incrementDailyCount error", e);
  }
}


  async function loadDailyCount() {
    try {
      const raw = await AsyncStorage.getItem("dailyProgress");
      const today = new Date().toDateString();
      if (!raw) {
        setDailyCount(0);
        return;
      }
      const obj = JSON.parse(raw);
      if (obj.date !== today) {
        setDailyCount(0);
        await AsyncStorage.setItem("dailyProgress", JSON.stringify({ date: today, count: 0 }));
      } else {
        setDailyCount(obj.count || 0);
      }
    } catch (e) {
      console.warn("loadDailyCount error", e);
    }
  }

  async function loadDailyGoal() {
    try {
      const stored = await AsyncStorage.getItem("dailyGoal");
      if (stored) setDailyGoal(Number(stored));
    } catch (e) {
      console.warn("loadDailyGoal error", e);
    }
  }

  useEffect(() => {
    loadDailyCount();
    loadDailyGoal();
  }, []);

  // Progress sidebar toggle (kept but non-blocking)
  const toggleProgressSidebar = () => {
    const toValue = progressSidebarVisible ? -SCREEN_WIDTH * 0.7 : 0;
    Animated.timing(progressSidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setProgressSidebarVisible(!progressSidebarVisible));
  };

  // Animations (unchanged)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.timing(headerSlideAnim, { toValue: 0, duration: 800, delay: 100, useNativeDriver: true }),
      Animated.spring(cardSlideAnim, { toValue: 0, tension: 50, friction: 7, delay: 200, useNativeDriver: true }),
      Animated.spring(buttonScaleAnim, { toValue: 1, delay: 400, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(buttonPulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    if (status === "recording") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(recordPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordPulseAnim.setValue(1);
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloatAnim, { toValue: -2, duration: 1500, useNativeDriver: true }),
        Animated.timing(iconFloatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 20000, useNativeDriver: true })).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(cardRotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(cardRotateAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [status]);

  // Recording start/stop with Base64 conversion
  async function startRecording() {
    try {
      mutation.reset();
      player.replace("");
      await Speech.stop();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setStatus("recording");
    } catch (error) {
      console.error("Failed to start recording", error);
      Alert.alert("Error", "Could not start recording.");
      setStatus("idle");
    }
  }

async function stopRecording() {
  try {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    if (!uri || !transcript) {
      Alert.alert("Error", "No recording or sentence.");
      setStatus("idle");
      return;
    }

    const audioBase64 = await getLocalFileBase64(uri);

    mutation.mutate(audioBase64, {
      onSuccess: (data) => {
        if (!data) return;
        const base64 = data.feedback.audio;
        player.replace(`data:audio/wav;base64,${base64}`);

        const alignments = data.phonemes.alignments;
        const computedScore = alignments.length > 0
          ? Math.round(alignments.reduce((sum, a) => sum + a.score, 0) / alignments.length * 100)
          : 0;

        setFeedback(data.feedback.text || "Great job!");
        setScore(computedScore);
        setWordFeedback(data.phonemes.alignments || []);
        savePracticeHistory(transcript.text, computedScore);
        incrementDailyCount();
        setStatus("idle");
      },
      onError: (error: any) => {
        Alert.alert("Analysis Failed", error.message || "Try again.");
        setStatus("idle");
      },
    });
  } catch (e: any) {
    console.error("stopRecording error:", e);
    Alert.alert("Error", e.message || "Analysis failed");
    setStatus("idle");
  }
}


  async function speakSentence() {
    player.replace("");
    await Speech.stop();
    if (!transcript?.text) return;
    if (isSpeaking) {
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(transcript.text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  }

  function changeSentence() {
    player.replace("");
    Speech.stop();
    mutation.reset();
    setFeedback("");
    setScore(null);
    refetchTranscript();
  }

  const disabledPronounce = playerStatus.playing || isTranscriptFetching || !!transcriptError || mutation.isPending;
  const disabledRecord = mutation.isPending || isTranscriptFetching || !!transcriptError;
  const disabledNext = mutation.isPending || isTranscriptFetching;

  const shimmerTranslate = (shimmerAnim as any).interpolate({ inputRange: [0, 1], outputRange: [-100, 100] });
  const cardRotate = (cardRotateAnim as any).interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] });
  const iconTranslateY = (iconFloatAnim as any).interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <KeyboardAvoidingView style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="dark-content" />

      {/* Overlay for progress sidebar */}
      {progressSidebarVisible && (
        <TouchableWithoutFeedback onPress={toggleProgressSidebar}>
          <View style={tw`absolute inset-0 bg-black/40 z-40`} />
        </TouchableWithoutFeedback>
      )}

      {/* Progress Sidebar (kept empty) */}
      <Animated.View
        style={[
          tw`absolute left-0 top-0 bottom-0 bg-white z-50 shadow-2xl rounded-tr-3xl rounded-br-3xl overflow-hidden`,
          {
            width: SCREEN_WIDTH * 0.7,
            transform: [{ translateX: progressSidebarAnim }],
          },
        ]}
      />

      <ScrollView 
        style={tw`flex-1`} 
        contentContainerStyle={tw`px-4 pb-10 pt-6`}
      >
        <Text style={tw`text-5xl font-bold text-center text-green-700 mb-5`}>Let's Yap !</Text>

        <Animated.View
          style={[
            tw`rounded-3xl p-4 mb-4 border overflow-hidden`,
            {
              backgroundColor: colors.card,
              borderColor: "#e5e7eb",
              opacity: fadeAnim,
              transform: [{ translateY: cardSlideAnim }, { rotate: cardRotate }],
            },
          ]}
        >
          <Animated.View
            style={[
              tw`absolute inset-0 w-100 h-full`,
              { backgroundColor: colors.accent, opacity: 0.03, transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
          <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-1`, { color: colors.textSecondary }]}>
            Practice Sentence
          </Text>

          <View style={[tw`h-px my-5`, { backgroundColor: "#e5e7eb" }]} />
          <View style={[tw`rounded-2xl p-6 border`, { backgroundColor: `${colors.background}ee`, borderColor: "#e5e7eb" }]}>
            {isTranscriptFetching || status === "loading" ? (
              <View style={tw`items-center py-4`}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[tw`text-base mt-2`, { color: colors.textSecondary }]}>Loading sentence...</Text>
              </View>
            ) : transcript ? (
              <>
                <Text selectable style={[tw`text-xl leading-8 text-center`, { color: colors.text }]}>
                  {transcript.text}
                </Text>
                {transcript.sequence && (
                  <Text style={[tw`text-center text-lg font-medium mt-2`, { color: colors.text }]}>
                    {transcript.sequence}
                  </Text>
                )}
              </>
            ) : null}
          </View>

          <View style={[tw`h-px my-5`, { backgroundColor: "#e5e7eb" }]} />
          <View style={[tw`rounded-2xl p-4 border`, { backgroundColor: `${colors.background}ee`, borderColor: "#e5e7eb" }]}>
            {feedback || score !== null ? (
              <>
                <View style={tw`flex-row items-center gap-2 mb-3`}>
                  <Sparkles size={16} color={colors.accent} />
                  <Text style={[tw`text-xs uppercase tracking-wider font-bold`, { color: colors.accent }]}>
                    Your Results
                  </Text>
                </View>

                {score !== null && (
                  <View style={tw`items-center mb-4`}>
                    <PieChart progress={score} color={colors.accent} />
                    <Text style={[tw`text-sm text-center font-semibold mt-2`, { color: colors.textSecondary }]}>
                      Pronunciation Accuracy
                    </Text>
                  </View>
                )}

                {feedback && (
                  <View>
                    <View style={[tw`h-px my-3`, { backgroundColor: "#e5e7eb" }]} />
                    <ScrollView style={tw`max-h-64`} contentContainerStyle={tw`p-4`}>
                      <Text style={[tw`text-base leading-6 text-center mb-3`, { color: colors.text }]}>
                        {feedback}
                      </Text>
                      {/* Word-level Feedback Highlighter */}
                      {transcript && (
                  <View
                    style={tw`mt-4 p-4 rounded-2xl border border-gray-300 bg-white shadow-sm`}
                  >
                    <Text
                      style={tw`text-center text-base font-bold mb-2 text-gray-700`}
                    >
                      Word-Level Feedback
                    </Text>

                    <WordFeedback text={transcript.text} alignments={wordFeedback} />
                  </View>
                )}
                    </ScrollView>

                  </View>
                )}
              </>
            ) : (
              <>
                <View style={tw`flex-row items-center gap-2 mb-3`}>
                  <Zap size={16} color={colors.accent} />
                  <Text style={[tw`text-xs uppercase tracking-wider font-bold`, { color: colors.accent }]}>
                    How It Works
                  </Text>
                </View>
                <Text style={[tw`text-sm leading-6`, { color: colors.textSecondary }]}>
                  👂 Listen to the sentence using the Listen button{"\n"}
                  🎤 Record yourself saying it clearly{"\n"}
                  ✨ Get instant AI feedback on your pronunciation{"\n"}
                  🔄 Try new sentences to keep practicing!
                </Text>
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View style={[tw`flex-row gap-4 mb-8`, { opacity: fadeAnim, transform: [{ scale: buttonScaleAnim }] }]}>
          {!recorderState.isRecording && (
            <Animated.View style={{ transform: [{ scale: buttonPulseAnim }], flex: 1 }}>
              <Pressable
                style={({ pressed }) =>
                  tw.style(
                    "rounded-2xl p-5 items-center justify-center border shadow-2xl",
                    isSpeaking ? "bg-emerald-500 border-emerald-600" : "bg-slate-100 border-slate-700",
                    pressed && "opacity-95",
                    {
                      shadowColor: isSpeaking ? "#10b981" : "#1e293b",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 8,
                    }
                  )
                }
                onPress={speakSentence}
                disabled={disabledPronounce}
              >
                <View style={tw`items-center`}>
                  <Animated.View style={[tw`p-3 rounded-xl mb-3`, isSpeaking ? tw`bg-white/20` : tw`bg-blue-500/20`, { transform: [{ translateY: iconTranslateY }] }]}>
                    <Volume2 size={24} color={isSpeaking ? "white" : "#60a5fa"} strokeWidth={2} fill={isSpeaking ? "white" : "transparent"} />
                  </Animated.View>
                  <Text style={[tw`text-sm font-bold uppercase tracking-wide`, isSpeaking ? tw`text-white` : tw`text-slate-700`]}>
                    Listen
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          )}

          <Animated.View style={{ transform: [{ scale: recorderState.isRecording ? recordPulseAnim : buttonPulseAnim }], flex: 1 }}>
            <Pressable
              style={({ pressed }) =>
                tw.style(
                  "rounded-2xl p-5 items-center justify-center border shadow-2xl",
                  recorderState.isRecording ? "bg-rose-500 border-rose-600" : status === "analysing" ? "bg-slate-400 border-slate-500" : "bg-slate-100 border-slate-700",
                  pressed && "opacity-95",
                  {
                    shadowColor: recorderState.isRecording ? "#f43f5e" : status === "analysing" ? "#94a3b8" : "#1e293b",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: recorderState.isRecording ? 12 : 10,
                    elevation: recorderState.isRecording ? 12 : 8,
                  }
                )
              }
              onPress={recorderState.isRecording ? stopRecording : startRecording}
              disabled={disabledRecord || isSpeaking || !transcript?.text}
            >
              <View style={tw`items-center`}>
                <View style={tw`relative`}>
                  <Animated.View style={[tw`p-3 rounded-xl mb-3`, recorderState.isRecording ? tw`bg-white/20` : status === "analysing" ? tw`bg-white/20` : tw`bg-rose-500/20`, { transform: [{ translateY: iconTranslateY }] }]}>
                    {status === "analysing" ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : recorderState.isRecording ? (
                      <Square size={24} color="white" strokeWidth={2} fill="white" />
                    ) : (
                      <Mic size={24} color="#f43f5e" strokeWidth={2} />
                    )}
                  </Animated.View>

                  {recorderState.isRecording && (
                    <Animated.View style={[tw`absolute -top-1 -right-1 w-3 h-3 bg-rose-300 rounded-full border border-white`, { transform: [{ scale: recordPulseAnim }] }]} />
                  )}
                </View>

                <Text style={[tw`text-sm font-bold uppercase tracking-wide`, recorderState.isRecording || status === "analysing" ? tw`text-white` : tw`text-slate-700`]}>
                  {recorderState.isRecording ? "Stop" : status === "analysing" ? "Result" : "Record"}
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          {!recorderState.isRecording && (
            <Animated.View style={{ transform: [{ scale: buttonPulseAnim }], flex: 1 }}>
              <Pressable
                style={({ pressed }) =>
                  tw.style(
                    "rounded-2xl p-5 items-center justify-center border shadow-2xl bg-slate-100 border-slate-700",
                    pressed && "opacity-95",
                    {
                      shadowColor: "#1e293b",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 8,
                    }
                  )
                }
                onPress={changeSentence}
                disabled={disabledNext}
              >
                <View style={tw`items-center`}>
                  <Animated.View style={[tw`p-3 rounded-xl mb-3 bg-amber-500/20`, { transform: [{ translateY: iconTranslateY }] }]}>
                    <RefreshCw size={24} color="#f59e0b" strokeWidth={2} />
                  </Animated.View>
                  <Text style={tw`text-sm font-bold uppercase tracking-wide text-slate-700`}>Change</Text>
                </View>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      {mutation.isPending && (
        <View style={tw`flex-row items-center justify-center gap-2 p-8 bg-white/80 absolute bottom-0 left-0 right-0`}>
          <ActivityIndicator size="small" />
          <Text style={tw`font-medium text-neutral-500`}>Analyzing your pronunciation...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
