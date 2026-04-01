import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, ScrollView, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, FadeInDown } from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon, LightbulbIcon, TrophyIcon, UserIcon, ZapIcon } from "lucide-react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { AnimatedPodium, Button, Spinner, Text } from "~/components";
import ProximityBanner from "~/components/ProximityBanner";
import RankChangeIndicator from "~/components/RankChangeIndicator";
import { useAuthedUserQuery, useLeaderboardQuery, useMyRankQuery, useProximityQuery } from "~/client";
import { useNavigationOptions } from "~/hooks";
import type { LeaderboardItem, Topic } from "~/client/models";

const BG = "#ffffff", CROWN_URI = "https://lottie.host/e371643e-e22e-4a3e-a1ce-b8ab03785b60/WiYpVXACUw.lottie";
const TOPICS: { key: Topic; label: string; emoji: string }[] = [
  { key: "Global", label: "Global", emoji: "🌍" }, { key: "Food", label: "Food", emoji: "🍜" }, { key: "Culture", label: "Culture", emoji: "🎭" },
  { key: "Travel", label: "Travel", emoji: "✈️" }, { key: "Business", label: "Business", emoji: "💼" }, { key: "Technology", label: "Tech", emoji: "💡" },
];
type TimeTab = "this-week" | "all-time";
const fmtXP = (x: number) => x.toLocaleString();

const getISOWeek = (d: Date) => { const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return { year: t.getUTCFullYear(), week: Math.ceil(((t.getTime() - y.getTime()) / 86400000 + 1) / 7) }; };
const buildPeriods = (n: number) => { const p: { key: string; label: string }[] = [], now = new Date(), base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); for (let i = 0; i < n; i++) { const d = new Date(base); d.setUTCDate(d.getUTCDate() - i * 7); const { year, week } = getISOWeek(d); p.push({ key: `WEEK-${year}-${String(week).padStart(2, "0")}`, label: i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i} weeks ago` }); } return p; };

const FloatingMascot = ({ crown }: { crown?: boolean }) => {
  const ty = useSharedValue(0);
  useEffect(() => { ty.value = withRepeat(withSequence(withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })), -1, true); }, [ty]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  return <Animated.View style={[tw`items-center z-10`, style]}>{crown && <View style={tw`-mb-9 z-20`}><LottieView source={{ uri: CROWN_URI }} autoPlay loop style={{ width: 70, height: 70 }} /></View>}<Image source={require("@/mascot.png")} style={tw`w-13 h-13`} resizeMode="contain" /></Animated.View>;
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <View style={tw`items-center bg-green-600/20 rounded-2xl px-3 py-3 min-w-[95px] border border-green-400/30`}>{icon}<Text style={tw`text-xl font-bold text-green-800 dark:text-green-100 mt-1`}>{value}</Text><Text style={tw`text-xs text-green-700/70 dark:text-green-200/70 mt-0.5`}>{label}</Text></View>
);

const Header = ({ rank, xp, streak, loading }: { rank: number; xp: number; streak: number; loading: boolean }) => {
  const ins = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: ins.top + 4, backgroundColor: BG }}>
      <View style={tw`items-center mb-4 mt-2`}><Text style={[tw`text-4xl`, { fontFamily: "Feather-Bold", color: "#115c1a" }]}>Leaderboard</Text></View>
      <View style={tw`flex-row justify-around px-3 pb-4`}>
        <StatCard label="Your Rank" value={loading ? "..." : `#${rank}`} icon={<TrophyIcon size={20} color="#16A34A" fill="#e1d612" />} />
        <StatCard label="XP" value={loading ? "..." : fmtXP(xp)} icon={<ZapIcon size={20} color="#2c8fc1" fill="#22C55E" />} />
        <StatCard label="Day Streak" value={loading ? "..." : `${streak}`} icon={<FlameIcon size={20} color="#fb923c" fill="#c91c16" />} />
      </View>
    </View>
  );
};

const Tips = () => (
  <View style={tw`mx-4 mt-2 mb-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-4 py-3`}>
    <View style={tw`flex-row items-center gap-2 mb-2`}><LightbulbIcon size={16} color={tw.color("amber-500")} /><Text style={tw`text-sm font-bold text-amber-700 dark:text-amber-400`}>Climbing Tips</Text></View>
    <View style={tw`gap-1.5`}><Text style={tw`text-sm text-amber-800 dark:text-amber-300 leading-tight`}>• Complete daily check-ins to maintain your streak.</Text><Text style={tw`text-sm text-amber-800 dark:text-amber-300 leading-tight`}>• Participate in a full session in Echo for bonus points.</Text></View>
  </View>
);

const TopicTabs = ({ sel, onSel }: { sel: Topic; onSel: (t: Topic) => void }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2 px-4 py-2`}>
    {TOPICS.map(t => <Pressable key={t.key} onPress={() => onSel(t.key)} style={tw.style("items-center gap-0.5 rounded-full border-2 px-3 py-1.5", sel === t.key ? "border-green-500 bg-green-500/10" : "border-zinc-300/60 dark:border-zinc-600/60")}><View style={tw`flex-row items-center gap-1.5`}><Text style={tw`text-base`}>{t.emoji}</Text><Text style={tw.style("text-sm font-medium", sel === t.key ? "text-green-600 dark:text-green-400" : "text-zinc-600 dark:text-zinc-400")}>{t.label}</Text></View></Pressable>)}
  </ScrollView>
);

const TimeTabs = ({ sel, onSel, dirt }: { sel: TimeTab; onSel: (t: TimeTab) => void; dirt?: boolean }) => (
  <View style={tw.style("flex-row bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5", dirt ? "mx-8" : "mx-8 mt-1 mb-2")}>
    {(["this-week", "all-time"] as TimeTab[]).map(t => <Pressable key={t} onPress={() => onSel(t)} style={tw.style("flex-1 items-center py-1.25 rounded-full", sel === t && "bg-green-700 shadow-sm")}><Text style={tw.style("text-sm font-bold", sel === t ? "text-white" : "text-zinc-500 dark:text-zinc-400")}>{t === "this-week" ? "This Week" : "All Time"}</Text></Pressable>)}
  </View>
);

const Podium = ({ top3, token, tab, onTab }: { top3: LeaderboardItem[]; token: number; tab: TimeTab; onTab: (t: TimeTab) => void }) => {
  if (!top3.length) return <TimeTabs sel={tab} onSel={onTab} />;
  return (
    <LinearGradient colors={[BG, "#D1FAE5", BG]} style={tw`pt-2 pb-0`}>
      <View>
        <AnimatedPodium playToken={token} entries={{ 1: top3[0] ? { name: top3[0].name, xpLabel: fmtXP(top3[0].total_xp) } : undefined, 2: top3[1] ? { name: top3[1].name, xpLabel: fmtXP(top3[1].total_xp) } : undefined, 3: top3[2] ? { name: top3[2].name, xpLabel: fmtXP(top3[2].total_xp) } : undefined }} championContent={<FloatingMascot crown />} />
        <View pointerEvents="box-none" style={[tw`absolute left-0 right-0`, { bottom: 8 }]}><TimeTabs sel={tab} onSel={onTab} dirt /></View>
      </View>
    </LinearGradient>
  );
};

const Row = ({ item, me, idx }: { item: LeaderboardItem; me: boolean; idx: number }) => (
  <Animated.View entering={FadeInDown.delay(idx * 30).duration(250).easing(Easing.out(Easing.quad))}>
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, marginHorizontal: 12, marginTop: idx === 0 ? 12 : 0, marginBottom: 12, borderRadius: 14, backgroundColor: me ? "#ECFDF5" : "#FFF", borderWidth: 1, borderColor: "#EEF7F0", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: me ? "#16A34A" : "#E5E7EB", alignItems: "center", justifyContent: "center", marginRight: 14, backgroundColor: "#FFF" }}><Text style={{ fontSize: 20, fontWeight: "900", color: "#065F46" }}>{`#${item.rank}`}</Text></View>
      <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: 14 }}><View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: me ? "#DCFCE7" : "#F3F4F6", alignItems: "center", justifyContent: "center" }}><UserIcon size={18} color={me ? "#16A34A" : "#9CA3AF"} /></View></View>
      <View style={{ flex: 1 }}><View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: me ? "#065F46" : "#111827" }} numberOfLines={1}>{item.name}</Text><RankChangeIndicator delta={item.rank_delta} /></View></View>
      <View style={{ minWidth: 80, alignItems: "center", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 2, borderColor: "#34D399", backgroundColor: "#FFF", shadowColor: "#34D399", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}><Text style={{ fontSize: 14, fontWeight: "800", color: "#059669" }}>{fmtXP(item.total_xp)}</Text></View>
    </View>
  </Animated.View>
);

const Empty = () => <View style={tw`flex-1 items-center justify-center py-20`}><Text style={tw`text-6xl mb-4`}>🏆</Text><Text style={tw`mt-2 text-lg font-bold text-zinc-400`}>No rankings yet</Text><Text style={tw`mt-2 text-sm text-zinc-400 text-center px-8`}>Be the first to earn XP and climb the leaderboard!</Text></View>;
const Error = ({ retry }: { retry: () => void }) => <View style={tw`flex-1 items-center justify-center py-20`}><Text style={tw`text-lg font-bold text-red-500`}>Failed to load leaderboard</Text><Button style={tw`mt-4 px-6`} onPress={retry}><Text style={tw`text-base font-semibold`}>Retry</Text></Button></View>;

const WeekNav = ({ label, back, fwd, onBack, onFwd }: { label: string; back: boolean; fwd: boolean; onBack: () => void; onFwd: () => void }) => (
  <View style={tw`flex-row items-center justify-between px-4 mt-1 mb-1`}>
    <Pressable onPress={onBack} disabled={!back} style={tw.style("p-2", !back && "opacity-30")}><ChevronLeftIcon size={22} color={tw.color("zinc-600")} strokeWidth={3} /></Pressable>
    <Text style={tw`text-sm font-bold text-zinc-600`}>{label}</Text>
    <Pressable onPress={onFwd} disabled={!fwd} style={tw.style("p-2", !fwd && "opacity-30")}><ChevronRightIcon size={22} color={tw.color("zinc-600")} strokeWidth={3} /></Pressable>
  </View>
);

const Footer = ({ rank, xp, loading, err, name }: { rank: number; xp: number; loading: boolean; err: boolean; name?: string }) => {
  if (loading) return <View style={[tw`py-4 items-center`, { backgroundColor: "#188152" }]}><Spinner size={24} /></View>;
  if (err) return <View style={[tw`py-4 items-center`, { backgroundColor: "#188152" }]}><Text style={tw`text-sm text-red-400`}>Unable to load your rank</Text></View>;
  return (
    <View style={tw`flex-row items-center justify-between px-5 py-3.5 bg-green-600/20 rounded-3xl border border-green-700`}>
      <View style={{ width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#000", backgroundColor: "#fff" }}><Text style={{ color: "#000", fontWeight: "900", fontSize: 18 }}>{`#${rank}`}</Text></View>
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginLeft: 12 }}><View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#46786b", alignItems: "center", justifyContent: "center", marginRight: 12 }}><UserIcon size={20} color="white" /></View><Text style={{ color: "#000", fontWeight: "800" }}>{name ?? "You"}</Text></View>
      <View style={{ minWidth: 88, alignItems: "center", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: "#fff" }}><Text style={{ color: "#000", fontWeight: "800" }}>{fmtXP(xp)}</Text></View>
    </View>
  );
};

export default function MainCommunityScreen() {
  const focused = useIsFocused(), { data: user } = useAuthedUserQuery();
  const [token, setToken] = useState(0), [topic, setTopic] = useState<Topic>("Global"), [tab, setTab] = useState<TimeTab>("this-week");
  const periods = useMemo(() => buildPeriods(5), []), [pIdx, setPIdx] = useState(0), [dismissed, setDismissed] = useState(false);

  useEffect(() => { if (focused) setToken(t => t + 1); }, [focused]);
  const pKey = useMemo(() => tab === "all-time" ? "ALL_TIME" : pIdx === 0 ? undefined : periods[pIdx]?.key, [tab, periods, pIdx]);
  const { data: myRank, isLoading: rankLoad, error: rankErr } = useMyRankQuery(pKey, topic);
  useNavigationOptions({ headerShown: false });
  const { data: lb, isLoading, error, refetch } = useLeaderboardQuery(pKey, topic);
  const { data: prox } = useProximityQuery(topic, tab === "all-time");
  const below = useMemo(() => { const b = prox?.below[0]; return b && b.xp_gap <= 50 ? b : null; }, [prox]);
  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const items = useMemo(() => lb || [], [lb]), top3 = useMemo(() => items.filter(i => i.rank <= 3), [items]), rest = useMemo(() => items.filter(i => i.rank > 3), [items]);
  const entry = useMemo(() => items.find(i => i.user_id === user?.id), [items, user?.id]);
  const rank = entry?.rank ?? myRank?.rank ?? 0, xp = entry?.total_xp ?? myRank?.total_xp ?? 0, hLoad = rankLoad && !entry, hErr = !!rankErr && !entry, streak = myRank?.current_streak ?? 0;

  if (isLoading && !lb) return <View style={tw`flex-1`}><Header rank={0} xp={0} streak={0} loading /><View style={tw`flex-1 items-center justify-center`}><Spinner size={48} /><Text style={tw`mt-4 text-zinc-500`}>Loading leaderboard...</Text></View></View>;
  if (error && !lb) return <View style={tw`flex-1`}><Header rank={0} xp={0} streak={0} loading /><Error retry={refetch} /></View>;

  return (
    <View style={tw`flex-1`}>
      <FlatList data={rest} renderItem={({ item, index }) => <Row item={item} me={user?.id === item.user_id} idx={index} />} keyExtractor={i => i.user_id} contentContainerStyle={tw`pb-4`}
        ListHeaderComponent={<View><Header rank={rank} xp={xp} streak={streak} loading={hLoad} /><Tips /><TopicTabs sel={topic} onSel={setTopic} />{tab === "this-week" && <WeekNav label={periods[pIdx]?.label ?? ""} back={pIdx < periods.length - 1} fwd={pIdx > 0} onBack={() => setPIdx(Math.min(periods.length - 1, pIdx + 1))} onFwd={() => setPIdx(Math.max(0, pIdx - 1))} />}<Podium top3={top3} token={token} tab={tab} onTab={setTab} /></View>}
        ListEmptyComponent={!top3.length ? <Empty /> : null} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={tw.color("green-500")} colors={[tw.color("green-500") as string]} />}
        showsVerticalScrollIndicator={false} maxToRenderPerBatch={10} windowSize={10} initialNumToRender={15} removeClippedSubviews style={{ backgroundColor: BG }} />
      <Footer rank={rank} xp={xp} loading={hLoad} err={hErr} name={user?.name} />
      {!dismissed && <ProximityBanner neighbour={below} onDismiss={() => setDismissed(true)} />}
    </View>
  );
}
