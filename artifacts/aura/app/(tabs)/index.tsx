import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";
import { getLocationAndWeather, WeatherData } from "@/services/weather";
import { ClothingItem, ClothingCategory, CATEGORY_LABELS } from "@/types/wardrobe";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good Night";
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function weatherEmoji(condition?: string) {
  switch (condition) {
    case "sunny": case "hot": return "☀️";
    case "cloudy": return "☁️";
    case "rainy": return "🌧";
    case "snowy": return "❄️";
    case "cold": return "🥶";
    case "windy": return "💨";
    default: return "🌤";
  }
}

function wardrobeHealthLabel(items: ClothingItem[]) {
  const cats = new Set(items.map((i) => i.category));
  if (cats.size >= 5 && items.length >= 20) return { label: "Excellent", color: "#4CAF50", score: 95 };
  if (cats.size >= 4 && items.length >= 12) return { label: "Good", color: "#8BC34A", score: 75 };
  if (cats.size >= 3 && items.length >= 6) return { label: "Building", color: "#FFC107", score: 50 };
  return { label: "Getting Started", color: "#FF9800", score: 20 };
}

function styleScore(items: ClothingItem[]) {
  const score = Math.min(100, Math.round((items.length / 40) * 100));
  return score;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { items, savedOutfits, laundryItems } = useWardrobe();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 20 : insets.top + 8;
  const bottomPad = Platform.OS === "web" ? 100 : insets.bottom + 100;

  const firstName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    null;

  const initials = (
    (user?.firstName?.charAt(0) ?? "") + (user?.lastName?.charAt(0) ?? "")
  ).toUpperCase() || (firstName?.charAt(0).toUpperCase() ?? "");

  const recentItems = useMemo(() => items.slice(0, 10), [items]);
  const health = useMemo(() => wardrobeHealthLabel(items), [items]);
  const score = useMemo(() => styleScore(items), [items]);

  // Category breakdown for mini chart
  const categoryCount = useMemo(() => {
    const counts: Partial<Record<ClothingCategory, number>> = {};
    items.forEach((i) => {
      counts[i.category] = (counts[i.category] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3) as [ClothingCategory, number][];
  }, [items]);

  useEffect(() => {
    setWeatherLoading(true);
    getLocationAndWeather()
      .then((data) => {
        if (data) setWeatherData(data);
      })
      .catch(() => {})
      .finally(() => setWeatherLoading(false));
  }, []);

  const handleProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSignedIn) router.push("/profile");
    else router.push("/(auth)/sign-in");
  };

  const isDark = colors.background === "#0C0C0C";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: bottomPad }]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
            {formatDate()}
          </Text>
          <Pressable
            onPress={handleProfile}
            style={({ pressed }) => [styles.avatarBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            {isSignedIn && user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                {isSignedIn && initials ? (
                  <Text style={[styles.avatarInitials, { color: colors.foreground }]}>
                    {initials}
                  </Text>
                ) : (
                  <Feather name="user" size={15} color={colors.mutedForeground} />
                )}
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Greeting ── */}
        <View style={styles.greetSection}>
          <Text style={[styles.greetHello, { color: colors.mutedForeground }]}>
            {getGreeting()}{firstName ? "," : "."}
          </Text>
          {firstName ? (
            <Text style={[styles.greetName, { color: colors.foreground }]}>
              {firstName}.
            </Text>
          ) : (
            <Text style={[styles.greetName, { color: colors.foreground }]}>
              Welcome.
            </Text>
          )}
        </View>

        {/* ── Style Score + Health ── */}
        <View style={styles.metricsRow}>
          {/* Style score */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
              Style Score
            </Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: colors.foreground }]}>
                {score}
              </Text>
              <Text style={[styles.scoreMax, { color: colors.mutedForeground }]}>/100</Text>
            </View>
            <View style={[styles.scoreTrack, { backgroundColor: colors.secondary }]}>
              <LinearGradient
                colors={[colors.accent, colors.foreground]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.scoreFill, { width: `${score}%` }]}
              />
            </View>
          </View>

          {/* Wardrobe health */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
              Wardrobe Health
            </Text>
            <Text style={[styles.healthValue, { color: colors.foreground }]}>
              {health.label}
            </Text>
            <View style={styles.healthRow}>
              <View style={[styles.healthDot, { backgroundColor: health.color }]} />
              <Text style={[styles.healthSub, { color: colors.mutedForeground }]}>
                {items.length} items · {new Set(items.map((i) => i.category)).size} categories
              </Text>
            </View>
          </View>
        </View>

        {/* ── Weather ── */}
        <Pressable
          onPress={() => {
            if (!weatherData && !weatherLoading) {
              setWeatherLoading(true);
              getLocationAndWeather()
                .then((d) => { if (d) setWeatherData(d); })
                .catch(() => {})
                .finally(() => setWeatherLoading(false));
            }
          }}
          style={[
            styles.weatherCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.weatherLeft}>
            <Text style={styles.weatherEmoji}>
              {weatherLoading ? "⟳" : weatherEmoji(weatherData?.condition)}
            </Text>
            <View>
              <Text style={[styles.weatherMain, { color: colors.foreground }]}>
                {weatherLoading
                  ? "Detecting location..."
                  : weatherData
                  ? `${weatherData.temp}°  ${weatherData.description}`
                  : "Tap to get weather"}
              </Text>
              {weatherData?.cityName ? (
                <Text style={[styles.weatherSub, { color: colors.mutedForeground }]}>
                  {weatherData.cityName} · AI will suggest outfit accordingly
                </Text>
              ) : (
                <Text style={[styles.weatherSub, { color: colors.mutedForeground }]}>
                  {weatherLoading ? "Please wait…" : "Allow location for AI outfit tips"}
                </Text>
              )}
            </View>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>

        {/* ── Generate Outfit CTA ── */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(tabs)/style");
          }}
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={isDark ? ["#1E1E1E", "#141414"] : ["#0F0F0F", "#2A2A2A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaLeft}>
              <View style={[styles.ctaIconWrap, { backgroundColor: colors.accent + "22" }]}>
                <Feather name="star" size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.ctaTitle}>Generate Today's Outfit</Text>
                <Text style={styles.ctaSub}>
                  {savedOutfits.length > 0
                    ? `${savedOutfits.length} saved look${savedOutfits.length > 1 ? "s" : ""} available`
                    : "AI will style from your wardrobe"}
                </Text>
              </View>
            </View>
            <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </Pressable>

        {/* ── Recent Items ── */}
        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Your Wardrobe
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/outfits")}>
                <Text style={[styles.seeAll, { color: colors.mutedForeground }]}>
                  See all {items.length} →
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemsRow}
            >
              {recentItems.map((item) => (
                <RecentItemCard
                  key={item.id}
                  item={item}
                  colors={colors}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/item/${item.id}`);
                  }}
                />
              ))}
              <AddMoreCard
                colors={colors}
                onPress={() => router.push("/(tabs)/scan")}
              />
            </ScrollView>
          </View>
        )}

        {/* ── Saved Outfits ── */}
        {savedOutfits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Saved Looks
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/style")}>
                <Text style={[styles.seeAll, { color: colors.mutedForeground }]}>
                  View all →
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemsRow}
            >
              {savedOutfits.slice(0, 5).map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  items={items}
                  colors={colors}
                  onPress={() => router.push("/(tabs)/style")}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Empty wardrobe CTA ── */}
        {items.length === 0 && (
          <Pressable
            onPress={() => router.push("/(tabs)/scan")}
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="camera" size={28} color={colors.foreground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Scan your first item
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Photograph any piece of clothing and AI will catalog it automatically.
            </Text>
          </Pressable>
        )}

        {/* ── Quick stats row ── */}
        <View style={styles.statsRow}>
          <QuickStat
            icon="grid"
            value={items.length}
            label="Items"
            colors={colors}
            onPress={() => router.push("/(tabs)/outfits")}
          />
          <QuickStat
            icon="layers"
            value={savedOutfits.length}
            label="Outfits"
            colors={colors}
            onPress={() => router.push("/(tabs)/style")}
          />
          <QuickStat
            icon="droplet"
            value={laundryItems.length}
            label="Laundry"
            colors={colors}
            onPress={() => router.push("/(tabs)/plan")}
          />
          <Pressable
            onPress={() => router.push("/analytics" as any)}
            style={({ pressed }) => [
              styles.quickStatCard,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="bar-chart-2" size={20} color={colors.accent} />
            <Text style={[styles.quickStatValue, { color: colors.foreground }]}>→</Text>
            <Text style={[styles.quickStatLabel, { color: colors.mutedForeground }]}>
              Stats
            </Text>
          </Pressable>
        </View>

        {/* ── Category pills ── */}
        {categoryCount.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Wardrobe Breakdown
            </Text>
            <View style={styles.catRow}>
              {categoryCount.map(([cat, count]) => (
                <View
                  key={cat}
                  style={[
                    styles.catPill,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.catName, { color: colors.foreground }]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                  <Text style={[styles.catCount, { color: colors.mutedForeground }]}>
                    {count}
                  </Text>
                </View>
              ))}
              <Pressable
                onPress={() => router.push("/(tabs)/outfits")}
                style={[
                  styles.catPill,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.catName, { color: colors.mutedForeground }]}>
                  All →
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function RecentItemCard({
  item,
  colors,
  onPress,
}: {
  item: ClothingItem;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recentCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.recentImg} resizeMode="cover" />
      ) : (
        <View style={[styles.recentImg, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
          <View style={[styles.colorSwatch, { backgroundColor: item.colorHex }]} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.4 }}
      />
      <View style={styles.recentInfo}>
        <Text style={styles.recentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.recentCat}>{item.type}</Text>
      </View>
    </Pressable>
  );
}

function AddMoreCard({ colors, onPress }: { colors: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recentCard,
        styles.addMoreCard,
        {
          backgroundColor: colors.secondary,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.addMoreIcon, { backgroundColor: colors.border }]}>
        <Feather name="plus" size={24} color={colors.foreground} />
      </View>
      <Text style={[styles.addMoreText, { color: colors.mutedForeground }]}>
        Add item
      </Text>
    </Pressable>
  );
}

function OutfitCard({
  outfit,
  items,
  colors,
  onPress,
}: {
  outfit: any;
  items: ClothingItem[];
  colors: any;
  onPress: () => void;
}) {
  const outfitItems = items.filter((i) => outfit.itemIds?.includes(i.id));
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outfitCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View style={styles.outfitImgRow}>
        {outfitItems.slice(0, 3).map((item, idx) => (
          item.imageUri ? (
            <Image
              key={item.id}
              source={{ uri: item.imageUri }}
              style={[styles.outfitThumb, { marginLeft: idx > 0 ? -20 : 0, zIndex: 3 - idx }]}
              resizeMode="cover"
            />
          ) : null
        ))}
        {outfitItems.length === 0 && (
          <View style={[styles.outfitThumb, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="layers" size={20} color={colors.mutedForeground} />
          </View>
        )}
      </View>
      <Text style={[styles.outfitName, { color: colors.foreground }]} numberOfLines={1}>
        {outfit.name}
      </Text>
      <View style={[styles.outfitOccBadge, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.outfitOcc, { color: colors.mutedForeground }]}>
          {outfit.occasion} · {outfit.weather}
        </Text>
      </View>
    </Pressable>
  );
}

function QuickStat({
  icon,
  value,
  label,
  colors,
  onPress,
}: {
  icon: string;
  value: number;
  label: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickStatCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather name={icon as any} size={20} color={colors.primary} />
      <Text style={[styles.quickStatValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.quickStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 24 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
  avatarBtn: {},
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  greetSection: { gap: 0, marginTop: -4 },
  greetHello: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.1,
  },
  greetName: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    lineHeight: 48,
    letterSpacing: -1.5,
    marginTop: 2,
  },

  metricsRow: { flexDirection: "row", gap: 12 },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  metricLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.6 },
  scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  scoreValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  scoreMax: { fontSize: 13, fontFamily: "Inter_400Regular" },
  scoreTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 2 },
  healthValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
  healthRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthSub: { fontSize: 10, fontFamily: "Inter_400Regular" },

  weatherCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  weatherLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  weatherEmoji: { fontSize: 28 },
  weatherMain: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  weatherSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 16 },

  ctaBtn: { borderRadius: 22, overflow: "hidden" },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 22,
  },
  ctaLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  ctaIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  ctaIcon: { fontSize: 20 },
  ctaTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  ctaSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 2 },

  section: { gap: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  seeAll: { fontSize: 13, fontFamily: "Inter_400Regular" },

  itemsRow: { gap: 10, paddingRight: 4 },

  recentCard: {
    width: 130,
    height: 175,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  recentImg: { width: "100%", height: "100%" },
  colorSwatch: { width: 40, height: 40, borderRadius: 20 },
  recentInfo: { position: "absolute", bottom: 10, left: 10, right: 10 },
  recentName: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  recentCat: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 2 },

  addMoreCard: { alignItems: "center", justifyContent: "center", gap: 10, borderStyle: "dashed" },
  addMoreIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  addMoreText: { fontSize: 11, fontFamily: "Inter_400Regular" },

  outfitCard: {
    width: 160,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
    gap: 8,
  },
  outfitImgRow: { flexDirection: "row", height: 90 },
  outfitThumb: { width: 76, height: 90, borderRadius: 10 },
  outfitName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  outfitOccBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  outfitOcc: { fontSize: 10, fontFamily: "Inter_400Regular" },

  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19, maxWidth: 260 },

  statsRow: { flexDirection: "row", gap: 10 },
  quickStatCard: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  quickStatValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  quickStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },

  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  catCount: { fontSize: 12, fontFamily: "Inter_700Bold" },
});
