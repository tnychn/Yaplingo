"use client"

import { useEffect, useState, useRef } from "react"
import { Alert, Pressable, Text, View, ScrollView, Animated, StatusBar } from "react-native"
import { useMutation } from "@tanstack/react-query"
import { AudioModule, AudioQuality, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio"
import axios from "axios"
import tw from "twrnc"
import { Mic, Square, Loader2, CheckCircle2, XCircle, Sparkles, Zap, TrendingUp } from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"

type Result = {
  feedback: string
  phonemes: {
    aligned: {
      token: string
      score: number
      interval: [number, number]
    }[]
    predicted: string[]
  }
} | null

const API_URL = process.env.EXPO_PUBLIC_API_URL

export default function HomeScreen() {
  const { colors } = useTheme()

  const [pulseAnim] = useState(new Animated.Value(1))
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const headerSlideAnim = useRef(new Animated.Value(-30)).current
  const cardSlideAnim = useRef(new Animated.Value(30)).current
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current
  const resultFadeAnim = useRef(new Animated.Value(0)).current
  const resultSlideAnim = useRef(new Animated.Value(20)).current
  const [glowAnim] = useState(new Animated.Value(0))
  const rotateAnim = useRef(new Animated.Value(0)).current
  const bounceAnim = useRef(new Animated.Value(0)).current
  const waveAnim1 = useRef(new Animated.Value(0)).current
  const waveAnim2 = useRef(new Animated.Value(0)).current
  const waveAnim3 = useRef(new Animated.Value(0)).current
  const shimmerAnim = useRef(new Animated.Value(0)).current
  const floatAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const cardRotateAnim = useRef(new Animated.Value(0)).current

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

  const mutation = useMutation({
    mutationFn: async (uri: string) => {
      const data = new FormData()
      // @ts-expect-error React Native FormData issue
      data.append("audio", { uri, name: "audio.wav", type: "audio/vnd.wav" })
      const response = await axios.post(`${API_URL}/teach/1`, data, {
        validateStatus: () => true,
      })
      if (response.status !== 200) {
        throw new Error(response.data as string)
      }
      return response.data as Result
    },
  })

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
  }, [])

  useEffect(() => {
    ;(async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync()
      if (!status.granted) return Alert.alert("Permission Denied")
    })()
  }, [])

  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ).start()

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start()

      Animated.loop(
        Animated.timing(waveAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ).start()

      Animated.loop(
        Animated.timing(waveAnim2, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ).start()

      Animated.loop(
        Animated.timing(waveAnim3, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ).start()

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      pulseAnim.setValue(1)
      glowAnim.setValue(0)
      waveAnim1.setValue(0)
      waveAnim2.setValue(0)
      waveAnim3.setValue(0)
      bounceAnim.setValue(0)
    }
  }, [recorderState.isRecording])

  useEffect(() => {
    if (mutation.isSuccess || mutation.isError) {
      resultFadeAnim.setValue(0)
      resultSlideAnim.setValue(30)
      scaleAnim.setValue(0.8)

      Animated.parallel([
        Animated.timing(resultFadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(resultSlideAnim, {
          toValue: 0,
          tension: 45,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [mutation.isSuccess, mutation.isError])

  async function startRecording() {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    })
    await recorder.prepareToRecordAsync()
    recorder.record()
    mutation.reset()
  }

  async function stopRecording() {
    await recorder.stop()
    if (recorder.uri) {
      mutation.mutate(recorder.uri)
    }
  }

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.9],
  })

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

  const wave1Scale = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  })

  const wave1Opacity = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  })

  const wave2Scale = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  })

  const wave2Opacity = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  })

  const wave3Scale = waveAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.9],
  })

  const wave3Opacity = waveAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  })

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[tw`absolute inset-0 opacity-5`, { transform: [{ rotate }] }]}>
        <View style={tw`flex-1`}>
          {[...Array(25)].map((_, i) => (
            <View key={i} style={[tw`h-px`, { backgroundColor: colors.text }]} />
          ))}
        </View>
      </Animated.View>

      <Animated.View
        style={[
          tw`pt-16 pb-8 px-6`,
          {
            opacity: fadeAnim,
            transform: [{ translateY: headerSlideAnim }],
          },
        ]}
      >
        <View style={tw`flex-row items-center gap-3 mb-2`}>
          <Animated.View
            style={[
              tw`w-1.5 h-10 rounded-full`,
              { backgroundColor: colors.accent, transform: [{ rotate: cardRotate }] },
            ]}
          />
          <Text style={[tw`text-4xl font-bold tracking-tight`, { color: colors.text }]}>Yaplingo</Text>
          <Animated.View style={[tw`ml-2`, { transform: [{ translateY: floatAnim }] }]}>
            <Sparkles size={20} color={colors.accent} />
          </Animated.View>
        </View>
        <Text style={[tw`text-base ml-4`, { color: colors.textSecondary }]}>AI-powered pronunciation training</Text>
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
                Current Lesson
              </Text>
              <Text style={[tw`text-2xl font-bold`, { color: colors.text }]}>Lesson 1</Text>
            </View>
            <Animated.View
              style={[
                tw`px-5 py-2.5 rounded-full border`,
                {
                  backgroundColor: `${colors.accent}1A`,
                  borderColor: `${colors.accent}33`,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={[tw`text-sm font-semibold`, { color: colors.accent }]}>Active</Text>
            </Animated.View>
          </View>

          <View style={[tw`h-px my-5`, { backgroundColor: colors.border }]} />

          <View
            style={[
              tw`rounded-2xl p-4 border`,
              { backgroundColor: `${colors.background}66`, borderColor: colors.border },
            ]}
          >
            <View style={tw`flex-row items-center gap-2 mb-2`}>
              <Zap size={14} color={colors.accent} />
              <Text style={[tw`text-xs uppercase tracking-wider`, { color: colors.textSecondary }]}>Instructions</Text>
            </View>
            <Text style={[tw`text-base leading-6`, { color: colors.textSecondary }]}>
              Press the microphone button and speak clearly. Our AI will analyze your pronunciation and provide instant
              feedback.
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            tw`items-center py-12`,
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScaleAnim }],
            },
          ]}
        >
          <View style={tw`relative mb-8`}>
            {recorderState.isRecording && (
              <>
                <Animated.View
                  style={[
                    tw`absolute inset-0 rounded-full`,
                    {
                      opacity: wave1Opacity,
                      transform: [{ scale: wave1Scale }],
                      backgroundColor: "#ef4444",
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    tw`absolute inset-0 rounded-full`,
                    {
                      opacity: wave2Opacity,
                      transform: [{ scale: wave2Scale }],
                      backgroundColor: "#ef4444",
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    tw`absolute inset-0 rounded-full`,
                    {
                      opacity: wave3Opacity,
                      transform: [{ scale: wave3Scale }],
                      backgroundColor: "#ef4444",
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    tw`absolute inset-0 rounded-full`,
                    {
                      opacity: glowOpacity,
                      transform: [{ scale: pulseAnim }],
                      backgroundColor: "#ef4444",
                      shadowColor: "#ef4444",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.9,
                      shadowRadius: 50,
                    },
                  ]}
                />
              </>
            )}

            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <Pressable
                style={({ pressed }) =>
                  tw.style(
                    "w-36 h-36 rounded-full items-center justify-center border-2",
                    recorderState.isRecording ? "bg-red-500 border-red-400/50" : `border-[${colors.accent}]/50`,
                    !recorderState.isRecording && { backgroundColor: colors.accent },
                    pressed && "opacity-90",
                  )
                }
                onPress={() => (recorderState.isRecording ? stopRecording() : startRecording())}
              >
                {recorderState.isRecording ? (
                  <Square size={52} color="white" fill="white" />
                ) : (
                  <Mic size={52} color="white" />
                )}
              </Pressable>
            </Animated.View>
          </View>

          <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
            <Text style={[tw`text-xl font-bold mb-2`, { color: colors.text }]}>
              {recorderState.isRecording ? "Recording..." : "Tap to Record"}
            </Text>
          </Animated.View>
          <Text style={[tw`text-sm text-center px-8`, { color: colors.textSecondary }]}>
            {recorderState.isRecording ? "Speak clearly into your microphone" : "Press and hold to start recording"}
          </Text>
        </Animated.View>

        {mutation.isPending && (
          <Animated.View
            style={[
              tw`rounded-3xl p-8 border items-center`,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: resultFadeAnim,
                transform: [{ translateY: resultSlideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                tw`w-16 h-16 rounded-full items-center justify-center mb-4`,
                {
                  backgroundColor: `${colors.accent}1A`,
                  transform: [{ rotate }],
                },
              ]}
            >
              <Loader2 size={36} color={colors.accent} />
            </Animated.View>
            <Text style={[tw`text-xl font-bold mb-2`, { color: colors.text }]}>Analyzing...</Text>
            <Text style={[tw`text-sm text-center`, { color: colors.textSecondary }]}>
              Our AI is processing your pronunciation
            </Text>
          </Animated.View>
        )}

        {mutation.isSuccess && mutation.data && (
          <Animated.View
            style={[
              tw`rounded-3xl p-6 border`,
              {
                backgroundColor: colors.card,
                borderColor: `${colors.accent}4D`,
                opacity: resultFadeAnim,
                transform: [{ translateY: resultSlideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={tw`flex-row items-center gap-4 mb-6`}>
              <Animated.View
                style={[
                  tw`w-14 h-14 rounded-2xl items-center justify-center border`,
                  {
                    backgroundColor: `${colors.accent}1A`,
                    borderColor: `${colors.accent}33`,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <CheckCircle2 size={28} color={colors.accent} />
              </Animated.View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-xl font-bold mb-1`, { color: colors.text }]}>Analysis Complete</Text>
                <View style={tw`flex-row items-center gap-1`}>
                  <TrendingUp size={14} color={colors.success} />
                  <Text style={[tw`text-sm`, { color: colors.textSecondary }]}>Here's your detailed feedback</Text>
                </View>
              </View>
            </View>

            <View
              style={[
                tw`rounded-2xl p-5 mb-5 border`,
                { backgroundColor: `${colors.background}99`, borderColor: colors.border },
              ]}
            >
              <Text style={[tw`text-xs uppercase tracking-wider mb-3`, { color: colors.textSecondary }]}>
                AI Feedback
              </Text>
              <Text style={[tw`text-base leading-7`, { color: colors.text }]}>{mutation.data.feedback}</Text>
            </View>

            {mutation.data.phonemes?.aligned && (
              <View>
                <Text style={[tw`text-xs uppercase tracking-wider mb-4`, { color: colors.textSecondary }]}>
                  Phoneme Analysis
                </Text>
                <View style={tw`flex-row flex-wrap gap-2.5`}>
                  {mutation.data.phonemes.aligned.map((phoneme, idx) => (
                    <Animated.View
                      key={idx}
                      style={[
                        tw`px-4 py-3 rounded-xl border`,
                        {
                          backgroundColor:
                            phoneme.score >= 0.8
                              ? `${colors.success}1A`
                              : phoneme.score >= 0.6
                                ? `${colors.warning}1A`
                                : `${colors.error}1A`,
                          borderColor:
                            phoneme.score >= 0.8
                              ? `${colors.success}4D`
                              : phoneme.score >= 0.6
                                ? `${colors.warning}4D`
                                : `${colors.error}4D`,
                          transform: [{ scale: scaleAnim }],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-base font-bold mb-1`,
                          {
                            color:
                              phoneme.score >= 0.8
                                ? colors.success
                                : phoneme.score >= 0.6
                                  ? colors.warning
                                  : colors.error,
                          },
                        ]}
                      >
                        {phoneme.token}
                      </Text>
                      <Text style={[tw`text-xs font-medium`, { color: colors.textSecondary }]}>
                        {Math.round(phoneme.score * 100)}%
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {mutation.isError && (
          <Animated.View
            style={[
              tw`rounded-3xl p-6 border`,
              {
                backgroundColor: colors.card,
                borderColor: `${colors.error}4D`,
                opacity: resultFadeAnim,
                transform: [{ translateY: resultSlideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={tw`flex-row items-center gap-4 mb-4`}>
              <View
                style={[
                  tw`w-14 h-14 rounded-2xl items-center justify-center border`,
                  {
                    backgroundColor: `${colors.error}1A`,
                    borderColor: `${colors.error}33`,
                  },
                ]}
              >
                <XCircle size={28} color={colors.error} />
              </View>
              <Text style={[tw`text-xl font-bold flex-1`, { color: colors.text }]}>Error Occurred</Text>
            </View>
            <Text style={[tw`text-sm leading-6`, { color: colors.error }]}>{mutation.error.message}</Text>
          </Animated.View>
        )}

        {mutation.isSuccess && !mutation.data && (
          <Animated.View
            style={[
              tw`rounded-3xl p-6 border`,
              {
                backgroundColor: colors.card,
                borderColor: `${colors.warning}4D`,
                opacity: resultFadeAnim,
                transform: [{ translateY: resultSlideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={tw`flex-row items-center gap-4 mb-4`}>
              <View
                style={[
                  tw`w-14 h-14 rounded-2xl items-center justify-center border`,
                  {
                    backgroundColor: `${colors.warning}1A`,
                    borderColor: `${colors.warning}33`,
                  },
                ]}
              >
                <Mic size={28} color={colors.warning} />
              </View>
              <Text style={[tw`text-xl font-bold flex-1`, { color: colors.text }]}>No Audio Detected</Text>
            </View>
            <Text style={[tw`text-sm leading-6`, { color: colors.warning }]}>
              We couldn't detect any speech. Please try again and speak more clearly.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  )
}
