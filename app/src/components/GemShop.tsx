import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, View, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { ShieldIcon, XIcon, ZapIcon, RocketIcon, ArrowUpCircleIcon, PlayCircleIcon, type LucideIcon } from "lucide-react-native";
import { useAtomValue } from "jotai";
import tw from "twrnc";
import { useGemConfigQuery, useInventoryQuery, useSpendGemsMutation, useUseSkillMutation, useActiveEventsQuery } from "~/client";
import { $gemBalance } from "~/store";
import Text from "./Text";

type ShopItem = { key: string; title: string; description: string; fallbackCost: number; icon: LucideIcon; color: string; gradientColors: [string, string]; inventoryKey?: string; inventoryLabel?: (count: number) => string };
const SHOP_ITEMS: ShopItem[] = [
  { key: "streak_freeze", title: "Streak Restore", description: "Restore your streak after missing a day", fallbackCost: 50, icon: ShieldIcon, color: "#3B82F6", gradientColors: ["#3B82F6", "#1D4ED8"], inventoryKey: "streak_freezes", inventoryLabel: c => `${c} restore${c !== 1 ? "s" : ""} stored` },
  { key: "xp_boost_1h", title: "2× XP Boost", description: "Double XP for the next hour", fallbackCost: 100, icon: ZapIcon, color: "#F97316", gradientColors: ["#F97316", "#EA580C"] },
  { key: "buy_xp_500", title: "Buy 500 XP", description: "Instantly add 500 XP to your total", fallbackCost: 50, icon: ArrowUpCircleIcon, color: "#22C55E", gradientColors: ["#22C55E", "#16A34A"] },
  { key: "xp_boost_30m_30x", title: "30× XP Mega Boost", description: "30× XP for 30 minutes — go big!", fallbackCost: 500, icon: RocketIcon, color: "#8B5CF6", gradientColors: ["#8B5CF6", "#7C3AED"] },
];

const parseUtcMs = (v: string) => new Date(/[zZ+-]\d{0,2}:?\d{0,2}$/.test(v) ? v : `${v}Z`).getTime();
const fmtCountdown = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60; return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m ${String(ss).padStart(2, "0")}s` : `${m}m ${String(ss).padStart(2, "0")}s`; };
const GEM_SRC = require("../../assets/gem.png");
const CARD: ViewStyle = { backgroundColor: "#FFF", borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 28, elevation: 12 };
const BTN_B = 2, BTN_S = BTN_B * 2.5;

const GemIcon = ({ size, dim }: { size: number; dim?: boolean }) => <Image source={GEM_SRC} resizeMode="contain" style={{ width: size * 1.3, height: size * 1.3, opacity: dim ? 0.45 : 1 }} />;

const ShopBtn = ({ on, icon, label, onPress }: { on: boolean; icon?: React.ReactNode; label: string; onPress: () => void }) => (
  <Pressable onPress={on ? onPress : undefined} disabled={!on} style={({ pressed }) => [tw`flex-row items-center justify-center gap-2 px-5 py-2.5 rounded-xl`, { backgroundColor: on ? "#F4F4F5" : "#FAFAFA", borderWidth: BTN_B, borderColor: on ? "rgba(113,113,122,0.5)" : "rgba(113,113,122,0.25)", borderBottomWidth: pressed && on ? BTN_B : BTN_S, borderBottomColor: on ? "rgba(113,113,122,0.5)" : "rgba(113,113,122,0.25)", transform: [{ scale: pressed && on ? 0.95 : 1 }], opacity: on ? 1 : 0.5, marginTop: pressed && on ? BTN_S - BTN_B : 0 }]}>
    {icon}<Text style={[tw`text-base font-bold`, { color: on ? "#18181B" : "#9CA3AF" }]}>{label}</Text>
  </Pressable>
);

const ItemCard = ({ item, cost, canAfford, invCnt, onBuy }: { item: ShopItem; cost: number; canAfford: boolean; invCnt?: number; onBuy: () => void }) => {
  const Icon = item.icon;
  return (
    <Pressable onPress={canAfford ? onBuy : undefined} style={({ pressed }) => [tw`flex-row items-center px-4 py-3.5 gap-3 mb-3`, CARD, { opacity: canAfford ? (pressed ? 0.9 : 1) : 0.92, transform: [{ scale: pressed && canAfford ? 0.99 : 1 }] }]}>
      <View style={[tw`w-11 h-11 rounded-full items-center justify-center`, { backgroundColor: `${item.color}15` }]}><Icon size={22} color={item.color} strokeWidth={2} /></View>
      <View style={tw`flex-1`}><Text style={tw`text-[15px] font-semibold text-zinc-900 dark:text-zinc-100`}>{item.title}</Text><Text style={tw`text-[13px] text-zinc-500 mt-0.5`}>{item.description}</Text>{item.inventoryLabel && invCnt != null && invCnt > 0 && <Text style={[tw`text-[11px] font-medium mt-0.5`, { color: item.color }]}>{item.inventoryLabel(invCnt)}</Text>}</View>
      <ShopBtn on={canAfford} icon={<GemIcon size={22} dim={!canAfford} />} label={String(cost)} onPress={onBuy} />
    </Pressable>
  );
};

const BoostCard = ({ ev, secs }: { ev: { id: number; multiplier: number; name: string }; secs: number }) => {
  const col = ev.multiplier >= 10 ? "#8B5CF6" : "#F97316";
  return (
    <View style={[tw`flex-row items-center gap-3 px-4 py-3.5 mb-3`, CARD]}>
      <View style={[tw`w-11 h-11 rounded-full items-center justify-center`, { backgroundColor: `${col}15` }]}><ZapIcon size={22} color={col} fill={col} strokeWidth={0} /></View>
      <View style={tw`flex-1`}><View style={tw`flex-row items-center gap-2`}><Text style={tw`text-[15px] font-semibold text-zinc-900 dark:text-zinc-100`}>{ev.multiplier}× XP Boost</Text><View style={[tw`px-1.5 py-0.5 rounded`, { backgroundColor: `${col}20` }]}><Text style={[tw`text-[10px] font-bold`, { color: col }]}>ACTIVE</Text></View></View><Text style={tw`text-[13px] text-zinc-500 mt-0.5`}>{fmtCountdown(secs)} remaining</Text></View>
    </View>
  );
};

const SkillCard = ({ item, count, onUse }: { item: ShopItem; count: number; onUse: () => void }) => {
  const Icon = item.icon, empty = count === 0;
  return (
    <Pressable onPress={empty ? undefined : onUse} disabled={empty} style={({ pressed }) => [tw`flex-row items-center px-4 py-3.5 gap-3 mb-3`, CARD, { opacity: empty ? 0.92 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !empty ? 0.99 : 1 }] }]}>
      <View style={[tw`w-11 h-11 rounded-full items-center justify-center`, { backgroundColor: empty ? "#E5E7EB" : `${item.color}15` }]}><Icon size={22} color={empty ? "#9CA3AF" : item.color} strokeWidth={2} /></View>
      <View style={tw`flex-1`}><Text style={tw`text-[15px] font-semibold text-zinc-900 dark:text-zinc-100`}>{item.title}</Text><Text style={[tw`text-[13px] mt-0.5`, { color: empty ? "#9CA3AF" : item.color }]}>{empty ? "None owned" : `${count} available`}</Text></View>
      <ShopBtn on={!empty} icon={<PlayCircleIcon size={16} color={empty ? "#9CA3AF" : "#18181B"} strokeWidth={2.5} />} label="Use" onPress={onUse} />
    </Pressable>
  );
};

export default function GemShop({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const balance = useAtomValue($gemBalance), spend = useSpendGemsMutation(), useSk = useUseSkillMutation(), { data: inv } = useInventoryQuery(), { data: cfg } = useGemConfigQuery(), { data: evts = [] } = useActiveEventsQuery();
  const [buying, setBuying] = useState(false), [toast, setToast] = useState(""), [now, setNow] = useState(Date.now()), opacity = useSharedValue(0), timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const showToast = useCallback((msg: string) => { if (timer.current) clearTimeout(timer.current); setToast(msg); opacity.value = withTiming(1, { duration: 200 }); timer.current = setTimeout(() => { opacity.value = withTiming(0, { duration: 400 }); }, 2000); }, [opacity]);
  const toastStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: opacity.value === 0 ? 8 : 0 }] }));
  const getCost = useCallback((item: ShopItem) => cfg?.spend_rates[item.key] ?? item.fallbackCost, [cfg]);
  const getInv = (item: ShopItem) => { if (!inv || !item.inventoryKey) return undefined; const v = (inv as Record<string, unknown>)[item.inventoryKey]; return typeof v === "boolean" ? (v ? 1 : 0) : typeof v === "number" ? v : undefined; };

  const handleBuy = useCallback((item: ShopItem) => { const cost = getCost(item); Alert.alert("Confirm Purchase", `Spend ${cost} 💎 on ${item.title}?`, [{ text: "Cancel", style: "cancel" }, { text: "Buy", onPress: async () => { setBuying(true); try { const r = await spend.mutateAsync({ item_key: item.key }); showToast(`✨ ${item.title} purchased${r.xp_added > 0 ? ` +${r.xp_added} XP` : ""}`); } catch (e) { Alert.alert("Purchase Failed", e instanceof Error && e.message ? e.message : "Could not complete purchase."); } finally { setBuying(false); } } }]); }, [spend, getCost, showToast]);
  const handleUse = useCallback((item: ShopItem) => { const cnt = item.inventoryKey === "streak_freezes" ? (inv?.streak_freezes ?? 0) : 0; Alert.alert("Confirm Use", `Use 1 ${item.title}? You have ${cnt} available.`, [{ text: "Cancel", style: "cancel" }, { text: "Use", onPress: async () => { try { const r = await useSk.mutateAsync(item.key); showToast(`🛡️ ${r.message}`); } catch (e) { Alert.alert("Cannot Use", e instanceof Error && e.message ? e.message : "Activation failed."); } } }]); }, [useSk, showToast, inv]);

  if (!visible) return null;
  const freezes = inv?.streak_freezes ?? 0, invItems = SHOP_ITEMS.filter(i => i.inventoryKey), boosts = evts.map(e => ({ e, s: Math.max(0, Math.floor((parseUtcMs(e.ends_at) - now) / 1000)) })).filter(x => x.s > 0).sort((a, b) => b.e.multiplier - a.e.multiplier || a.s - b.s);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={tw`flex-1 justify-end bg-black/40`}>
        <Pressable style={tw`flex-1`} onPress={onClose} />
        <Animated.View entering={SlideInDown.duration(300)} exiting={SlideOutDown.duration(250)} style={tw`bg-white dark:bg-zinc-900 rounded-t-[24px] pt-3 pb-10 shadow-2xl max-h-[85%]`}>
          <View style={tw`items-center mb-3`}><View style={tw`w-9 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600`} /></View>
          <View style={tw`flex-row items-center justify-between px-5 mb-4`}>
            <Text style={tw`text-xl font-bold text-zinc-900 dark:text-zinc-100`}>Gem Shop</Text>
            <View style={tw`flex-row items-center gap-3`}><View style={tw`flex-row items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3.5 py-2 rounded-full`}><GemIcon size={22} /><Text style={tw`text-base font-bold text-zinc-900 dark:text-zinc-100`}>{balance.toLocaleString()}</Text></View><Pressable onPress={onClose} hitSlop={12} style={tw`w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center`}><XIcon size={18} color={tw.color("zinc-500")} strokeWidth={2.5} /></Pressable></View>
          </View>
          {!!toast && <Animated.View style={[toastStyle, tw`absolute left-4 right-4 z-50 bg-zinc-900 dark:bg-zinc-100 rounded-xl px-4 py-3 items-center`, { top: 80 }]} pointerEvents="none"><Text style={tw`text-white dark:text-zinc-900 text-sm font-medium text-center`}>{toast}</Text></Animated.View>}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-5 pb-4 pt-2`}>
            <View style={tw`mt-2`}>{SHOP_ITEMS.map(i => <ItemCard key={i.key} item={i} cost={getCost(i)} canAfford={balance >= getCost(i) && !buying} invCnt={getInv(i)} onBuy={() => handleBuy(i)} />)}</View>
            <Text style={tw`text-[13px] font-semibold text-zinc-400 uppercase tracking-wide mt-6 mb-2 ml-1`}>My Skills</Text>
            {boosts.length > 0 ? boosts.map(({ e, s }) => <BoostCard key={e.id} ev={e} secs={s} />) : <View style={[tw`flex-row items-center px-4 py-3.5 gap-3 mb-3`, CARD]}><View style={tw`w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-700 items-center justify-center`}><ZapIcon size={22} color="#9CA3AF" strokeWidth={2} /></View><View style={tw`flex-1`}><Text style={tw`text-[15px] font-semibold text-zinc-400`}>No Active Boost</Text><Text style={tw`text-[13px] text-zinc-400 mt-0.5`}>Purchase a boost above</Text></View></View>}
            {invItems.map(i => <SkillCard key={`use-${i.key}`} item={i} count={i.inventoryKey === "streak_freezes" ? freezes : 0} onUse={() => handleUse(i)} />)}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
