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

const WEATHER_OPTIONS: WeatherCondition[] = [
  "sunny",
  "cloudy",
  "rainy",
  "snowy",
  "hot",
  "cold",
  "windy",
];

const OCCASION_OPTIONS: OccasionType[] = [
  "casual",
  "work",
  "formal",
  "date",
  "athletic",
  "travel",
];

const WEATHER_ICONS: Record<WeatherCondition, string> = {
  sunny: "sun",
  cloudy: "cloud",
  rainy: "cloud-rain",
  snowy: "cloud-snow",
  hot: "thermometer",
  cold: "wind",
  windy: "wind",
};

export default function OutfitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items, savedOutfits, saveOutfit, removeOutfit } = useWardrobe();

  const [weather, setWeather] = useState<WeatherCondition>("sunny");
  const [occasion, setOccasion] = useState<OccasionType>("casual");
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const topPad =
    Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  const generateOutfits = async () => {
    if (items.length < 2) {
      Alert.alert(
        "Not enough items",
        "Add at least 2 items to your wardrobe to generate outfit suggestions."
      );
      return;
    }
    setIsGenerating(true);
    setHasGenerated(false);
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
          count: 3,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate outfits");
      const data = await response.json();
      setSuggestions(data.outfits ?? []);
      setHasGenerated(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {
      Alert.alert(
        "Generation failed",
        "Could not generate outfit suggestions. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = (s: OutfitSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const outfit: SavedOutfit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: s.name,
      itemIds: s.itemIds,
      description: s.description,
      tips: s.tips,
      occasion,
      weather,
      savedAt: new Date().toISOString(),
    };
    saveOutfit(outfit);
  };

  const isSuggestionSaved = (s: OutfitSuggestion) =>
    savedOutfits.some((o) => o.name === s.name);

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
        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          Outfits
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          AI-generated looks from your wardrobe
        </Text>

        {/* Generator Card */}
        <View
          style={[
            styles.genCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Weather */}
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            Weather
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={styles.optionsRow}
          >
            {WEATHER_OPTIONS.map((w) => {
              const sel = weather === w;
              return (
                <Pressable
                  key={w}
                  onPress={() => setWeather(w)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: sel
                        ? colors.primary
                        : colors.secondary,
                      borderColor: sel ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={WEATHER_ICONS[w] as any}
                    size={13}
                    color={
                      sel ? colors.primaryForeground : colors.mutedForeground
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: sel
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {WEATHER_LABELS[w]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Occasion */}
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            Occasion
          </Text>
          <View style={styles.occasionGrid}>
            {OCCASION_OPTIONS.map((o) => {
              const sel = occasion === o;
              return (
                <Pressable
                  key={o}
                  onPress={() => setOccasion(o)}
                  style={[
                    styles.occasionBtn,
                    {
                      backgroundColor: sel
                        ? colors.primary
                        : colors.secondary,
                      borderColor: sel ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: sel
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {OCCASION_LABELS[o]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={generateOutfits}
            disabled={isGenerating}
            style={({ pressed }) => [
              styles.generateBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isGenerating ? 0.8 : 1,
              },
            ]}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={colors.primaryForeground}
                />
                <Text
                  style={[
                    styles.generateBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Generating...
                </Text>
              </>
            ) : (
              <>
                <Feather
                  name="zap"
                  size={16}
                  color={colors.primaryForeground}
                />
                <Text
                  style={[
                    styles.generateBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Generate Outfits
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Suggestions */}
        {hasGenerated && suggestions.length > 0 && (
          <>
            <Text
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              Suggested Looks
            </Text>
            {suggestions.map((s, idx) => (
              <OutfitCard
                key={idx}
                outfit={s}
                items={items}
                isSaved={isSuggestionSaved(s)}
                onSave={() => handleSave(s)}
              />
            ))}
          </>
        )}

        {hasGenerated && suggestions.length === 0 && (
          <View style={styles.noResults}>
            <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
            <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>
              No outfits found for this combination. Try different filters.
            </Text>
          </View>
        )}

        {/* Saved Outfits */}
        {savedOutfits.length > 0 && (
          <>
            <Text
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              Saved Outfits
            </Text>
            {savedOutfits.map((o) => (
              <OutfitCard
                key={o.id}
                outfit={o}
                items={items}
                isSaved={true}
                onRemove={() => removeOutfit(o.id)}
              />
            ))}
          </>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  genCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  optionsRow: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  occasionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  occasionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  generateBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
    marginBottom: 12,
  },
  noResults: {
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
