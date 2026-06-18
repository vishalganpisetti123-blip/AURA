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
import { ClothingItem } from "@/types/wardrobe";

const OCCASIONS = ["Casual", "Work", "Formal", "Date", "Athletic"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function weatherIcon(condition?: string): "sun" | "cloud" | "cloud-rain" | "cloud-snow" | "thermometer" | "wind" {
  switch (condition) {
    case "sunny":
    case "hot":
      return "sun";
    case "rainy":
      return "cloud-rain";
    case "snowy":
      return "cloud-snow";
    case "cold":
      return "thermometer";
    case "windy":
      return "wind";
    default:
      return "cloud";
  }
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { items, savedOutfits, laundryItems } = useWardrobe();

  const [selectedOccasion, setSelectedOccasion] = useState("Casual");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 20 : insets.top + 8;

  const firstName =
    user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "there";

  const initials = (
    (user?.firstName?.charAt(0) ?? "") +
    (user?.lastName?.charAt(0) ?? "")
  ).toUpperCase() || firstName.charAt(0).toUpperCase();

  const featuredItems = useMemo(() => items.slice(0, 8), [items]);

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
    if (isSignedIn) {
      router.push("/profile");
    } else {
      router.push("/(auth)/sign-in");
    }
  };

  const weatherLabel = weatherLoading
    ? "Detecting..."
    : weatherData
    ? `${weatherData.temp}° ${weatherData.description}`
    : "Tap to enable";

  const weatherSubLabel = weatherData?.cityName || "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: topPad,
            paddingBottom: Platform.OS === "web" ? 80 : insets.bottom + 80,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={[styles.logoText, { color: colors.primary }]}>✦</Text>
            <Text style={[styles.logoLabel, { color: colors.foreground }]}>Aura</Text>
          </View>
          <Pressable
            onPress={handleProfile}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
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
                {isSignedIn ? (
                  <Text style={[styles.avatarInitials, { color: colors.foreground }]}>
                    {initials}
                  </Text>
                ) : (
                  <View style={styles.signInRow}>
                    <Feather name="user" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.signInLabel, { color: colors.mutedForeground }]}>
                      Sign In
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        </View>

        {/* Greeting */}
        <View style={styles.greetSection}>
          <Text style={[styles.greetTitle, { color: colors.foreground }]}>
            {getGreeting()}
            {isSignedIn && firstName !== "there" ? `, ${firstName}` : ""}
          </Text>
          <Text style={[styles.greetSub, { color: colors.mutedForeground }]}>
            Let's find the perfect outfit for today.
          </Text>
        </View>

        {/* Weather + Occasion cards */}
        <View style={styles.infoRow}>
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
            style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name={weatherIcon(weatherData?.condition)} size={18} color={colors.accent} />
            <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>Weather</Text>
            <Text style={[styles.infoCardValue, { color: colors.foreground }]} numberOfLines={1}>
              {weatherLabel}
            </Text>
            {weatherSubLabel ? (
              <Text style={[styles.infoCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {weatherSubLabel}
              </Text>
            ) : null}
          </Pressable>
          <View
            style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="briefcase" size={18} color={colors.primary} />
            <Text style={[styles.infoCardLabel, { color: colors.mutedForeground }]}>Occasion</Text>
            <Text style={[styles.infoCardValue, { color: colors.foreground }]}>
              {selectedOccasion}
            </Text>
          </View>
        </View>

        {/* Occasion selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.occasionRow}
          style={styles.occasionScroll}
        >
          {OCCASIONS.map((occ) => {
            const active = selectedOccasion === occ;
            return (
              <Pressable
                key={occ}
                onPress={() => setSelectedOccasion(occ)}
                style={[
                  styles.occPill,
                  {
                    backgroundColor: active ? colors.primary : colors.secondary,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.occPillText,
                    {
                      color: active ? colors.primaryForeground : colors.mutedForeground,
                    },
                  ]}
                >
                  {occ}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Generate CTA */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(tabs)/style");
          }}
          style={({ pressed }) => [styles.generateBtn, { opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={[colors.accent, "#9E7C58"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateGradient}
          >
            <Feather name="zap" size={18} color="#fff" />
            <Text style={styles.generateText}>Generate New Look</Text>
          </LinearGradient>
        </Pressable>

        {/* AI Suggestions */}
        <View style={styles.suggestSection}>
          <View style={styles.suggestHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              AI Suggestions
            </Text>
            {savedOutfits.length > 0 && (
              <Pressable onPress={() => router.push("/(tabs)/style")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </Pressable>
            )}
          </View>

          {savedOutfits.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.outfitScrollRow}
            >
              {savedOutfits.slice(0, 5).map((outfit) => (
                <OutfitSuggestionCard
                  key={outfit.id}
                  outfit={outfit}
                  items={items}
                  colors={colors}
                />
              ))}
            </ScrollView>
          ) : featuredItems.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.outfitScrollRow}
            >
              {featuredItems.map((item) => (
                <FeaturedItemCard key={item.id} item={item} colors={colors} router={router} />
              ))}
            </ScrollView>
          ) : (
            <Pressable
              onPress={() => router.push("/(tabs)/scan")}
              style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="plus-circle" size={32} color={colors.primary} />
              <Text style={[styles.emptyCardTitle, { color: colors.foreground }]}>
                Start building your wardrobe
              </Text>
              <Text style={[styles.emptyCardSub, { color: colors.mutedForeground }]}>
                Scan your first clothing item to get AI outfit suggestions
              </Text>
            </Pressable>
          )}
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <QuickStat
            icon="grid"
            value={`${items.length}`}
            label="Items"
            colors={colors}
            onPress={() => router.push("/(tabs)/outfits")}
          />
          <QuickStat
            icon="layers"
            value={`${savedOutfits.length}`}
            label="Outfits"
            colors={colors}
            onPress={() => router.push("/(tabs)/style")}
          />
          <QuickStat
            icon="droplet"
            value={`${laundryItems.length}`}
            label="Laundry"
            colors={colors}
            onPress={() => router.push("/(tabs)/plan")}
          />
        </View>

        {/* Analytics link */}
        {items.length > 0 && (
          <Pressable
            onPress={() => router.push("/analytics" as any)}
            style={({ pressed }) => [
              styles.analyticsRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="bar-chart-2" size={16} color={colors.accent} />
            <Text style={[styles.analyticsText, { color: colors.foreground }]}>
              View Wardrobe Analytics
            </Text>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function OutfitSuggestionCard({
  outfit,
  items,
  colors,
}: {
  outfit: any;
  items: ClothingItem[];
  colors: any;
}) {
  const outfitItems = items.filter((i) => outfit.itemIds?.includes(i.id));
  return (
    <View
      style={[
        styles.outfitCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.outfitImgRow}>
        {outfitItems.slice(0, 2).map((item, idx) => (
          <Image
            key={item.id}
            source={{ uri: item.imageUri }}
            style={[styles.outfitItemImg, { marginLeft: idx > 0 ? -16 : 0, zIndex: 2 - idx }]}
            resizeMode="cover"
          />
        ))}
        {outfitItems.length === 0 && (
          <View
            style={[
              styles.outfitItemImg,
              { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Feather name="layers" size={24} color={colors.mutedForeground} />
          </View>
        )}
      </View>
      <Text
        style={[styles.outfitCardName, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {outfit.name}
      </Text>
      <View style={[styles.matchBadge, { backgroundColor: colors.primary + "22" }]}>
        <Text style={[styles.matchText, { color: colors.primary }]}>Saved</Text>
      </View>
    </View>
  );
}

function FeaturedItemCard({
  item,
  colors,
  router,
}: {
  item: ClothingItem;
  colors: any;
  router: any;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Image source={{ uri: item.imageUri }} style={styles.featuredImg} resizeMode="cover" />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={styles.featuredGradient}
      />
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.featuredCategory}>{item.type}</Text>
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
  value: string;
  label: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickStat,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
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
  scroll: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoText: { fontSize: 18 },
  logoLabel: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: {
    height: 38,
    minWidth: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  avatarInitials: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  signInRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  signInLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  greetSection: { gap: 4 },
  greetTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  greetSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoRow: { flexDirection: "row", gap: 12 },
  infoCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  infoCardLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoCardValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoCardSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  occasionScroll: { marginHorizontal: -20 },
  occasionRow: { paddingHorizontal: 20, gap: 8 },
  occPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  occPillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  generateBtn: { borderRadius: 18, overflow: "hidden" },
  generateGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
  },
  generateText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  suggestSection: { gap: 12 },
  suggestHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  outfitScrollRow: { gap: 12, paddingRight: 4 },
  outfitCard: { width: 148, borderRadius: 16, borderWidth: 1, padding: 10, gap: 8 },
  outfitImgRow: { flexDirection: "row", height: 90 },
  outfitItemImg: { width: 80, height: 90, borderRadius: 10 },
  outfitCardName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  matchText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  featuredCard: { width: 140, height: 180, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  featuredImg: { width: "100%", height: "100%" },
  featuredGradient: { ...StyleSheet.absoluteFillObject },
  featuredInfo: { position: "absolute", bottom: 10, left: 10, right: 10 },
  featuredName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  featuredCategory: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 10 },
  emptyCardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyCardSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 10 },
  quickStat: { flex: 1, alignItems: "center", gap: 4, padding: 14, borderRadius: 16, borderWidth: 1 },
  quickStatValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  quickStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  analyticsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  analyticsText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
});
