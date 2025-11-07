"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, ScrollView, Pressable, Switch, Animated, StatusBar } from "react-native"
import tw from "twrnc"
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Volume2,
  Globe,
  User,
  Shield,
  HelpCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext"

type SettingItem = {
  id: string
  title: string
  description: string
  icon: any
  type: "toggle" | "navigation"
  value?: boolean
  onToggle?: (value: boolean) => void
}

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const headerSlideAnim = useRef(new Animated.Value(-30)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const shimmerAnim = useRef(new Animated.Value(0)).current
  const floatAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: 200,
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

  const settingsSections = [
    {
      title: "Appearance",
      items: [
        {
          id: "theme",
          title: "Dark Mode",
          description: "Switch between light and dark theme",
          icon: theme === "dark" ? Moon : Sun,
          type: "toggle" as const,
          value: theme === "dark",
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          title: "Notifications",
          description: "Receive updates and alerts",
          icon: Bell,
          type: "toggle" as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: "sound",
          title: "Sound Effects",
          description: "Enable audio feedback and sounds",
          icon: Volume2,
          type: "toggle" as const,
          value: soundEffects,
          onToggle: setSoundEffects,
        },
      ],
    },
    {
      title: "Personalization",
      items: [
        {
          id: "profile",
          title: "Profile",
          description: "Manage your account settings",
          icon: User,
          type: "navigation" as const,
        },
        {
          id: "history",
          title: "History",
          description: "View your activity history",
          icon: Globe,
          type: "navigation" as const,
        },
        {
          id: "privacy",
          title: "Privacy & Security",
          description: "Manage your data and privacy",
          icon: Shield,
          type: "navigation" as const,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          title: "Help Center",
          description: "Get help and support",
          icon: HelpCircle,
          type: "navigation" as const,
        },
      ],
    },
  ]

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

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
            <SettingsIcon size={32} color={colors.accent} />
          </Animated.View>
          <Text style={[tw`text-4xl font-bold tracking-tight`, { color: colors.text }]}>Settings</Text>
        </View>
        <Text style={[tw`text-base`, { color: colors.textSecondary }]}>Customize your experience</Text>
      </Animated.View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 pb-8`}>
        {settingsSections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            style={[
              tw`mb-8`,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + sectionIndex * 10],
                    }),
                  },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <View style={tw`flex-row items-center gap-2 mb-4 px-2`}>
              <Sparkles size={14} color={colors.accent} />
              <Text style={[tw`text-xs uppercase tracking-wider font-semibold`, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
            </View>

            <View
              style={[
                tw`rounded-3xl border overflow-hidden`,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  <Animated.View style={tw`overflow-hidden`}>
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

                    <Pressable
                      style={({ pressed }) =>
                        tw.style("flex-row items-center p-5 gap-4", pressed && "opacity-70", {
                          backgroundColor: pressed ? `${colors.accent}0D` : "transparent",
                        })
                      }
                      onPress={() => {
                        if (item.type === "toggle" && item.onToggle) {
                          item.onToggle(!item.value)
                        }
                      }}
                    >
                      <View
                        style={[
                          tw`w-12 h-12 rounded-2xl items-center justify-center`,
                          { backgroundColor: `${colors.accent}1A` },
                        ]}
                      >
                        <item.icon size={22} color={colors.accent} />
                      </View>

                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-base font-semibold mb-1`, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[tw`text-sm`, { color: colors.textSecondary }]}>{item.description}</Text>
                      </View>

                      {item.type === "toggle" ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ false: colors.border, true: colors.accent }}
                          thumbColor="white"
                        />
                      ) : (
                        <ChevronRight size={20} color={colors.textSecondary} />
                      )}
                    </Pressable>
                  </Animated.View>

                  {itemIndex < section.items.length - 1 && (
                    <View style={[tw`h-px mx-5`, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        ))}

        <Animated.View
          style={[
            tw`rounded-3xl p-6 border items-center`,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={[tw`text-sm text-center mb-1`, { color: colors.textSecondary }]}>Yaplingo v1.0.0</Text>
          <Text style={[tw`text-xs text-center`, { color: colors.textSecondary }]}>
            Made with AI-powered technology
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  )
}
