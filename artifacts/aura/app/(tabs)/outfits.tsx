import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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
import {
  ClothingCategory,
  ClothingItem,
  CATEGORY_LABELS,
} from "@/types/wardrobe";

const ALL_CATEGORIES: (ClothingCategory | "all")[] = [
  "all",
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "accessories",
  "activewear",
];

const SUBCATEGORIES: Partial<Record<ClothingCategory, string[]>> = {
  tops: ["T-Shirts", "Shirts", "Sweatshirts", "Jackets", "Blazers", "Suits"],
  bottoms: ["Jeans", "Trousers", "Shorts", "Track Pants"],
  dresses: ["Casual", "Formal", "Maxi", "Mini", "Co-ords"],
  shoes: ["Casual", "Sports", "Formal", "Sneakers", "Boots", "Sandals"],
  accessories: ["Wallets", "Belts", "Watches", "Sunglasses", "Caps"],
  outerwear: ["Jackets", "Coats", "Rain Jackets", "Blazers"],
  activewear: ["Sports Tops", "Track Pants", "Tracksuits", "Swimwear"],
};

const NUM_COLS = 2;

export default function ClosetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { items, sendToLaundry, markAsWorn } = useWardrobe();

  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | "all">("all");
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 20 : insets.top + 8;

  const subcategories =
    selectedCategory !== "all" ? SUBCATEGORIES[selectedCategory] ?? [] : [];

  const filtered = useMemo(() => {
    let result =
      selectedCategory === "all"
        ? items
        : items.filter((i) => i.category === selectedCategory);
    if (selectedSub) {
      const sub = selectedSub.toLowerCase();
      result = result.filter(
        (i) =>
          i.type.toLowerCase().includes(sub) ||
          i.name.toLowerCase().includes(sub) ||
          i.tags.some((t) => t.toLowerCase().includes(sub))
      );
    }
    return result;
  }, [items, selectedCategory, selectedSub]);

  const displayName =
    user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "";

  const initials = (
    (user?.firstName?.charAt(0) ?? "") + (user?.lastName?.charAt(0) ?? "")
  ).toUpperCase() || displayName.charAt(0).toUpperCase();

  const handleProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSignedIn) router.push("/profile");
    else router.push("/(auth)/sign-in");
  };

  const handleLaundry = (item: ClothingItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "What would you like to do?",
      `"${item.name}"`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send to Laundry",
          onPress: () => sendToLaundry(item.id),
        },
        {
          text: "Wore Today ✓",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markAsWorn(item.id);
          },
        },
      ]
    );
  };

  const handleCategorySelect = (cat: ClothingCategory | "all") => {
    setSelectedCategory(cat);
    setSelectedSub(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.logoText, { color: colors.primary }]}>✦</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Closet</Text>
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

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {ALL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => handleCategorySelect(cat)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.secondary,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isSelected ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {cat === "all" ? "All Items" : CATEGORY_LABELS[cat]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Subcategory filter */}
      {subcategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subFilterRow}
          contentContainerStyle={styles.filterContent}
        >
          <Pressable
            onPress={() => setSelectedSub(null)}
            style={[
              styles.subPill,
              {
                backgroundColor: !selectedSub ? colors.accent + "22" : "transparent",
                borderColor: !selectedSub ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.subPillText,
                { color: !selectedSub ? colors.accent : colors.mutedForeground },
              ]}
            >
              All
            </Text>
          </Pressable>
          {subcategories.map((sub) => {
            const isSelected = selectedSub === sub;
            return (
              <Pressable
                key={sub}
                onPress={() => setSelectedSub(isSelected ? null : sub)}
                style={[
                  styles.subPill,
                  {
                    backgroundColor: isSelected ? colors.accent + "22" : "transparent",
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subPillText,
                    { color: isSelected ? colors.accent : colors.mutedForeground },
                  ]}
                >
                  {sub}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Count */}
      <Text style={[styles.countText, { color: colors.mutedForeground }]}>
        {filtered.length} {filtered.length === 1 ? "item" : "items"}
      </Text>

      {/* Grid */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="wind" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {items.length === 0 ? "Your closet is empty" : "No items here"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {items.length === 0
              ? "Go to Scan to add your first piece"
              : "Try a different category or filter"}
          </Text>
          {items.length === 0 && (
            <Pressable
              onPress={() => router.push("/(tabs)/scan")}
              style={[styles.scanBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="camera" size={16} color={colors.primaryForeground} />
              <Text style={[styles.scanBtnText, { color: colors.primaryForeground }]}>
                Scan First Item
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={NUM_COLS}
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: Platform.OS === "web" ? 80 : insets.bottom + 80 },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ClosetCard
              item={item}
              colors={colors}
              router={router}
              onLaundry={handleLaundry}
            />
          )}
        />
      )}
    </View>
  );
}

function ClosetCard({
  item,
  colors,
  router,
  onLaundry,
}: {
  item: ClothingItem;
  colors: any;
  router: any;
  onLaundry: (item: ClothingItem) => void;
}) {
  const wornCount = item.wornCount ?? 0;
  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={styles.cardImgWrap}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImgPlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={28} color={colors.mutedForeground} />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.55)"]}
          style={StyleSheet.absoluteFill}
        />
        {/* Color dot */}
        <View
          style={[
            styles.colorDot,
            { backgroundColor: item.colorHex, borderColor: "rgba(255,255,255,0.3)" },
          ]}
        />
        {/* Wear count badge */}
        {wornCount > 0 && (
          <View style={[styles.wornBadge, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
            <Text style={styles.wornBadgeText}>{wornCount}×</Text>
          </View>
        )}
        {/* Laundry/Wore button */}
        <Pressable
          onPress={() => onLaundry(item)}
          hitSlop={8}
          style={[styles.laundryBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <Feather name="droplet" size={13} color="#fff" />
        </Pressable>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
          {CATEGORY_LABELS[item.category]} · {item.season.join(", ")}
        </Text>
      </View>
    </Pressable>
  );
}

const CARD_GAP = 12;
const H_PAD = 16;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { fontSize: 16 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
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
  filterRow: { maxHeight: 44, marginBottom: 4 },
  subFilterRow: { maxHeight: 38, marginBottom: 4 },
  filterContent: { paddingHorizontal: H_PAD, gap: 8, alignItems: "center" },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  subPillText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: H_PAD,
    marginBottom: 8,
  },
  gridContent: { paddingHorizontal: H_PAD },
  columnWrapper: { justifyContent: "space-between", marginBottom: CARD_GAP },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  scanBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: { width: "48%", borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  cardImgWrap: { width: "100%", height: 180, position: "relative" },
  cardImg: { width: "100%", height: "100%" },
  cardImgPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  wornBadge: {
    position: "absolute",
    bottom: 8,
    right: 36,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  wornBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  laundryBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { padding: 10, gap: 3 },
  cardName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
