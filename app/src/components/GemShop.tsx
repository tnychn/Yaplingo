import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, View, type ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  ArrowUpCircleIcon,
  PlayCircleIcon,
  RocketIcon,
  ShieldIcon,
  XIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react-native";
import tw from "twrnc";

import {
  useActiveEventsQuery,
  useGemBalanceQuery,
  useGemConfigQuery,
  useInventoryQuery,
  useSpendGemsMutation,
  useUseSkillMutation,
} from "~/client";

import { Text } from "./primitives";

type ShopItem = {
  key: string;
  title: string;
  description: string;
  fallbackCost: number;
  icon: LucideIcon;
  color: string;
  inventoryKey?: "streak_freezes";
  inventoryLabel?: (count: number) => string;
};

const SHOP_ITEMS: ShopItem[] = [
  {
    key: "streak_freeze",
    title: "Streak Restore",
    description: "Restore your streak after missing a day",
    fallbackCost: 50,
    icon: ShieldIcon,
    color: "#3B82F6",
    inventoryKey: "streak_freezes",
    inventoryLabel: (count) => `${count} restore${count !== 1 ? "s" : ""} stored`,
  },
  {
    key: "xp_boost_1h",
    title: "2× XP Boost",
    description: "Double XP for the next hour",
    fallbackCost: 100,
    icon: ZapIcon,
    color: "#F97316",
  },
  {
    key: "buy_xp_500",
    title: "Buy 500 XP",
    description: "Instantly add 500 XP to your total",
    fallbackCost: 50,
    icon: ArrowUpCircleIcon,
    color: "#22C55E",
  },
  {
    key: "xp_boost_30m_30x",
    title: "30× XP Mega Boost",
    description: "30× XP for 30 minutes — go big!",
    fallbackCost: 500,
    icon: RocketIcon,
    color: "#8B5CF6",
  },
];

const parseUtcMs = (value: string) => new Date(/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`).getTime();
const fmtCountdown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`
    : `${minutes}m ${String(secs).padStart(2, "0")}s`;
};

const GEM_SRC = require("../../assets/gem.png");
const CARD: ViewStyle = {
  backgroundColor: "#FFF",
  borderRadius: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.25,
  shadowRadius: 28,
  elevation: 12,
};
const BTN_BORDER = 2;
const BTN_BORDER_SHADOW = BTN_BORDER * 2.5;

const GemIcon = ({ size, dim }: { size: number; dim?: boolean }) => (
  <Image source={GEM_SRC} resizeMode="contain" style={{ width: size * 1.3, height: size * 1.3, opacity: dim ? 0.45 : 1 }} />
);

const ShopButton = ({
  enabled,
  icon,
  label,
  onPress,
}: {
  enabled: boolean;
  icon?: ReactNode;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={enabled ? onPress : undefined}
    disabled={!enabled}
    style={({ pressed }) => [
      tw`flex-row items-center justify-center gap-2 px-5 py-2.5 rounded-xl`,
      {
        backgroundColor: enabled ? "#F4F4F5" : "#FAFAFA",
        borderWidth: BTN_BORDER,
        borderColor: enabled ? "rgba(113,113,122,0.5)" : "rgba(113,113,122,0.25)",
        borderBottomWidth: pressed && enabled ? BTN_BORDER : BTN_BORDER_SHADOW,
        borderBottomColor: enabled ? "rgba(113,113,122,0.5)" : "rgba(113,113,122,0.25)",
        transform: [{ scale: pressed && enabled ? 0.95 : 1 }],
        opacity: enabled ? 1 : 0.5,
        marginTop: pressed && enabled ? BTN_BORDER_SHADOW - BTN_BORDER : 0,
      },
    ]}>
    {icon}
    <Text style={[tw`text-base font-bold`, { color: enabled ? "#18181B" : "#9CA3AF" }]}>{label}</Text>
  </Pressable>
);

const ItemCard = ({
  item,
  cost,
  canAfford,
  inventoryCount,
  onBuy,
}: {
  item: ShopItem;
  cost: number;
  canAfford: boolean;
  inventoryCount?: number;
  onBuy: () => void;
}) => {
  const Icon = item.icon;
  return (
    <Pressable
      onPress={canAfford ? onBuy : undefined}
      style={({ pressed }) => [
        tw`flex-row items-center px-4 py-3.5 gap-3 mb-3`,
        CARD,
        {
          opacity: canAfford ? (pressed ? 0.9 : 1) : 0.92,
          transform: [{ scale: pressed && canAfford ? 0.99 : 1 }],
        },
      ]}>
      <View style={[tw`w-11 h-11 rounded-full items-center justify-center`, { backgroundColor: `${item.color}15` }]}>
        <Icon size={22} color={item.color} strokeWidth={2} />
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`text-[15px] font-semibold text-zinc-900 dark:text-zinc-100`}>{item.title}</Text>
        <Text style={tw`text-[13px] text-zinc-500 mt-0.5`}>{item.description}</Text>
        {item.inventoryLabel && inventoryCount != null && inventoryCount > 0 && (
          <Text style={[tw`text-[11px] font-medium mt-0.5`, { color: item.color }]}>{item.inventoryLabel(inventoryCount)}</Text>
        )}
      </View>
      <ShopButton
        enabled={canAfford}
        icon={<GemIcon size={22} dim={!canAfford} />}
        label={String(cost)}
        onPress={onBuy}
      />
    </Pressable>
  );
};

const BoostCard = ({
  event,
  secondsLeft,
}: {
  event: { id: string; multiplier: number };
  secondsLeft: number;
}) => {
  const color = event.multiplier >= 10 ? "#8B5CF6" : "#F97316";
  return (
    <View style={[tw`flex-row items-center gap-3 px-4 py-3.5 mb-3`, CARD]}>
      <View style={[tw`w-11 h-11 rounded-full items-center justify-center`, { backgroundColor: `${color}15` }]}>
        <ZapIcon size={22} color={color} fill={color} strokeWidth={0} />
      </View>
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center gap-2`}>
          <Text style={tw`text-[15px] font-semibold text-zinc-900 dark:text-zinc-100`}>{event.multiplier}× XP Boost</Text>
          <View style={[tw`px-1.5 py-0.5 rounded`, { backgroundColor: `${color}20` }]}>
            <Text style={[tw`text-[10px] font-bold`, { color }]}>ACTIVE</Text>
          </View>
        </View>
        <Text style={tw`text-[13px] text-zinc-500 mt-0.5`}>{fmtCountdown(secondsLeft)} remaining</Text>
      </View>
    </View>
  );
};

const SkillCard = ({
  item,
  count,
  onUse,
}: {
  item: ShopItem;
  count: number;
  onUse: () => void;
}) => {
  const Icon = item.icon;
  const empty = count === 0;
  return (
    <Pressable
      onPress={empty ? undefined : onUse}
      disabled={empty}
      style={({ pressed }) => [
        tw`flex-row items-center px-4 py-3.5 gap-3 mb-3`,
        CARD,
        { opacity: empty ? 0.92 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !empty ? 0.99 : 1 }] },
      ]}>
      <View style={[tw`w-11 h-11 rounded-full items-center justify-center`, { backgroundColor: empty ? "#E5E7EB" : `${item.color}15` }]}>
        <Icon size={22} color={empty ? "#9CA3AF" : item.color} strokeWidth={2} />
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`text-[15px] font-semibold text-zinc-900 dark:text-zinc-100`}>{item.title}</Text>
        <Text style={[tw`text-[13px] mt-0.5`, { color: empty ? "#9CA3AF" : item.color }]}>
          {empty ? "None owned" : `${count} available`}
        </Text>
      </View>
      <ShopButton
        enabled={!empty}
        icon={<PlayCircleIcon size={16} color={empty ? "#9CA3AF" : "#18181B"} strokeWidth={2.5} />}
        label="Use"
        onPress={onUse}
      />
    </Pressable>
  );
};

export default function GemShop({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data: gemBalance } = useGemBalanceQuery();
  const { data: inventory } = useInventoryQuery();
  const { data: config } = useGemConfigQuery();
  const { data: events = [] } = useActiveEventsQuery();
  const spend = useSpendGemsMutation();
  const useSkill = useUseSkillMutation();

  const balance = gemBalance?.balance ?? 0;
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());
  const toastOpacity = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const showToast = useCallback(
    (message: string) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(message);
      toastOpacity.value = withTiming(1, { duration: 200 });
      timer.current = setTimeout(() => {
        toastOpacity.value = withTiming(0, { duration: 400 });
      }, 2000);
    },
    [toastOpacity],
  );

  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastOpacity.value === 0 ? 8 : 0 }],
  }));

  const getCost = useCallback((item: ShopItem) => config?.spend_rates[item.key] ?? item.fallbackCost, [config]);

  const getInventoryCount = useCallback(
    (item: ShopItem): number | undefined => {
      if (!item.inventoryKey) return undefined;
      return inventory?.[item.inventoryKey];
    },
    [inventory],
  );

  const handleBuy = useCallback(
    (item: ShopItem) => {
      const cost = getCost(item);
      Alert.alert("Confirm Purchase", `Spend ${cost} 💎 on ${item.title}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: async () => {
            try {
              const result = await spend.mutateAsync({ item_key: item.key });
              showToast(`✨ ${item.title} purchased${result.xp_added > 0 ? ` +${result.xp_added} XP` : ""}`);
            } catch (error) {
              Alert.alert("Purchase Failed", error instanceof Error && error.message ? error.message : "Could not complete purchase.");
            }
          },
        },
      ]);
    },
    [getCost, showToast, spend],
  );

  const handleUse = useCallback(
    (item: ShopItem) => {
      const available = item.inventoryKey === "streak_freezes" ? (inventory?.streak_freezes ?? 0) : 0;
      Alert.alert("Confirm Use", `Use 1 ${item.title}? You have ${available} available.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Use",
          onPress: async () => {
            try {
              const result = await useSkill.mutateAsync(item.key);
              showToast(`🛡️ ${result.message}`);
            } catch (error) {
              Alert.alert("Cannot Use", error instanceof Error && error.message ? error.message : "Activation failed.");
            }
          },
        },
      ]);
    },
    [inventory, showToast, useSkill],
  );

  const activeBoosts = useMemo(
    () =>
      events
        .map((event) => ({
          event,
          secondsLeft: Math.max(0, Math.floor((parseUtcMs(event.ends_at) - now) / 1000)),
        }))
        .filter((item) => item.secondsLeft > 0)
        .sort((a, b) => b.event.multiplier - a.event.multiplier || a.secondsLeft - b.secondsLeft),
    [events, now],
  );

  if (!visible) return null;

  const streakFreezes = inventory?.streak_freezes ?? 0;
  const inventoryItems = SHOP_ITEMS.filter((item) => item.inventoryKey);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={tw`flex-1 justify-end bg-black/40`}>
        <Pressable style={tw`flex-1`} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(250)}
          style={tw`bg-white dark:bg-zinc-900 rounded-t-[24px] pt-3 pb-10 shadow-2xl max-h-[85%]`}>
          <View style={tw`items-center mb-3`}>
            <View style={tw`w-9 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600`} />
          </View>
          <View style={tw`flex-row items-center justify-between px-5 mb-4`}>
            <Text style={tw`text-xl font-bold text-zinc-900 dark:text-zinc-100`}>Gem Shop</Text>
            <View style={tw`flex-row items-center gap-3`}>
              <View style={tw`flex-row items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3.5 py-2 rounded-full`}>
                <GemIcon size={22} />
                <Text style={tw`text-base font-bold text-zinc-900 dark:text-zinc-100`}>{balance.toLocaleString()}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={tw`w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center`}>
                <XIcon size={18} color={tw.color("zinc-500")} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
          {!!toast && (
            <Animated.View
              style={[toastStyle, tw`absolute left-4 right-4 z-50 bg-zinc-900 dark:bg-zinc-100 rounded-xl px-4 py-3 items-center`, { top: 80 }]}
              pointerEvents="none">
              <Text style={tw`text-white dark:text-zinc-900 text-sm font-medium text-center`}>{toast}</Text>
            </Animated.View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-5 pb-4 pt-2`}>
            <View style={tw`mt-2`}>
              {SHOP_ITEMS.map((item) => (
                <ItemCard
                  key={item.key}
                  item={item}
                  cost={getCost(item)}
                  canAfford={balance >= getCost(item) && !spend.isPending}
                  inventoryCount={getInventoryCount(item)}
                  onBuy={() => handleBuy(item)}
                />
              ))}
            </View>

            <Text style={tw`text-[13px] font-semibold text-zinc-400 uppercase tracking-wide mt-6 mb-2 ml-1`}>My Skills</Text>
            {activeBoosts.length > 0 ? (
              activeBoosts.map(({ event, secondsLeft }) => <BoostCard key={event.id} event={event} secondsLeft={secondsLeft} />)
            ) : (
              <View style={[tw`flex-row items-center px-4 py-3.5 gap-3 mb-3`, CARD]}>
                <View style={tw`w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-700 items-center justify-center`}>
                  <ZapIcon size={22} color="#9CA3AF" strokeWidth={2} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[15px] font-semibold text-zinc-400`}>No Active Boost</Text>
                  <Text style={tw`text-[13px] text-zinc-400 mt-0.5`}>Purchase a boost above</Text>
                </View>
              </View>
            )}

            {inventoryItems.map((item) => (
              <SkillCard
                key={`use-${item.key}`}
                item={item}
                count={item.inventoryKey === "streak_freezes" ? streakFreezes : 0}
                onUse={() => handleUse(item)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
