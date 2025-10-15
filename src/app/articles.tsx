"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, ScrollView, Pressable, TextInput, Animated, StatusBar } from "react-native"
import { useMutation } from "@tanstack/react-query"
import tw from "twrnc"
import { FileText, Sparkles, Loader2, BookOpen, Clock, Zap } from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"

type Article = {
  id: string
  title: string
  content: string
  difficulty: "beginner" | "intermediate" | "advanced"
  readTime: number
  createdAt: Date
}

export default function ArticlesScreen() {
  const { colors } = useTheme()
  const [topic, setTopic] = useState("")
  const [articles, setArticles] = useState<Article[]>([])

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const headerSlideAnim = useRef(new Animated.Value(-30)).current
  const buttonScaleAnim = useRef(new Animated.Value(0.9)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const shimmerAnim = useRef(new Animated.Value(0)).current
  const floatAnim = useRef(new Animated.Value(0)).current

  const generateMutation = useMutation({
    mutationFn: async (topic: string) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return {
        id: Date.now().toString(),
        title: `Learning ${topic}: A Comprehensive Guide`,
        content: `This is an AI-generated article about ${topic}. In this comprehensive guide, we'll explore the fundamentals and advanced concepts to help you master this topic.\n\nKey points to remember:\n• Practice regularly\n• Focus on pronunciation\n• Listen to native speakers\n• Use the language in context\n\nWith consistent effort and the right approach, you'll see significant improvement in your language skills.`,
        difficulty: "intermediate" as const,
        readTime: 5,
        createdAt: new Date(),
      }
    },
    onSuccess: (data) => {
      setArticles((prev) => [data, ...prev])
      setTopic("")
    },
  })

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        delay: 300,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

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
        Animated.timing(floatAnim, {
          toValue: -6,
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
  }, [])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return colors.success
      case "intermediate":
        return colors.warning
      case "advanced":
        return colors.error
      default:
        return colors.accent
    }
  }

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
          tw`pt-16 pb-6 px-6`,
          {
            opacity: fadeAnim,
            transform: [{ translateY: headerSlideAnim }],
          },
        ]}
      >
        <View style={tw`flex-row items-center gap-3 mb-2`}>
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <FileText size={32} color={colors.accent} />
          </Animated.View>
          <Text style={[tw`text-4xl font-bold tracking-tight`, { color: colors.text }]}>Articles</Text>
        </View>
        <Text style={[tw`text-base`, { color: colors.textSecondary }]}>AI-generated learning content</Text>
      </Animated.View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 pb-8`}>
        <Animated.View
          style={[
            tw`rounded-3xl p-6 mb-8 border overflow-hidden`,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
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

          <View style={tw`flex-row items-center gap-2 mb-4`}>
            <Sparkles size={18} color={colors.accent} />
            <Text style={[tw`text-lg font-bold`, { color: colors.text }]}>Generate Article</Text>
          </View>

          <TextInput
            style={[
              tw`rounded-2xl px-5 py-4 mb-4 border text-base`,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter a topic (e.g., French greetings)"
            placeholderTextColor={colors.textSecondary}
            value={topic}
            onChangeText={setTopic}
          />

          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <Pressable
              style={({ pressed }) =>
                tw.style(
                  "rounded-2xl py-4 px-6 flex-row items-center justify-center gap-2",
                  { backgroundColor: colors.accent },
                  pressed && "opacity-90",
                  generateMutation.isPending && "opacity-70",
                )
              }
              onPress={() => topic.trim() && generateMutation.mutate(topic)}
              disabled={generateMutation.isPending || !topic.trim()}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 size={20} color="white" />
                  <Text style={tw`text-white text-base font-semibold`}>Generating...</Text>
                </>
              ) : (
                <>
                  <Zap size={20} color="white" />
                  <Text style={tw`text-white text-base font-semibold`}>Generate Article</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </Animated.View>

        {articles.length === 0 ? (
          <Animated.View
            style={[
              tw`rounded-3xl p-12 border items-center`,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View
              style={[
                tw`w-20 h-20 rounded-full items-center justify-center mb-4`,
                { backgroundColor: `${colors.accent}1A` },
              ]}
            >
              <BookOpen size={36} color={colors.accent} />
            </View>
            <Text style={[tw`text-xl font-bold mb-2 text-center`, { color: colors.text }]}>No Articles Yet</Text>
            <Text style={[tw`text-sm text-center`, { color: colors.textSecondary }]}>
              Generate your first article to start learning
            </Text>
          </Animated.View>
        ) : (
          <View style={tw`gap-4`}>
            {articles.map((article, index) => (
              <Animated.View
                key={article.id}
                style={[
                  tw`rounded-3xl p-6 border overflow-hidden`,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 30],
                          outputRange: [0, 30 + index * 10],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    tw`absolute inset-0 w-20`,
                    {
                      backgroundColor: colors.accent,
                      opacity: 0.03,
                      transform: [{ translateX: shimmerTranslate }],
                    },
                  ]}
                />

                <View style={tw`flex-row items-center gap-2 mb-3`}>
                  <View
                    style={[
                      tw`px-3 py-1.5 rounded-full`,
                      { backgroundColor: `${getDifficultyColor(article.difficulty)}1A` },
                    ]}
                  >
                    <Text
                      style={[tw`text-xs font-semibold uppercase`, { color: getDifficultyColor(article.difficulty) }]}
                    >
                      {article.difficulty}
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center gap-1`}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={[tw`text-xs`, { color: colors.textSecondary }]}>{article.readTime} min read</Text>
                  </View>
                </View>

                <Text style={[tw`text-xl font-bold mb-3`, { color: colors.text }]}>{article.title}</Text>

                <Text style={[tw`text-sm leading-6 mb-4`, { color: colors.textSecondary }]} numberOfLines={4}>
                  {article.content}
                </Text>

                <Pressable
                  style={({ pressed }) =>
                    tw.style(
                      "flex-row items-center gap-2 self-start px-4 py-2 rounded-xl border",
                      {
                        backgroundColor: `${colors.accent}1A`,
                        borderColor: `${colors.accent}33`,
                      },
                      pressed && "opacity-80",
                    )
                  }
                >
                  <BookOpen size={16} color={colors.accent} />
                  <Text style={[tw`text-sm font-semibold`, { color: colors.accent }]}>Read More</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
