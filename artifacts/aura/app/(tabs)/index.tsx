import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
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

export default function WardrobeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, isLoading } = useWardrobe();
  const [selectedCategory, setSelectedCategory] = useState<
    ClothingCategory | "all"
  >("all");

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const topPad =
    Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            AURA
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {items.length} {items.length === 1 ? "item" : "items"} in wardrobe
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/scan")}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="plus" size={22} color={colors.primaryForeground} />
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
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.secondary,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isSelected
                      ? colors.primaryForeground
                      : colors.foreground,
                  },
                ]}
              >
                {cat === "all"
                  ? "All"
                  : CATEGORY_LABELS[cat as ClothingCategory]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
              ? "Tap the + button to scan and add your first clothing item"
              : "Try selecting a different category"}
          </Text>
          {items.length === 0 && (
            <Pressable
              onPress={() => router.push("/(tabs)/scan")}
              style={[styles.scanBtn, { backgroundColor: colors.primary }]}
            >
              <Feather
                name="camera"
                size={16}
                color={colors.primaryForeground}
              />
              <Text
                style={[
                  styles.scanBtnText,
                  { color: colors.primaryForeground },
                ]}
              >
                Scan Clothing
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={[
            styles.gridContent,
            {
              paddingBottom:
                Platform.OS === "web" ? 100 : insets.bottom + 90,
            },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filtered.length > 0}
          renderItem={({ item }) => <ClothingCard item={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    maxHeight: 44,
    marginBottom: 12,
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
  gridContent: {
    paddingHorizontal: 12,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  scanBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
