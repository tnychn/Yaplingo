"use client"

import { useEffect, useState, useRef } from "react"
import { Alert, Pressable, Text, View, ScrollView, Animated, StatusBar, ActivityIndicator } from "react-native"
import { AudioModule, AudioQuality, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio"
import * as Speech from "expo-speech"
import tw from "twrnc"
import { Mic, Square, Volume2, RefreshCw, Sparkles, Zap } from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"
import Svg, { Circle, G } from "react-native-svg"

const API_URL = "http://localhost:8000"

interface Transcript {
  id: string
  text: string
  phonemes: string[]
}

interface PipelineResult {
  feedback: string
  phonemes: {
    alignments: Array<{
      token: string
      score: number
      interval: [number, number]
    }>
    predictions: string[]
    differences: Array<{
      type: "insert" | "delete" | "replace"
      position: number
      expected: string
      predicted: string
    }>
  }
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function PieChart({
  progress,
  size = 140,
  strokeWidth = 18,
  color,
  backgroundColor = "#e5e7eb",
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color: string
  backgroundColor?: string
}) {
  const animatedProgress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start()
  }, [progress])

  const radius = size / 2 - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  })

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
  )
}

export default function HomeScreen() {
  const { colors } = useTheme()

  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [currentSentence, setCurrentSentence] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [status, setStatus] = useState<"idle" | "recording" | "analysing" | "loading">("idle")

  const [feedback, setFeedback] = useState<string>("")
  const [score, setScore] = useState<number | null>(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const headerSlideAnim = useRef(new Animated.Value(-30)).current
  const cardSlideAnim = useRef(new Animated.Value(30)).current
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const shimmerAnim = useRef(new Animated.Value(0)).current
  const floatAnim = useRef(new Animated.Value(0)).current
  const cardRotateAnim = useRef(new Animated.Value(0)).current

  // New animations for buttons
  const buttonPulseAnim = useRef(new Animated.Value(1)).current
  const recordPulseAnim = useRef(new Animated.Value(1)).current
  const iconFloatAnim = useRef(new Animated.Value(0)).current

  const recorder = useAudioRecorder({
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
  })
  const recorderState = useAudioRecorderState(recorder)

  async function fetchNewSentence() {
    try {
      setStatus("loading")
      setFeedback("")
      setScore(null)
      
      const response = await fetch(`${API_URL}/`)
      if (!response.ok) {
        throw new Error("Failed to fetch sentence")
      }
      const data: Transcript = await response.json()
      setTranscript(data)
      setCurrentSentence(data.text)
      setStatus("idle")
    } catch (error) {
      console.error("Error fetching sentence:", error)
      Alert.alert("Error", "Could not fetch a new sentence from the server. Make sure the backend is running.")
      setStatus("idle")
    }
  }

  useEffect(() => {
    fetchNewSentence()
  }, [])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        delay: 400,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Button subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Record button special pulse when recording
    if (status === "recording") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      recordPulseAnim.setValue(1)
    }

    // Icon float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloatAnim, {
          toValue: -2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(iconFloatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      }),
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(cardRotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(cardRotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [status])

  async function startRecording() {
    try {
const permissionStatus = await AudioModule.requestRecordingPermissionsAsync()
console.log("Microphone Permission:", permissionStatus)

if (!permissionStatus.granted) {
  Alert.alert("Permission Denied", "Go to Simulator Settings → Privacy → Microphone → Enable Expo Go")
  return
}

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      })
      await recorder.prepareToRecordAsync()
      await recorder.record()
      setStatus("recording")
    } catch (error) {
      console.error("Failed to start recording", error)
      Alert.alert("Error", "Could not start recording.")
      setStatus("idle")
    }
  }

async function stopRecording() {
  try {
    console.log("Stopping recorder…")
    await recorder.stop()

    setStatus("analysing")

    // POLL UNTIL URI IS READY (max 5 seconds)
    let uri: string | undefined
    const maxWait = 5000
    const start = Date.now()

    while (!uri && Date.now() - start < maxWait) {
      uri = recorderState.uri
      if (uri) {
        console.log("URI ready →", uri)
        break
      }
      await new Promise(r => setTimeout(r, 100)) // check every 100ms
    }

    if (!uri) {
      Alert.alert("Error", "Recording failed to save (timeout). Try again.")
      setStatus("idle")
      return
    }

    if (!transcript) {
      Alert.alert("Error", "No sentence loaded. Tap 'Change' first.")
      setStatus("idle")
      return
    }

    // SEND TO BACKEND
    const fileRes = await fetch(uri)
    const blob = await fileRes.blob()

    const form = new FormData()
    form.append("audio", blob as any, "recording.wav")

    const analysisRes = await fetch(`${API_URL}/${transcript.id}/teach`, {
      method: "POST",
      body: form,
    })

    if (!analysisRes.ok) {
      const txt = await analysisRes.text()
      console.error("Backend error:", txt)
      throw new Error("Backend failed")
    }

    const result: PipelineResult = await analysisRes.json()
    const total = result.phonemes.predictions.length
    const errors = result.phonemes.differences.length
    const score = total > 0 ? Math.round(((total - errors) / total) * 100) : 0

    setFeedback(result.feedback || "Great job!")
    setScore(score)
    setStatus("idle")
  } catch (e: any) {
    console.error("stopRecording error:", e)
    Alert.alert("Error", e.message || "Analysis failed")
    setStatus("idle")
  }
}

  async function speakSentence() {
    if (isSpeaking) {
      Speech.stop()
      setIsSpeaking(false)
    } else {
      setIsSpeaking(true)
      Speech.speak(currentSentence, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      })
    }
  }

  function changeSentence() {
    fetchNewSentence()
  }

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  })

  const cardRotate = cardRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-1deg", "1deg"],
  })

  const iconTranslateY = iconFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  })

  return (
    <View style={tw`flex-1 bg-yellow-50`}>
      <StatusBar barStyle="dark-content" />

      <Animated.View
        style={[
          tw`pt-16 pb-8 px-6`,
          {
            opacity: fadeAnim,
            transform: [{ translateY: headerSlideAnim }],
          },
        ]}
      >
        <View style={tw`flex-row items-center justify-center mb-2`}>
          <Animated.View style={[tw`mr-3`, { transform: [{ translateY: floatAnim }] }]}>
            <Text style={tw`text-3xl`}>🗣️</Text>
          </Animated.View>
          
          <Text
            style={[
              tw`text-6xl font-black tracking-tight text-center`,
              {
                color: colors.accent,
                fontStyle: "italic",
                textShadowColor: "rgba(139, 18, 232, 0.5)",
                textShadowOffset: { width: 4, height: 4 },
                textShadowRadius: 12,
              },
            ]}
          >
            Yaplingo
          </Text>
          
          <Animated.View style={[tw`ml-3`, { transform: [{ translateY: floatAnim }] }]}>
            <Text style={tw`text-3xl`}>🎙️</Text>
          </Animated.View>
        </View>
        <Text style={[tw`text-base font-bold text-center mt-1`, { color: colors.text }]}>
          Practice Your English Pronunciation!
        </Text>
      </Animated.View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 pb-8`}>
        <Animated.View
          style={[
            tw`rounded-3xl p-6 mb-8 border overflow-hidden`,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ translateY: cardSlideAnim }, { rotate: cardRotate }],
            },
          ]}
        >
          <Animated.View
            style={[
              tw`absolute inset-0 w-20`,
              {
                backgroundColor: colors.accent,
                opacity: 0.05,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />

          <View style={tw`flex-row items-center justify-between mb-5`}>
            <View>
              <Text style={[tw`text-xs uppercase tracking-wider mb-1.5`, { color: colors.textSecondary }]}>
                Practice Sentence
              </Text>
            </View>
          </View>

          <View style={[tw`h-px my-5`, { backgroundColor: colors.border }]} />

          <View
            style={[
              tw`rounded-2xl p-6 border`,
              { backgroundColor: `${colors.background}66`, borderColor: colors.border },
            ]}
          >
            {status === "loading" ? (
              <View style={tw`items-center py-4`}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[tw`text-base mt-2`, { color: colors.textSecondary }]}>Loading sentence...</Text>
              </View>
            ) : (
              <Text style={[tw`text-xl leading-8 text-center`, { color: colors.text }]}>{currentSentence}</Text>
            )}
          </View>

          <View style={[tw`h-px my-5`, { backgroundColor: colors.border }]} />

          <View
            style={[
              tw`rounded-2xl p-4 border`,
              { backgroundColor: `${colors.background}66`, borderColor: colors.border },
            ]}
          >
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
                    <View style={[tw`h-px my-3`, { backgroundColor: colors.border }]} />
                    <Text style={[tw`text-base leading-6 text-center`, { color: colors.text }]}>{feedback}</Text>
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
                <Text style={[tw`text-base leading-6`, { color: colors.textSecondary }]}>
                  👂 Listen to the sentence using the Listen button{"\n"}
                  🎤 Record yourself saying it clearly{"\n"}
                  ✨ Get instant AI feedback on your pronunciation{"\n"}
                  🔄 Try new sentences to keep practicing!
                </Text>
              </>
            )}
          </View>
        </Animated.View>

        {/* Enhanced Buttons Section */}
        <Animated.View
          style={[
            tw`flex-row gap-4 mb-8`,
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScaleAnim }],
            },
          ]}
        >
          {/* Listen Button */}
          <Animated.View style={{ transform: [{ scale: buttonPulseAnim }], flex: 1 }}>
            <Pressable
              style={({ pressed }) =>
                tw.style(
                  "rounded-2xl p-5 items-center justify-center border shadow-2xl",
                  isSpeaking 
                    ? "bg-emerald-500 border-emerald-600" 
                    : "bg-slate-100 border-slate-700",
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
              disabled={status !== "idle"}
            >
              <View style={tw`items-center`}>
                <Animated.View 
                  style={[
                    tw`p-3 rounded-xl mb-3`,
                    isSpeaking ? tw`bg-white/20` : tw`bg-blue-500/20`,
                    { transform: [{ translateY: iconTranslateY }] }
                  ]}
                >
                  <Volume2 
                    size={24} 
                    color={isSpeaking ? "white" : "#60a5fa"} 
                    strokeWidth={2} 
                    fill={isSpeaking ? "white" : "transparent"}
                  />
                </Animated.View>
                <Text style={[
                  tw`text-sm font-bold uppercase tracking-wide`,
                  isSpeaking ? tw`text-white` : tw`text-slate-700`
                ]}>
                  Listen
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Record Button */}
          <Animated.View style={{ 
            transform: [{ scale: status === "recording" ? recordPulseAnim : buttonPulseAnim }], 
            flex: 1 
          }}>
            <Pressable
              style={({ pressed }) =>
                tw.style(
                  "rounded-2xl p-5 items-center justify-center border shadow-2xl",
                  status === "recording" 
                    ? "bg-rose-500 border-rose-600" 
                    : status === "analysing" 
                    ? "bg-slate-400 border-slate-500"
                    : "bg-slate-100 border-slate-700",
                  pressed && "opacity-95",
                  {
                    shadowColor: status === "recording" ? "#f43f5e" : status === "analysing" ? "#94a3b8" : "#1e293b",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: status === "recording" ? 12 : 10,
                    elevation: status === "recording" ? 12 : 8,
                  }
                )
              }
              onPress={() => (status === "recording" ? stopRecording() : startRecording())}
              disabled={status === "analysing" || status === "loading" || isSpeaking || !currentSentence}
            >
              <View style={tw`items-center`}>
                <View style={tw`relative`}>
                  <Animated.View 
                    style={[
                      tw`p-3 rounded-xl mb-3`,
                      status === "recording" ? tw`bg-white/20` : status === "analysing" ? tw`bg-white/20` : tw`bg-rose-500/20`,
                      { transform: [{ translateY: iconTranslateY }] }
                    ]}
                  >
                    {status === "analysing" ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : status === "recording" ? (
                      <Square size={24} color="white" strokeWidth={2} fill="white" />
                    ) : (
                      <Mic size={24} color="#f43f5e" strokeWidth={2} />
                    )}
                  </Animated.View>
                  {status === "recording" && (
                    <Animated.View
                      style={[
                        tw`absolute -top-1 -right-1 w-3 h-3 bg-rose-300 rounded-full border border-white`,
                        { transform: [{ scale: recordPulseAnim }] }
                      ]}
                    />
                  )}
                </View>
                <Text style={[
                  tw`text-sm font-bold uppercase tracking-wide`,
                  status === "recording" || status === "analysing" ? tw`text-white` : tw`text-slate-700`
                ]}>
                  {status === "recording" ? "Stop" : status === "analysing" ? "Analyzing" : "Record"}
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Change Button */}
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
              disabled={status !== "idle"}
            >
              <View style={tw`items-center`}>
                <Animated.View 
                  style={[
                    tw`p-3 rounded-xl mb-3 bg-amber-500/20`,
                    { transform: [{ translateY: iconTranslateY }] }
                  ]}
                >
                  <RefreshCw size={24} color="#f59e0b" strokeWidth={2} />
                </Animated.View>
                <Text style={tw`text-sm font-bold uppercase tracking-wide text-slate-700`}>
                  Change
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}