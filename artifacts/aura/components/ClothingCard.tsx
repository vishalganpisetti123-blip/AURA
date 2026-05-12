import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { ClothingItem, CATEGORY_LABELS } from "@/types/wardrobe";

interface ClothingCardProps {
  item: ClothingItem;
  size?: "small" | "large";
}

export function ClothingCard({ item, size = "small" }: ClothingCardProps) {
  const colors = useColors();
  const router = useRouter();
  const cardSize = size === "large" ? 180 : 160;

  const handlePress = useCallback(() => {
    router.push(`/item/${item.id}`);
  }, [item.id, router]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardSize,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={[styles.imageContainer, { height: cardSize }]}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather name="image" size={32} color={colors.mutedForeground} />
          </View>
        )}
        <View
          style={[
            styles.colorDot,
            { backgroundColor: item.colorHex, borderColor: colors.border },
          ]}
        />
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>
          {CATEGORY_LABELS[item.category]}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 4,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        }
      : { elevation: 3 }),
  },
  imageContainer: {
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  info: {
    padding: 10,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  category: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
