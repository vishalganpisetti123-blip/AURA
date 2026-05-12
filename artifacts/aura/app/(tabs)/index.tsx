import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { ClothingCard } from "@/components/ClothingCard";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";
import {
  ClothingCategory,
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

export default function WardrobeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, isLoading } = useWardrobe();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | "all">("all");
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const subcategories =
    selectedCategory !== "all" ? SUBCATEGORIES[selectedCategory] ?? [] : [];

  const filtered = useMemo(() => {
    let result = selectedCategory === "all"
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

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  const handleCategorySelect = (cat: ClothingCategory | "all") => {
    setSelectedCategory(cat);
    setSelectedSub(null);
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSignedIn) {
      // Show a simple sign-out alert - could expand to profile modal later
      router.push("/(auth)/sign-in");
    } else {
      router.push("/(auth)/sign-in");
    }
  };

  const initials = user?.firstName?.charAt(0)?.toUpperCase() ?? 
    user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={[styles.appName, { color: colors.foreground }]}>AURA</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {items.length} {items.length === 1 ? "item" : "items"} in wardrobe
          </Text>
        </View>
        <Pressable
          onPress={handleProfilePress}
          style={({ pressed }) => [
            styles.profileBtn,
            {
              backgroundColor: isSignedIn ? colors.primary + "22" : colors.secondary,
              borderColor: isSignedIn ? colors.primary : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {isSignedIn && user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : isSignedIn ? (
            <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
          ) : (
            <View style={styles.signInContent}>
              <Feather name="user" size={14} color={colors.mutedForeground} />
              <Text style={[styles.signInText, { color: colors.mutedForeground }]}>
                Sign In
              </Text>
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
                {cat === "all" ? "All" : CATEGORY_LABELS[cat as ClothingCategory]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Subcategory filter (shown when a category is selected) */}
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

      {/* Items grid */}
      {isLoading ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Loading wardrobe...
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={[colors.primary + "22", "transparent"]}
            style={styles.emptyGradient}
          />
          <Feather name="wind" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {items.length === 0 ? "Your wardrobe is empty" : "No items here"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {items.length === 0
              ? "Go to the Scan tab to add your first clothing item"
              : "Try selecting a different category or filter"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 90 },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ClothingCard item={item} />}
        />
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
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  profileBtn: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  initials: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 4,
  },
  signInContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
  },
  signInText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  filterRow: {
    maxHeight: 44,
    marginBottom: 8,
  },
  subFilterRow: {
    maxHeight: 38,
    marginBottom: 10,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  subPillText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  gridContent: { paddingHorizontal: 12 },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
