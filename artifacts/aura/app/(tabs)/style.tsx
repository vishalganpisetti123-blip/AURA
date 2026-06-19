import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";
import {
  OccasionType,
  OutfitSuggestion,
  SavedOutfit,
  WeatherCondition,
  WEATHER_LABELS,
  OCCASION_LABELS,
} from "@/types/wardrobe";

type PlannerView = "plan" | "stylist";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface CapsuleEssential {
  item: string;
  category: string;
  reason: string;
  pairs_with: string;
}

interface CapsuleData {
  essentials: CapsuleEssential[];
  insight: string;
}

const DAYS_OF_WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const WEATHER_OPTIONS: { value: WeatherCondition; emoji: string }[] = [
  { value: "sunny", emoji: "☀️" },
  { value: "cloudy", emoji: "☁️" },
  { value: "rainy", emoji: "🌧" },
  { value: "hot", emoji: "🌡" },
  { value: "cold", emoji: "🥶" },
  { value: "snowy", emoji: "❄️" },
];
const OCCASION_OPTIONS: OccasionType[] = ["casual", "work", "formal", "date", "athletic", "travel"];
const STARTER_MSGS = [
  "What should I wear to a job interview?",
  "How do I style white sneakers?",
  "What colors match my wardrobe?",
  "Build me a travel capsule wardrobe",
];

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    return {
      day: DAYS_OF_WEEK[i],
      date: d.getDate(),
      dateStr,
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

export default function PlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const {
    items,
    savedOutfits,
    saveOutfit,
    plannedDates,
    planOutfitForDate,
    markOutfitAsWorn,
  } = useWardrobe();

  const [activeView, setActiveView] = useState<PlannerView>("plan");

  // Plan state
  const [selectedDayIdx, setSelectedDayIdx] = useState(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  );
  const [weather, setWeather] = useState<WeatherCondition>("sunny");
  const [occasion, setOccasion] = useState<OccasionType>("casual");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<OutfitSuggestion | null>(null);
  const [savedOutfitId, setSavedOutfitId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Capsule state
  const [capsuleData, setCapsuleData] = useState<CapsuleData | null>(null);
  const [isCapsuleLoading, setIsCapsuleLoading] = useState(false);

  const weekDates = getWeekDates();
  const topPad = Platform.OS === "web" ? 20 : insets.top + 8;
  const bottomPad = Platform.OS === "web" ? 80 : insets.bottom + 80;

  const displayName =
    user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "";
  const initials =
    ((user?.firstName?.charAt(0) ?? "") + (user?.lastName?.charAt(0) ?? "")).toUpperCase() ||
    displayName.charAt(0).toUpperCase();

  const handleProfile = () => {
    if (isSignedIn) router.push("/profile");
    else router.push("/(auth)/sign-in");
  };

  const getBaseUrl = () => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    return domain ? `https://${domain}` : "";
  };

  // Plan: Generate outfit
  const generateOutfit = async () => {
    if (items.length < 2) {
      Alert.alert("Not enough items", "Add at least 2 items to your wardrobe.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setGeneratedOutfit(null);
    setSavedOutfitId(null);
    try {
      const res = await fetch(`${getBaseUrl()}/api/wardrobe/outfit-suggestions`, {
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.outfits?.[0]) {
        setGeneratedOutfit(data.outfits[0]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Generation failed", "Could not generate outfit. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOutfit = (): string | null => {
    if (!generatedOutfit || savedOutfitId) return savedOutfitId;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const outfit: SavedOutfit = {
      id,
      name: generatedOutfit.name,
      itemIds: generatedOutfit.itemIds,
      description: generatedOutfit.description,
      tips: generatedOutfit.tips,
      occasion,
      weather,
      savedAt: new Date().toISOString(),
    };
    saveOutfit(outfit);
    setSavedOutfitId(id);
    return id;
  };

  const handleAssignToDay = () => {
    if (!generatedOutfit) return;
    const id = handleSaveOutfit();
    if (!id) return;
    const selectedDate = weekDates[selectedDayIdx];
    planOutfitForDate(selectedDate.dateStr, id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Planned! 📅", `"${generatedOutfit.name}" is set for ${selectedDate.day}.`);
  };

  const handleWoreOutfit = (outfitId: string) => {
    const outfit = savedOutfits.find((o) => o.id === outfitId);
    if (!outfit) return;
    Alert.alert(
      "Wore This Outfit?",
      "Items in this outfit will be marked as worn and moved to laundry.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, I Wore It",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markOutfitAsWorn(outfitId);
          },
        },
      ]
    );
  };

  // Capsule wardrobe
  const fetchCapsule = async () => {
    if (isCapsuleLoading) return;
    setIsCapsuleLoading(true);
    setCapsuleData(null);
    try {
      const res = await fetch(`${getBaseUrl()}/api/wardrobe/capsule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardrobeItems: items.map((i) => ({
            name: i.name,
            category: i.category,
            type: i.type,
            colorName: i.colorName,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCapsuleData(data);
    } catch {
      Alert.alert("Error", "Could not fetch capsule wardrobe suggestions.");
    } finally {
      setIsCapsuleLoading(false);
    }
  };

  // Chat
  const wardrobeSummary =
    items.length > 0
      ? `The user has ${items.length} items: ${items
          .slice(0, 15)
          .map((i) => `${i.name} (${i.category})`)
          .join(", ")}${items.length > 15 ? " and more" : ""}.`
      : undefined;

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", isStreaming: true },
      ]);
      setInput("");
      setIsStreaming(true);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const res = await fetch(`${getBaseUrl()}/api/wardrobe/style-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            wardrobeSummary,
          }),
        });
        if (!res.ok) throw new Error();
        const reader = res.body?.getReader();
        if (!reader) throw new Error();
        const decoder = new TextDecoder();
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
          setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, I couldn't connect. Please try again.", isStreaming: false }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [messages, isStreaming, wardrobeSummary]
  );

  const selectedDate = weekDates[selectedDayIdx];
  const plannedOutfitId = selectedDate ? plannedDates[selectedDate.dateStr] : null;
  const plannedOutfit = plannedOutfitId
    ? savedOutfits.find((o) => o.id === plannedOutfitId)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Planner</Text>
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

      {/* Segment control */}
      <View
        style={[
          styles.segment,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        {(["plan", "stylist"] as PlannerView[]).map((v) => (
          <Pressable
            key={v}
            onPress={() => setActiveView(v)}
            style={[styles.segmentTab, activeView === v && { backgroundColor: colors.card }]}
          >
            <Feather
              name={v === "plan" ? "calendar" : "message-circle"}
              size={14}
              color={activeView === v ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeView === v ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {v === "plan" ? "Plan" : "AI Stylist"}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeView === "plan" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.planContent, { paddingBottom: bottomPad }]}
        >
          {/* Calendar week */}
          <View
            style={[
              styles.calendarCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.calendarMonth, { color: colors.foreground }]}>
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekRow}
            >
              {weekDates.map((d, idx) => {
                const hasPlan = !!plannedDates[d.dateStr];
                const isSelected = selectedDayIdx === idx;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => setSelectedDayIdx(idx)}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: colors.primary },
                      d.isToday && !isSelected && {
                        borderColor: colors.primary,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        {
                          color: isSelected
                            ? colors.primaryForeground
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {d.day}
                    </Text>
                    <Text
                      style={[
                        styles.dateNum,
                        { color: isSelected ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {d.date}
                    </Text>
                    {hasPlan && (
                      <View
                        style={[
                          styles.planDot,
                          {
                            backgroundColor: isSelected
                              ? colors.primaryForeground
                              : colors.accent,
                          },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Planned outfit for selected day */}
          {plannedOutfit && (
            <View
              style={[
                styles.plannedBanner,
                { backgroundColor: colors.accent + "18", borderColor: colors.accent + "44" },
              ]}
            >
              <Feather name="check-circle" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.plannedLabel, { color: colors.accent }]}>
                  Planned for {selectedDate.day}
                </Text>
                <Text style={[styles.plannedName, { color: colors.foreground }]} numberOfLines={1}>
                  {plannedOutfit.name}
                </Text>
              </View>
              <Pressable
                onPress={() => planOutfitForDate(selectedDate.dateStr, null)}
                hitSlop={8}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          )}

          {/* Weather picker */}
          <View style={styles.subSection}>
            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Weather</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {WEATHER_OPTIONS.map(({ value, emoji }) => {
                const sel = weather === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setWeather(value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: sel ? colors.primary : colors.secondary,
                        borderColor: sel ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.chipEmoji}>{emoji}</Text>
                    <Text
                      style={[
                        styles.chipText,
                        { color: sel ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {WEATHER_LABELS[value]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Occasion picker */}
          <View style={styles.subSection}>
            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Occasion</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {OCCASION_OPTIONS.map((occ) => {
                const sel = occasion === occ;
                return (
                  <Pressable
                    key={occ}
                    onPress={() => setOccasion(occ)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: sel ? colors.accent : colors.secondary,
                        borderColor: sel ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: sel ? colors.accentForeground : colors.foreground },
                      ]}
                    >
                      {OCCASION_LABELS[occ]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Generate button */}
          <Pressable
            onPress={generateOutfit}
            disabled={isGenerating}
            style={({ pressed }) => [
              styles.generateBtn,
              { opacity: pressed || isGenerating ? 0.8 : 1 },
            ]}
          >
            <LinearGradient
              colors={[colors.accent, "#9E7C58"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateGradient}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="zap" size={18} color="#fff" />
              )}
              <Text style={styles.generateText}>
                {isGenerating ? "Generating..." : "Plan My Outfit"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Generated outfit */}
          {generatedOutfit && (
            <View
              style={[
                styles.outfitResult,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.outfitName, { color: colors.foreground }]}>
                {generatedOutfit.name}
              </Text>
              <Text style={[styles.outfitDesc, { color: colors.mutedForeground }]}>
                {generatedOutfit.description}
              </Text>
              {generatedOutfit.itemIds.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.outfitItemsRow}
                >
                  {items
                    .filter((i) => generatedOutfit.itemIds.includes(i.id))
                    .map((item) => (
                      <View key={item.id} style={styles.outfitItemThumb}>
                        <Image
                          source={{ uri: item.imageUri }}
                          style={styles.outfitItemImg}
                          resizeMode="cover"
                        />
                        <Text
                          style={[styles.outfitItemName, { color: colors.mutedForeground }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </View>
                    ))}
                </ScrollView>
              )}
              {generatedOutfit.tips ? (
                <View style={[styles.tipBox, { backgroundColor: colors.muted }]}>
                  <Feather name="info" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                    {generatedOutfit.tips}
                  </Text>
                </View>
              ) : null}
              <View style={styles.outfitActions}>
                <Pressable
                  onPress={generateOutfit}
                  style={[
                    styles.outfitActionBtn,
                    { backgroundColor: colors.secondary, borderColor: colors.border },
                  ]}
                >
                  <Feather name="refresh-cw" size={14} color={colors.foreground} />
                  <Text style={[styles.outfitActionText, { color: colors.foreground }]}>
                    Regenerate
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleSaveOutfit()}
                  disabled={!!savedOutfitId}
                  style={[
                    styles.outfitActionBtn,
                    {
                      backgroundColor: savedOutfitId
                        ? colors.primary + "33"
                        : colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Feather
                    name={savedOutfitId ? "check" : "bookmark"}
                    size={14}
                    color={savedOutfitId ? colors.primary : colors.primaryForeground}
                  />
                  <Text
                    style={[
                      styles.outfitActionText,
                      { color: savedOutfitId ? colors.primary : colors.primaryForeground },
                    ]}
                  >
                    {savedOutfitId ? "Saved!" : "Save"}
                  </Text>
                </Pressable>
              </View>
              {/* Assign to day */}
              <Pressable
                onPress={handleAssignToDay}
                style={[
                  styles.assignBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <Feather name="calendar" size={14} color={colors.foreground} />
                <Text style={[styles.assignBtnText, { color: colors.foreground }]}>
                  Assign to {selectedDate.day}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Saved outfits */}
          {savedOutfits.length > 0 && (
            <View style={styles.subSection}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>
                Planned Outfits
              </Text>
              {savedOutfits.slice(0, 5).map((outfit) => (
                <View
                  key={outfit.id}
                  style={[
                    styles.savedOutfitRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.savedOutfitImgs}>
                    {items
                      .filter((i) => outfit.itemIds?.includes(i.id))
                      .slice(0, 2)
                      .map((item, idx) => (
                        <Image
                          key={item.id}
                          source={{ uri: item.imageUri }}
                          style={[
                            styles.savedOutfitThumb,
                            { marginLeft: idx > 0 ? -10 : 0 },
                          ]}
                          resizeMode="cover"
                        />
                      ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.savedOutfitName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {outfit.name}
                    </Text>
                    <Text style={[styles.savedOutfitMeta, { color: colors.mutedForeground }]}>
                      {outfit.occasion} · {outfit.weather}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleWoreOutfit(outfit.id)}
                    style={[
                      styles.woreBtn,
                      {
                        backgroundColor: colors.accent + "18",
                        borderColor: colors.accent + "44",
                      },
                    ]}
                  >
                    <Feather name="check" size={12} color={colors.accent} />
                    <Text style={[styles.woreBtnText, { color: colors.accent }]}>Wore</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        // AI Stylist
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={bottomPad}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.chatContent, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              messages.length === 0 ? (
                <View style={styles.chatEmpty}>
                  <View
                    style={[
                      styles.chatEmptyIcon,
                      { backgroundColor: colors.primary + "22" },
                    ]}
                  >
                    <Feather name="message-circle" size={32} color={colors.primary} />
                  </View>
                  <Text style={[styles.chatEmptyTitle, { color: colors.foreground }]}>
                    AI Stylist
                  </Text>
                  <Text style={[styles.chatEmptySub, { color: colors.mutedForeground }]}>
                    Ask me anything about your style or wardrobe.
                  </Text>

                  {/* Capsule wardrobe button */}
                  <Pressable
                    onPress={fetchCapsule}
                    style={({ pressed }) => [
                      styles.capsuleBtn,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.capsuleBtnIcon,
                        { backgroundColor: colors.accent + "22" },
                      ]}
                    >
                      {isCapsuleLoading ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <Feather name="cpu" size={16} color={colors.accent} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.capsuleBtnTitle, { color: colors.foreground }]}>
                        Capsule Wardrobe Analysis
                      </Text>
                      <Text style={[styles.capsuleBtnSub, { color: colors.mutedForeground }]}>
                        See what essentials you're missing
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </Pressable>

                  {/* Capsule result */}
                  {capsuleData && (
                    <View
                      style={[
                        styles.capsuleResult,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      {capsuleData.insight ? (
                        <Text style={[styles.capsuleInsight, { color: colors.mutedForeground }]}>
                          {capsuleData.insight}
                        </Text>
                      ) : null}
                      {capsuleData.essentials.map((e, i) => (
                        <View key={i} style={styles.capsuleEssentialRow}>
                          <View
                            style={[
                              styles.capsuleEssentialIcon,
                              { backgroundColor: colors.accent + "22" },
                            ]}
                          >
                            <Feather name="plus" size={12} color={colors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.capsuleItemName, { color: colors.foreground }]}>
                              {e.item}
                            </Text>
                            <Text style={[styles.capsuleItemReason, { color: colors.mutedForeground }]}>
                              {e.reason}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.starterRow}>
                    {STARTER_MSGS.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => sendMessage(s)}
                        style={[
                          styles.starter,
                          { backgroundColor: colors.card, borderColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.starterText, { color: colors.foreground }]}>
                          {s}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item: msg }) => (
              <View style={[styles.bubble, msg.role === "user" ? styles.userBubble : null]}>
                {msg.role === "assistant" && (
                  <View
                    style={[styles.auraAvatar, { backgroundColor: colors.primary + "22" }]}
                  >
                    <Text style={{ fontSize: 12 }}>✦</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubbleContent,
                    msg.role === "user"
                      ? { backgroundColor: colors.primary }
                      : {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderWidth: 1,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      {
                        color:
                          msg.role === "user"
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {msg.content || (msg.isStreaming ? "..." : "")}
                  </Text>
                </View>
              </View>
            )}
          />
          <View
            style={[
              styles.chatInput,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: bottomPad > 60 ? 0 : 16,
              },
            ]}
          >
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your wardrobe..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.textInput, { color: colors.foreground }]}
                multiline
                maxLength={500}
                onSubmitEditing={() => {
                  sendMessage(input);
                }}
                returnKeyType="send"
              />
              <Pressable
                onPress={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor:
                      input.trim() && !isStreaming ? colors.primary : colors.muted,
                  },
                ]}
              >
                {isStreaming ? (
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                ) : (
                  <Feather
                    name="send"
                    size={16}
                    color={input.trim() ? colors.primaryForeground : colors.mutedForeground}
                  />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    height: 36,
    minWidth: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  avatarInitials: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  signInRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  signInLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  segment: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 11,
  },
  segmentText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  planContent: { paddingHorizontal: 20, gap: 16 },
  calendarCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  calendarMonth: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  weekRow: { gap: 4 },
  dayCell: {
    width: 40,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dayLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dateNum: { fontSize: 15, fontFamily: "Inter_700Bold" },
  planDot: { width: 5, height: 5, borderRadius: 3 },
  plannedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  plannedLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  plannedName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  subSection: { gap: 10 },
  subLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  chipRow: { gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
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
  outfitResult: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  outfitName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  outfitDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  outfitItemsRow: { gap: 10 },
  outfitItemThumb: { width: 80, gap: 6 },
  outfitItemImg: { width: 80, height: 100, borderRadius: 12 },
  outfitItemName: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  tipBox: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 10 },
  tipText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  outfitActions: { flexDirection: "row", gap: 10 },
  outfitActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  outfitActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  assignBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  savedOutfitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  savedOutfitImgs: { flexDirection: "row" },
  savedOutfitThumb: { width: 40, height: 48, borderRadius: 8 },
  savedOutfitName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  savedOutfitMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  woreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  woreBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  chatContent: { paddingHorizontal: 16, gap: 12 },
  chatEmpty: { paddingTop: 24, paddingBottom: 12, gap: 16, alignItems: "stretch" },
  chatEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  chatEmptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  chatEmptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  capsuleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  capsuleBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleBtnTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  capsuleBtnSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  capsuleResult: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  capsuleInsight: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    fontStyle: "italic",
  },
  capsuleEssentialRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  capsuleEssentialIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  capsuleItemName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  capsuleItemReason: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 15 },
  starterRow: { gap: 8 },
  starter: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  starterText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  bubble: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  userBubble: { justifyContent: "flex-end" },
  auraAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleContent: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  chatInput: { borderTopWidth: 1, padding: 12, gap: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
