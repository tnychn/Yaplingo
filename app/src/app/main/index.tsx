import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { CalendarIcon, ZapIcon } from "lucide-react-native";
import tw from "twrnc";

import { useAchievementsQuery, useActiveEventsQuery, useClaimAchievementMutation, useCurrentUserQuery, useGemBalanceQuery, type ActiveEvent, type User } from "~/client";
import { AchievementGrid, GemShop } from "~/components";
import { Spinner, Text } from "~/components/primitives";
import { useNavigationOptions, useTomorrowCountdown } from "~/hooks";
import { formatCompactNumber } from "~/utils";

import { ActivityCard, StreakCard } from "./profile";

const GEM_ICON_SOURCE = require("../../../assets/gem.png");

const Header = ({ user }: { user?: User }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        tw`border-b pb-2`,
        {
          paddingTop: insets.top,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        },
      ]}>
      <View style={tw`h-10 flex-row items-center justify-between px-4`}>
        <View style={tw`flex-row items-center gap-1.5`}>
          <CalendarIcon size={18} strokeWidth={2.5} color={theme.colors.text} />
          <Text style={tw`text-lg font-medium`}>
            {new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
          </Text>
        </View>
        <View style={tw`absolute inset-x-0 items-center justify-center`}>
          <Text style={[tw`text-3xl leading-[0] text-green-500`, { fontFamily: "Feather-Bold" }]}>yaplingo</Text>
        </View>
        <View style={tw`flex-row items-center gap-1.5 rounded-full bg-sky-500/25 px-2.5 py-0.5`}>
          <ZapIcon size={16} color={tw.color("sky-500")} fill={tw.color("sky-500")} />
          <Text style={tw`text-lg font-bold tracking-tighter text-sky-500`}>
            {user ? formatCompactNumber(user.points[1]) : "-"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const MilestoneCard = ({ user }: { user: User }) => {
  const [points] = user.points; // only care about daily points for milestone progress
  const remaining = user.milestone - points;
  const progress = Math.round((points / user.milestone) * 100);

  const countdown = useTomorrowCountdown();

  return (
    <View style={tw`grow items-center justify-center gap-2 rounded-2xl border-2 border-zinc-500/50 p-4`}>
      {remaining > 0 ? (
        <View>
          <Text style={tw`text-center text-3xl font-bold tracking-tighter text-sky-500`}>{remaining} XP</Text>
          <Text style={tw`text-center text-base font-medium`}>to bump your streak</Text>
          {user.streak > 0 && (
            <Text style={tw`text-center text-sm font-medium text-neutral-500`}>streak resets at {countdown}</Text>
          )}
        </View>
      ) : (
        <View>
          <Text style={tw`text-center text-3xl font-bold tracking-tighter text-sky-500`}>{user.milestone} XP</Text>
          <Text style={tw`text-center text-lg font-medium`}>Completed</Text>
          <Text style={tw`text-center text-sm font-medium text-neutral-500`}>next milestone at {countdown}</Text>
        </View>
      )}
      <View style={tw`flex-row items-center justify-center gap-2`}>
        <Text style={tw`text-xs font-medium tracking-tighter text-neutral-500`}>0</Text>
        <View style={tw`w-32 items-stretch justify-center`}>
          <View style={tw`h-2.5 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800`}>
            <View style={[tw`h-full bg-sky-500`, { width: `${progress}%` }]} />
          </View>
        </View>
        <Text
          style={tw.style(
            "text-xs font-medium tracking-tighter text-neutral-500",
            points > user.milestone && "font-bold text-sky-500",
          )}>
          {Math.max(user.milestone, points)}
        </Text>
      </View>
    </View>
  );
};

const hasTimezone = (value: string): boolean => /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(value);

const parseServerUtcMs = (value: string): number => {
  const normalized = hasTimezone(value) ? value : `${value}Z`;
  return new Date(normalized).getTime();
};

const getSecondsLeft = (endsAt: string, nowMs: number): number => {
  const endMs = parseServerUtcMs(endsAt);
  if (!Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.floor((endMs - nowMs) / 1000));
};

const formatBoostTime = (secs: number): string => {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs}h ${m}m`;
  }
  return `${mins}:${s.toString().padStart(2, "0")}`;
};

const GemShopCard = ({ onPress, activeBoost }: { onPress: () => void; activeBoost?: { event: ActiveEvent; secondsLeft: number } }) => {
  const isMegaBoost = activeBoost && activeBoost.event.multiplier >= 10;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tw`rounded-2xl border-2 border-zinc-500/50 bg-white dark:bg-zinc-900 overflow-hidden`,
        { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}>
      <View style={tw`p-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center gap-3`}>
            <View style={tw`w-14 h-14 rounded-xl items-center justify-center bg-emerald-100`}>
              <Image source={GEM_ICON_SOURCE} resizeMode="contain" style={{ width: 36, height: 36 }} />
            </View>
            <View>
              <Text style={tw`text-lg font-bold text-zinc-800 dark:text-zinc-100`}>Gem Shop</Text>
              <Text style={tw`text-xs text-zinc-500`}>Boost and rewards</Text>
            </View>
          </View>
        </View>
        {activeBoost && (
          <View style={tw`mt-3 flex-row items-center justify-between px-4 py-3 rounded-xl border-2 border-zinc-500/50 bg-white dark:bg-zinc-900`}>
            <View style={tw`flex-row items-center gap-2`}>
              <ZapIcon size={20} color={isMegaBoost ? "#8B5CF6" : "#F97316"} fill={isMegaBoost ? "#8B5CF6" : "#F97316"} strokeWidth={0} />
              <Text style={tw`text-sm font-bold text-zinc-800 dark:text-zinc-100`}>{activeBoost.event.multiplier}× XP BOOST ACTIVE</Text>
            </View>
            <Text style={tw`text-2xl font-bold ${isMegaBoost ? "text-purple-600" : "text-orange-600"}`}>{formatBoostTime(activeBoost.secondsLeft)}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default function MainHomeScreen() {
  const { data: user } = useCurrentUserQuery();
  const { data: achievements = [] } = useAchievementsQuery();
  const { data: gemBalance } = useGemBalanceQuery();
  const { data: activeEvents = [] } = useActiveEventsQuery();
  const claimAchievement = useClaimAchievementMutation();
  const [shopVisible, setShopVisible] = useState(false);
  const [now, setNow] = useState(Date.now());

  const handleClaim = useCallback(
    (achievementKey: string) => {
      claimAchievement.mutate(
        { achievement_key: achievementKey },
        {
          onSuccess: (data) => Alert.alert("Collected", `+${data.gems_awarded} gems added.`),
          onError: () => Alert.alert("Unable to claim", "This achievement is not claimable yet."),
        },
      );
    },
    [claimAchievement],
  );

  const claimingKey = claimAchievement.isPending ? (claimAchievement.variables?.achievement_key ?? null) : null;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeBoost = useMemo(
    () =>
      activeEvents
        .map((event) => ({
          event,
          secondsLeft: getSecondsLeft(event.ends_at, now),
        }))
        .filter(({ secondsLeft }) => secondsLeft > 0)
        .sort((a, b) => b.event.multiplier - a.event.multiplier)[0],
    [activeEvents, now],
  );

  useNavigationOptions({ header: () => <Header user={user} /> });

  if (!user) {
    return (
      <View style={tw`flex-1 items-center justify-center`}>
        <Spinner size={36} />
      </View>
    );
  }
  return (
    <ScrollView style={tw`flex-1`} contentContainerStyle={tw`gap-4 p-4 pb-8`}>
      <View style={tw`flex-row gap-4`}>
        <StreakCard user={user} />
        <MilestoneCard user={user} />
      </View>
      <ActivityCard user={user} />
      <GemShopCard onPress={() => setShopVisible(true)} activeBoost={activeBoost} />
      {achievements.length > 0 && (
        <AchievementGrid
          achievements={achievements}
          gemBalance={gemBalance?.balance ?? 0}
          onClaim={handleClaim}
          claimingKey={claimingKey}
        />
      )}
      <GemShop visible={shopVisible} onClose={() => setShopVisible(false)} />
    </ScrollView>
  );
}
