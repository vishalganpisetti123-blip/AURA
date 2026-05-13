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
  "Suggest a capsule wardrobe for travel",
  "What colors match my wardrobe?",
];

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { day: DAYS_OF_WEEK[i], date: d.getDate(), isToday: d.toDateString() === today.toDateString() };
  });
}

export default function PlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { items, savedOutfits, saveOutfit } = useWardrobe();

  const [activeView, setActiveView] = useState<PlannerView>("plan");

  // Plan state
  const [selectedDayIdx, setSelectedDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [weather, setWeather] = useState<WeatherCondition>("sunny");
  const [occasion, setOccasion] = useState<OccasionType>("casual");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<OutfitSuggestion | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const listRef = useRef<FlatList>(null);

  const weekDates = getWeekDates();
  const topPad = Platform.OS === "web" ? 20 : insets.top + 8;
  const bottomPad = Platform.OS === "web" ? 80 : insets.bottom + 80;

  const displayName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "";
  const initials = ((user?.firstName?.charAt(0) ?? "") + (user?.lastName?.charAt(0) ?? "")).toUpperCase() || displayName.charAt(0).toUpperCase();

  const handleProfile = () => {
    if (isSignedIn) router.push("/profile");
    else router.push("/(auth)/sign-in");
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
    setIsSaved(false);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const res = await fetch(`${baseUrl}/api/wardrobe/outfit-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardrobeItems: items.map((i) => ({ id: i.id, name: i.name, category: i.category, colorName: i.colorName, type: i.type })),
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

  const handleSaveOutfit = () => {
    if (!generatedOutfit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const outfit: SavedOutfit = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: generatedOutfit.name,
      itemIds: generatedOutfit.itemIds,
      description: generatedOutfit.description,
      tips: generatedOutfit.tips,
      occasion,
      weather,
      savedAt: new Date().toISOString(),
    };
    saveOutfit(outfit);
    setIsSaved(true);
  };

  // Chat: Send message
  const wardrobeSummary = items.length > 0
    ? `The user has ${items.length} items: ${items.slice(0, 15).map((i) => `${i.name} (${i.category})`).join(", ")}${items.length > 15 ? " and more" : ""}.`
    : undefined;

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: text.trim() };
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "", isStreaming: true }]);
    setInput("");
    setIsStreaming(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const res = await fetch(`${baseUrl}/api/wardrobe/style-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
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
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m));
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
      }
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m));
    } catch {
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: "Sorry, I couldn't connect. Please try again.", isStreaming: false } : m));
    } finally {
      setIsStreaming(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isStreaming, wardrobeSummary]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.logoText, { color: colors.primary }]}>✦</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Planner</Text>
        </View>
        <Pressable onPress={handleProfile} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          {isSignedIn && user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              {isSignedIn ? (
                <Text style={[styles.avatarInitials, { color: colors.foreground }]}>{initials}</Text>
              ) : (
                <View style={styles.signInRow}>
                  <Feather name="user" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.signInLabel, { color: colors.mutedForeground }]}>Sign In</Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </View>

      {/* Segment control */}
      <View style={[styles.segment, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        {(["plan", "stylist"] as PlannerView[]).map((v) => (
          <Pressable
            key={v}
            onPress={() => setActiveView(v)}
            style={[
              styles.segmentTab,
              activeView === v && { backgroundColor: colors.card },
            ]}
          >
            <Feather
              name={v === "plan" ? "calendar" : "message-circle"}
              size={14}
              color={activeView === v ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.segmentText, { color: activeView === v ? colors.foreground : colors.mutedForeground }]}>
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
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.calendarMonth, { color: colors.foreground }]}>
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
              {weekDates.map((d, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedDayIdx(idx)}
                  style={[
                    styles.dayCell,
                    selectedDayIdx === idx && { backgroundColor: colors.primary },
                    d.isToday && selectedDayIdx !== idx && { borderColor: colors.primary, borderWidth: 1 },
                  ]}
                >
                  <Text style={[styles.dayLabel, { color: selectedDayIdx === idx ? colors.primaryForeground : colors.mutedForeground }]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateNum, { color: selectedDayIdx === idx ? colors.primaryForeground : colors.foreground }]}>
                    {d.date}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Weather picker */}
          <View style={styles.subSection}>
            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Weather</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {WEATHER_OPTIONS.map(({ value, emoji }) => {
                const sel = weather === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setWeather(value)}
                    style={[
                      styles.chip,
                      { backgroundColor: sel ? colors.primary : colors.secondary, borderColor: sel ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={styles.chipEmoji}>{emoji}</Text>
                    <Text style={[styles.chipText, { color: sel ? colors.primaryForeground : colors.foreground }]}>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {OCCASION_OPTIONS.map((occ) => {
                const sel = occasion === occ;
                return (
                  <Pressable
                    key={occ}
                    onPress={() => setOccasion(occ)}
                    style={[
                      styles.chip,
                      { backgroundColor: sel ? colors.accent : colors.secondary, borderColor: sel ? colors.accent : colors.border },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: sel ? colors.accentForeground : colors.foreground }]}>
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
            style={({ pressed }) => [styles.generateBtn, { opacity: pressed || isGenerating ? 0.8 : 1 }]}
          >
            <LinearGradient colors={[colors.primary, "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.generateGradient}>
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
            <View style={[styles.outfitResult, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.outfitName, { color: colors.foreground }]}>{generatedOutfit.name}</Text>
              <Text style={[styles.outfitDesc, { color: colors.mutedForeground }]}>{generatedOutfit.description}</Text>
              {generatedOutfit.itemIds.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.outfitItemsRow}>
                  {items.filter((i) => generatedOutfit.itemIds.includes(i.id)).map((item) => (
                    <View key={item.id} style={styles.outfitItemThumb}>
                      <Image source={{ uri: item.imageUri }} style={styles.outfitItemImg} resizeMode="cover" />
                      <Text style={[styles.outfitItemName, { color: colors.mutedForeground }]} numberOfLines={1}>{item.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
              {generatedOutfit.tips ? (
                <View style={[styles.tipBox, { backgroundColor: colors.muted }]}>
                  <Feather name="info" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{generatedOutfit.tips}</Text>
                </View>
              ) : null}
              <View style={styles.outfitActions}>
                <Pressable
                  onPress={generateOutfit}
                  style={[styles.outfitActionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <Feather name="refresh-cw" size={14} color={colors.foreground} />
                  <Text style={[styles.outfitActionText, { color: colors.foreground }]}>Regenerate</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveOutfit}
                  disabled={isSaved}
                  style={[
                    styles.outfitActionBtn,
                    { backgroundColor: isSaved ? colors.primary + "33" : colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Feather name={isSaved ? "check" : "bookmark"} size={14} color={isSaved ? colors.primary : colors.primaryForeground} />
                  <Text style={[styles.outfitActionText, { color: isSaved ? colors.primary : colors.primaryForeground }]}>
                    {isSaved ? "Saved!" : "Save Outfit"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Saved outfits list */}
          {savedOutfits.length > 0 && (
            <View style={styles.subSection}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Planned Outfits</Text>
              {savedOutfits.slice(0, 3).map((outfit) => (
                <View key={outfit.id} style={[styles.savedOutfitRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.savedOutfitImgs}>
                    {items.filter((i) => outfit.itemIds?.includes(i.id)).slice(0, 2).map((item, idx) => (
                      <Image
                        key={item.id}
                        source={{ uri: item.imageUri }}
                        style={[styles.savedOutfitThumb, { marginLeft: idx > 0 ? -10 : 0 }]}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.savedOutfitName, { color: colors.foreground }]} numberOfLines={1}>{outfit.name}</Text>
                    <Text style={[styles.savedOutfitMeta, { color: colors.mutedForeground }]}>{outfit.occasion} • {outfit.weather}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        // AI Stylist
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={bottomPad}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.chatContent, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              messages.length === 0 ? (
                <View style={styles.chatEmpty}>
                  <View style={[styles.chatEmptyIcon, { backgroundColor: colors.primary + "22" }]}>
                    <Feather name="message-circle" size={32} color={colors.primary} />
                  </View>
                  <Text style={[styles.chatEmptyTitle, { color: colors.foreground }]}>AI Stylist</Text>
                  <Text style={[styles.chatEmptySub, { color: colors.mutedForeground }]}>
                    Ask me anything about your style or wardrobe.
                  </Text>
                  <View style={styles.starterRow}>
                    {STARTER_MSGS.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => sendMessage(s)}
                        style={[styles.starter, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <Text style={[styles.starterText, { color: colors.foreground }]}>{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null
            }
            renderItem={({ item: msg }) => (
              <View style={[styles.bubble, msg.role === "user" ? styles.userBubble : null]}>
                {msg.role === "assistant" && (
                  <View style={[styles.auraAvatar, { backgroundColor: colors.primary + "22" }]}>
                    <Text style={{ fontSize: 12 }}>✦</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubbleContent,
                    msg.role === "user"
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: msg.role === "user" ? colors.primaryForeground : colors.foreground }]}>
                    {msg.content || (msg.isStreaming ? "..." : "")}
                  </Text>
                </View>
              </View>
            )}
          />
          <View style={[styles.chatInput, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad > 60 ? 0 : 16 }]}>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your wardrobe..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.textInput, { color: colors.foreground }]}
                multiline
                maxLength={500}
                onSubmitEditing={() => { sendMessage(input); }}
                returnKeyType="send"
              />
              <Pressable
                onPress={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                style={[
                  styles.sendBtn,
                  { backgroundColor: input.trim() && !isStreaming ? colors.primary : colors.muted },
                ]}
              >
                {isStreaming ? (
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                ) : (
                  <Feather name="send" size={16} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { fontSize: 16 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { height: 36, minWidth: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  avatarInitials: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  signInRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  signInLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  segment: { flexDirection: "row", marginHorizontal: 20, marginBottom: 16, borderRadius: 14, borderWidth: 1, padding: 3, gap: 3 },
  segmentTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 11 },
  segmentText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  planContent: { paddingHorizontal: 20, gap: 16 },
  calendarCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  calendarMonth: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  weekRow: { gap: 6 },
  dayCell: { width: 40, height: 60, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 4 },
  dayLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dateNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  subSection: { gap: 10 },
  subLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  chipRow: { gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  generateBtn: { borderRadius: 18, overflow: "hidden" },
  generateGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15, borderRadius: 18 },
  generateText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  outfitResult: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  outfitName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  outfitDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  outfitItemsRow: { gap: 10 },
  outfitItemThumb: { alignItems: "center", gap: 4 },
  outfitItemImg: { width: 70, height: 90, borderRadius: 12 },
  outfitItemName: { fontSize: 10, fontFamily: "Inter_400Regular", maxWidth: 70, textAlign: "center" },
  tipBox: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 12, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  outfitActions: { flexDirection: "row", gap: 10 },
  outfitActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  outfitActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  savedOutfitRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  savedOutfitImgs: { flexDirection: "row" },
  savedOutfitThumb: { width: 44, height: 44, borderRadius: 10 },
  savedOutfitName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  savedOutfitMeta: { fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "capitalize", marginTop: 2 },
  chatContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  chatEmpty: { alignItems: "center", paddingTop: 32, gap: 12 },
  chatEmptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  chatEmptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  chatEmptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 260, lineHeight: 20 },
  starterRow: { gap: 8, width: "100%", marginTop: 4 },
  starter: { borderRadius: 12, borderWidth: 1, padding: 12 },
  starterText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  bubble: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userBubble: { flexDirection: "row-reverse" },
  auraAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bubbleContent: { maxWidth: "80%", borderRadius: 18, padding: 12 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  chatInput: { borderTopWidth: 1, padding: 12 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", borderRadius: 16, borderWidth: 1, paddingLeft: 14, paddingRight: 6, paddingVertical: 6 },
  textInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 100, paddingVertical: 6 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginLeft: 4 },
});
