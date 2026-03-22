import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  View,
  type ImageSourcePropType,
} from "react-native";
import Animated, {
  FadeIn,
  ZoomIn,
} from "react-native-reanimated";
import {
  AwardIcon,
} from "lucide-react-native";
import tw from "twrnc";

import type { AchievementResponse } from "~/client/models";

import Text from "./Text";
import Button from "./Button";


type BadgeConfig = {
  color: string;
  icon: ImageSourcePropType;
  iconScale?: number;
};

const BADGE_CONFIG: Record<string, BadgeConfig> = {
  first_step:      { color: "#22C55E", icon: require("@/icons/achievements/firststep.png") },
  bronze_mic:      { color: "#CD7F32", icon: require("@/icons/achievements/bronzemic.png"), iconScale: 1.45 },
  silver_mic:      { color: "#9CA3AF", icon: require("@/icons/achievements/silvermic.png"), iconScale: 1.45 },
  gold_mic:        { color: "#F59E0B", icon: require("@/icons/achievements/goldmic.png"), iconScale: 1.45 },
  platinum_mic:    { color: "#A78BFA", icon: require("@/icons/achievements/platinummic.png"), iconScale: 1.45 },
  diamond_mic:     { color: "#06B6D4", icon: require("@/icons/achievements/diamondmic.png"), iconScale: 1.45 },
  streak_5:        { color: "#F97316", icon: require("@/icons/achievements/onfire.png") },
  streak_14:       { color: "#EF4444", icon: require("@/icons/achievements/2weeks.png") },
  streak_30:       { color: "#8B5CF6", icon: require("@/icons/achievements/unstoppable.png") },
  streak_100:      { color: "#EC4899", icon: require("@/icons/achievements/century.png") },
  streak_365:      { color: "#FBBF24", icon: require("@/icons/achievements/yearofyap.png") },
  lesson_50:       { color: "#3B82F6", icon: require("@/icons/achievements/halfcentury.png") },
  lesson_200:      { color: "#6366F1", icon: require("@/icons/achievements/dedicated.png") },
  lesson_500:      { color: "#14B8A6", icon: require("@/icons/achievements/lessonlegend.png") },
  weekly_champ:    { color: "#F59E0B", icon: require("@/icons/achievements/weeklychampion.png") },
  alltime_legend:  { color: "#FFD700", icon: require("@/icons/achievements/alltimelegend.png") },
};

const BADGE_SIZE = 72;
const BADGE_ICON_SIZE = 32;
const MODAL_ICON_SIZE = 46;

const AchievementImageIcon = ({
  config,
  size,
  dimmed = false,
}: {
  config?: BadgeConfig;
  size: number;
  dimmed?: boolean;
}) => {
  if (!config) {
    return <AwardIcon size={size} color="#9CA3AF" strokeWidth={2} opacity={dimmed ? 0.35 : 1} />;
  }

  const scaledSize = size * (config.iconScale ?? 1);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={config.icon}
        resizeMode="contain"
        style={{ width: scaledSize, height: scaledSize, opacity: dimmed ? 0.35 : 1 }}
      />
    </View>
  );
};


const AchievementBadge = ({
  item,
  index,
  onPress,
}: {
  item: AchievementResponse;
  index: number;
  onPress: () => void;
}) => {
  const cfg = BADGE_CONFIG[item.key];
  const entering = item.unlocked
    ? ZoomIn.delay(index * 40).duration(250)
    : FadeIn.delay(index * 25).duration(200);

  const progressPct = Math.round(item.progress * 100);
  const isComplete = !item.unlocked && progressPct >= 100;
  const isUltimate = item.ultimate;
  const isLocked = !item.unlocked && !isComplete;

  return (
    <Animated.View entering={entering} style={tw`flex-1 items-center py-2.5 px-1`}>
      <Pressable onPress={onPress} style={tw`items-center`}>
        <View
          style={[
            {
              width: BADGE_SIZE,
              height: BADGE_SIZE,
              borderRadius: BADGE_SIZE / 2,
              borderWidth: isUltimate ? 3.5 : item.unlocked ? 3 : 2,
              borderColor: item.unlocked
                ? cfg?.color ?? "#9CA3AF"
                : isComplete
                  ? "#22C55E"
                  : "#D1D5DB",
              backgroundColor: item.unlocked
                ? `${cfg?.color ?? "#9CA3AF"}15`
                : isComplete
                  ? "#22C55E10"
                  : "#F9FAFB",
              alignItems: "center",
              justifyContent: "center",
            },
            item.unlocked && {
              shadowColor: cfg?.color ?? "#9CA3AF",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isUltimate ? 0.7 : 0.4,
              shadowRadius: isUltimate ? 16 : 10,
              elevation: isUltimate ? 12 : 8,
            },
            isComplete && {
              shadowColor: "#22C55E",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 6,
            },
            isUltimate && !item.unlocked && !isComplete && {
              borderColor: "#FFD70060",
              borderWidth: 2.5,
            },
          ]}
        >
          <AchievementImageIcon config={cfg} size={BADGE_ICON_SIZE} dimmed={isLocked} />
        </View>

        {/* Title */}
        <Text
          style={tw.style(
            "text-[11px] font-bold text-center mt-1.5",
                item.unlocked
                  ? "text-zinc-800 dark:text-zinc-100"
                  : isComplete
                    ? "text-green-600"
                    : "text-zinc-400",
            )}
            numberOfLines={1}
        >
          {item.title}
        </Text>

        {/* Progress bar */}
        {!item.unlocked && (
          <View
            style={tw`w-14 h-1.5 rounded-full mt-1 overflow-hidden bg-zinc-200 dark:bg-zinc-700`}
          >
            <View
              style={[
                tw`h-full rounded-full`,
                {
                  width: `${progressPct}%`,
                  backgroundColor: isComplete ? "#22C55E" : progressPct > 0 ? (cfg?.color ?? "#9CA3AF") : "transparent",
                },
              ]}
            />
          </View>
        )}

        {/* Status */}
        {item.unlocked ? (
          <View
            style={[
              tw`mt-1 rounded-full px-2 py-0.5`,
              { backgroundColor: `${cfg?.color ?? "#9CA3AF"}18` },
            ]}
          >
            <Text style={[tw`text-[9px] font-bold`, { color: cfg?.color ?? "#9CA3AF" }]}>
              ✓ Earned
            </Text>
          </View>
        ) : isComplete ? (
          <View style={tw`mt-1 rounded-full bg-green-500 px-2 py-0.5`}>
            <Text style={tw`text-[9px] font-bold text-white`}>Completed</Text>
          </View>
        ) : progressPct > 0 ? (
          <Text style={tw`text-[9px] font-medium text-zinc-400 mt-1`}>
            {progressPct}%
          </Text>
        ) : (
          <Text style={tw`text-[9px] font-medium text-zinc-300 dark:text-zinc-600 mt-1`}>
            Locked
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};


const DetailModal = ({
  item,
  onClose,
}: {
  item: AchievementResponse | null;
  onClose: () => void;
}) => {
  if (!item) return null;
  const cfg = BADGE_CONFIG[item.key];
  const progressPct = Math.round(item.progress * 100);
  const isComplete = !item.unlocked && progressPct >= 100;
  const isLocked = !item.unlocked && !isComplete;

  const getProgressMessage = () => {
    if (item.unlocked) {
      return `Earned ${new Date(item.unlocked_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    if (isComplete) return "🎉 Achievement complete!";
    if (progressPct >= 75) return "Almost there — just a little more!";
    if (progressPct >= 50) return "Halfway through — keep pushing!";
    if (progressPct > 0) return "Great start — keep it up!";
    return "Start practicing to make progress.";
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={tw`flex-1 items-center justify-center bg-black/50`}
        onPress={onClose}
      >
        <Pressable
          style={tw`mx-6 w-80 rounded-3xl bg-white dark:bg-zinc-900 p-6 items-center shadow-2xl`}
          onPress={() => {}}
        >
          {/* Badge */}
          <View
            style={[
              {
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 3,
                borderColor: item.unlocked ? (cfg?.color ?? "#9CA3AF") : isComplete ? "#22C55E" : "#D1D5DB",
                backgroundColor: item.unlocked
                  ? `${cfg?.color ?? "#9CA3AF"}15`
                  : isComplete
                    ? "#22C55E10"
                    : "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              },
              (item.unlocked || isComplete) && {
                shadowColor: item.unlocked ? (cfg?.color ?? "#9CA3AF") : "#22C55E",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
              },
            ]}
          >
            <AchievementImageIcon config={cfg} size={MODAL_ICON_SIZE} dimmed={isLocked} />
          </View>

          <Text style={tw`text-xl font-bold text-center text-zinc-800 dark:text-zinc-100`}>
            {item.title}
          </Text>
          <Text style={tw`text-sm text-center text-zinc-500 mt-1`}>
            {item.desc}
          </Text>

          {/* Progress bar */}
          <View style={tw`w-full mt-4`}>
            <View style={tw`flex-row justify-between mb-1.5`}>
              <Text style={tw`text-xs font-medium text-zinc-400`}>Progress</Text>
                <Text
                  style={[
                    tw`text-xs font-bold`,
                    { color: item.unlocked || isComplete ? "#22C55E" : (cfg?.color ?? "#9CA3AF") },
                  ]}
                >
                  {progressPct}%
                </Text>
            </View>
            <View style={tw`h-2.5 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800`}>
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: item.unlocked ? (cfg?.color ?? "#9CA3AF") : "#22C55E",
                  },
                ]}
              />
            </View>
          </View>

          <Text
            style={tw.style(
              "text-xs text-center mt-3 font-medium",
              item.unlocked ? "text-zinc-500" : isComplete ? "text-green-600" : "text-zinc-400",
            )}
          >
            {getProgressMessage()}
          </Text>

          {/* Action buttons */}
          <Button
            onPress={onClose}
            style={tw`mt-4 px-8 bg-zinc-100 dark:bg-zinc-800 border-transparent`}
          >
            <Text style={tw`text-sm font-bold text-zinc-600 dark:text-zinc-300`}>Close</Text>
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
};


export default function AchievementGrid({
  achievements,
}: {
  achievements: AchievementResponse[];
}) {
  const [selected, setSelected] = useState<AchievementResponse | null>(null);

  const renderItem = useCallback(
    ({ item, index }: { item: AchievementResponse; index: number }) => (
      <AchievementBadge item={item} index={index} onPress={() => setSelected(item)} />
    ),
    [],
  );

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const completed = achievements.filter((a) => !a.unlocked && a.progress >= 1.0).length;

  return (
    <>
      <View style={tw`flex-row items-center justify-between mb-2 px-1`}>
        <Text style={tw`text-xl font-bold text-zinc-800 dark:text-zinc-100`}>
          🏅 Achievements
        </Text>
        <View style={tw`flex-row items-center gap-2`}>
          {completed > 0 && (
            <View style={tw`rounded-full bg-green-500 px-2 py-0.5`}>
              <Text style={tw`text-[10px] font-bold text-white`}>
                {completed} completed
              </Text>
            </View>
          )}
          <View style={tw`rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5`}>
            <Text style={tw`text-xs font-bold text-zinc-600 dark:text-zinc-300`}>
              {unlocked}/{achievements.length}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={achievements}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={tw`px-0.5`}
      />

      <DetailModal
        item={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
