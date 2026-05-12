import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OutfitCard } from "@/components/OutfitCard";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";
import {
  OccasionType,
  OCCASION_LABELS,
  OutfitSuggestion,
  SavedOutfit,
  WeatherCondition,
  WEATHER_LABELS,
} from "@/types/wardrobe";

const WEATHER_OPTIONS: { value: WeatherCondition; icon: string; emoji: string }[] = [
  { value: "sunny", icon: "sun", emoji: "☀️" },
  { value: "cloudy", icon: "cloud", emoji: "☁️" },
  { value: "rainy", icon: "cloud-rain", emoji: "🌧" },
  { value: "snowy", icon: "cloud-snow", emoji: "❄️" },
  { value: "hot", icon: "thermometer", emoji: "🌡" },
  { value: "cold", icon: "wind", emoji: "🥶" },
  { value: "windy", icon: "wind", emoji: "💨" },
];

const OCCASION_OPTIONS: { value: OccasionType; icon: string }[] = [
  { value: "casual", icon: "coffee" },
  { value: "work", icon: "briefcase" },
  { value: "formal", icon: "award" },
  { value: "date", icon: "heart" },
  { value: "athletic", icon: "activity" },
  { value: "travel", icon: "map" },
];

const DAYS = ["Today", "Tomorrow", "This Weekend", "Next Week"];

export default function PlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, saveOutfit } = useWardrobe();

  const [selectedDay, setSelectedDay] = useState("Today");
  const [weather, setWeather] = useState<WeatherCondition>("sunny");
  const [occasion, setOccasion] = useState<OccasionType>("casual");
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannedOutfit, setPlannedOutfit] = useState<OutfitSuggestion | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  const planOutfit = async () => {
    if (items.length < 2) {
      Alert.alert(
        "Not enough items",
        "Add at least 2 clothing items to your wardrobe to plan an outfit."
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlanning(true);
    setPlannedOutfit(null);
    setIsSaved(false);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const response = await fetch(`${baseUrl}/api/wardrobe/outfit-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardrobeItems: items.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            colorName: i.colorName,
            type: i.type,
          })),
          occasion,
          weather,
          count: 1,
        }),
      });
      if (!response.ok) throw new Error("Planning failed");
      const data = await response.json();
      if (data.outfits && data.outfits.length > 0) {
        setPlannedOutfit(data.outfits[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {
      Alert.alert("Planning failed", "Could not plan an outfit. Please try again.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSave = () => {
    if (!plannedOutfit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const outfit: SavedOutfit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: `${selectedDay} — ${plannedOutfit.name}`,
      itemIds: plannedOutfit.itemIds,
      description: plannedOutfit.description,
      tips: plannedOutfit.tips,
      occasion,
      weather,
      savedAt: new Date().toISOString(),
    };
    saveOutfit(outfit);
    setIsSaved(true);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad,
            paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 90,
          },
        ]}
      >
        {/* Header */}
        <Text style={[styles.title, { color: colors.foreground }]}>Plan</Text>
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
          {dateStr}
        </Text>

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayRow}
          contentContainerStyle={{ gap: 10 }}
        >
          {DAYS.map((d) => {
            const sel = selectedDay === d;
            return (
              <Pressable
                key={d}
                onPress={() => setSelectedDay(d)}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: sel ? colors.primary : colors.secondary,
                    borderColor: sel ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    { color: sel ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Config card */}
        <View
          style={[
            styles.configCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Weather */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Weather Conditions
          </Text>
          <View style={styles.weatherGrid}>
            {WEATHER_OPTIONS.map((w) => {
              const sel = weather === w.value;
              return (
                <Pressable
                  key={w.value}
                  onPress={() => setWeather(w.value)}
                  style={[
                    styles.weatherBtn,
                    {
                      backgroundColor: sel ? colors.primary + "20" : colors.secondary,
                      borderColor: sel ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={w.icon as any}
                    size={20}
                    color={sel ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.weatherLabel,
                      { color: sel ? colors.primary : colors.foreground },
                    ]}
                  >
                    {WEATHER_LABELS[w.value]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Occasion */}
          <Text
            style={[styles.label, { color: colors.mutedForeground, marginTop: 12 }]}
          >
            Occasion
          </Text>
          <View style={styles.occasionGrid}>
            {OCCASION_OPTIONS.map((o) => {
              const sel = occasion === o.value;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => setOccasion(o.value)}
                  style={[
                    styles.occasionBtn,
                    {
                      backgroundColor: sel ? colors.primary : colors.secondary,
                      borderColor: sel ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={o.icon as any}
                    size={14}
                    color={sel ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.occasionText,
                      {
                        color: sel
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {OCCASION_LABELS[o.value]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* CTA */}
          <Pressable
            onPress={planOutfit}
            disabled={isPlanning}
            style={({ pressed }) => [
              styles.planBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isPlanning ? 0.8 : 1,
              },
            ]}
          >
            {isPlanning ? (
              <>
                <ActivityIndicator size="small" color={colors.primaryForeground} />
                <Text style={[styles.planBtnText, { color: colors.primaryForeground }]}>
                  Planning...
                </Text>
              </>
            ) : (
              <>
                <Feather name="calendar" size={16} color={colors.primaryForeground} />
                <Text style={[styles.planBtnText, { color: colors.primaryForeground }]}>
                  Plan My Outfit
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Planned outfit result */}
        {plannedOutfit && (
          <View style={{ marginTop: 8 }}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                Your Look for {selectedDay}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Feather name="zap" size={11} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  AI Pick
                </Text>
              </View>
            </View>
            <OutfitCard
              outfit={plannedOutfit}
              items={items}
              isSaved={isSaved}
              onSave={handleSave}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 4 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    marginTop: 2,
  },
  dayRow: {
    maxHeight: 44,
    marginBottom: 20,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  configCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  weatherGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weatherBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 72,
  },
  weatherLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  occasionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  occasionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  occasionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  planBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  planBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
