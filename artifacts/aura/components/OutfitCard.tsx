import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { ClothingItem, SavedOutfit } from "@/types/wardrobe";

interface OutfitCardProps {
  outfit: { name: string; itemIds: string[]; description: string; tips: string };
  items: ClothingItem[];
  onSave?: () => void;
  onRemove?: () => void;
  isSaved?: boolean;
}

export function OutfitCard({
  outfit,
  items,
  onSave,
  onRemove,
  isSaved,
}: OutfitCardProps) {
  const colors = useColors();
  const outfitItems = outfit.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ClothingItem => !!i);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Item images row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imagesRow}
        contentContainerStyle={styles.imagesContent}
      >
        {outfitItems.map((item) => (
          <View key={item.id} style={styles.itemImageWrap}>
            {item.imageUri ? (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.itemImage,
                  {
                    backgroundColor: colors.secondary,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: item.colorHex },
                  ]}
                />
              </View>
            )}
            <Text
              style={[styles.itemLabel, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.outfitName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {outfit.name}
          </Text>
          {onSave && !isSaved && (
            <Pressable
              onPress={onSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="bookmark" size={14} color={colors.primaryForeground} />
            </Pressable>
          )}
          {isSaved && onRemove && (
            <Pressable
              onPress={onRemove}
              style={[styles.saveBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {outfit.description}
        </Text>
        <View style={[styles.tipBox, { backgroundColor: colors.muted }]}>
          <Feather
            name="zap"
            size={12}
            color={colors.accent}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.tip, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {outfit.tips}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        }
      : { elevation: 4 }),
  },
  imagesRow: {
    maxHeight: 110,
  },
  imagesContent: {
    padding: 12,
    gap: 10,
  },
  itemImageWrap: {
    alignItems: "center",
    width: 80,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  itemLabel: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    width: 80,
  },
  details: {
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  outfitName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  saveBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 10,
    padding: 10,
  },
  tip: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 17,
  },
});
