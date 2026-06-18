import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";
import { CATEGORY_LABELS, ClothingItem } from "@/types/wardrobe";

function daysSince(dateStr: string) {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, updateItem, removeItem, markAsWorn } = useWardrobe();
  const item = items.find((i) => i.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item?.name ?? "");

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.mutedForeground }]}>
            Item not found
          </Text>
        </View>
      </View>
    );
  }

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== item.name) {
      await updateItem(id, { name: editedName.trim() });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Remove Item",
      `Remove "${item.name}" from your wardrobe?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await removeItem(id);
            router.back();
          },
        },
      ]
    );
  };

  const handleWoreToday = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Mark as Worn?",
      "This item will be moved to laundry and your wear count will update.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, I Wore It",
          onPress: async () => {
            await markAsWorn(id);
            router.back();
          },
        },
      ]
    );
  };

  const addedDate = new Date(item.addedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40,
          },
        ]}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={[styles.image, { borderColor: colors.border }]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.image,
                styles.imagePlaceholder,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              <View style={[styles.colorCircle, { backgroundColor: item.colorHex }]} />
            </View>
          )}
        </View>

        {/* Name */}
        <View style={styles.nameSection}>
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                style={[
                  styles.nameInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.primary,
                    backgroundColor: colors.card,
                  },
                ]}
                autoFocus
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleSaveName}
                style={[styles.editDoneBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="check" size={16} color={colors.primaryForeground} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setIsEditing(true)}>
              <View style={styles.nameRow}>
                <Text style={[styles.itemName, { color: colors.foreground }]}>
                  {item.name}
                </Text>
                <Feather
                  name="edit-2"
                  size={16}
                  color={colors.mutedForeground}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </Pressable>
          )}
          <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>
            {CATEGORY_LABELS[item.category]}
          </Text>
        </View>

        {/* Wore Today button */}
        <Pressable
          onPress={handleWoreToday}
          style={({ pressed }) => [
            styles.woreBtn,
            {
              backgroundColor: colors.accent + "18",
              borderColor: colors.accent + "55",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.woreBtnContent}>
            <Feather name="check-circle" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.woreBtnLabel, { color: colors.accent }]}>
                Wore Today
              </Text>
              <Text style={[styles.woreBtnSub, { color: colors.mutedForeground }]}>
                Logs a wear · moves to laundry
              </Text>
            </View>
            {(item.wornCount ?? 0) > 0 && (
              <View style={[styles.wornCountBadge, { backgroundColor: colors.accent + "30" }]}>
                <Text style={[styles.wornCountText, { color: colors.accent }]}>
                  {item.wornCount}×
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Info card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <InfoRow
            label="Color"
            colors={colors}
            rightContent={
              <View style={styles.colorRow}>
                <View style={[styles.swatchDot, { backgroundColor: item.colorHex }]} />
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {item.colorName}
                </Text>
              </View>
            }
          />
          <Divider colors={colors} />
          <InfoRow label="Type" value={item.type} colors={colors} />
          {item.brand && (
            <>
              <Divider colors={colors} />
              <InfoRow label="Brand" value={item.brand} colors={colors} />
            </>
          )}
          <Divider colors={colors} />
          <InfoRow
            label="Season"
            value={item.season
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(", ")}
            colors={colors}
          />
          <Divider colors={colors} />
          <InfoRow
            label="Occasion"
            value={item.occasion
              .map((o) => o.charAt(0).toUpperCase() + o.slice(1))
              .join(", ")}
            colors={colors}
          />
          <Divider colors={colors} />
          <InfoRow label="Added" value={addedDate} colors={colors} />
          {(item.wornCount ?? 0) > 0 && (
            <>
              <Divider colors={colors} />
              <InfoRow
                label="Wears"
                value={`${item.wornCount} time${item.wornCount === 1 ? "" : "s"}`}
                colors={colors}
              />
              {item.lastWornAt && (
                <>
                  <Divider colors={colors} />
                  <InfoRow
                    label="Last Worn"
                    value={daysSince(item.lastWornAt)}
                    colors={colors}
                  />
                </>
              )}
            </>
          )}
        </View>

        {/* Tags */}
        {item.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.tagsLabel, { color: colors.mutedForeground }]}>
              Tags
            </Text>
            <View style={styles.tagsRow}>
              {item.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.tagText, { color: colors.foreground }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  rightContent,
  colors,
}: {
  label: string;
  value?: string;
  rightContent?: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {rightContent ?? (
        <Text
          style={[styles.infoValue, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {value ?? "—"}
        </Text>
      )}
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular" },
  imageWrap: { width: "100%", aspectRatio: 3 / 4 },
  image: { width: "100%", height: "100%", borderRadius: 20, borderWidth: 1 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  colorCircle: { width: 64, height: 64, borderRadius: 32 },
  nameSection: { gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  itemName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  categoryLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editDoneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  woreBtn: { borderRadius: 16, borderWidth: 1, padding: 14 },
  woreBtnContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  woreBtnLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  woreBtnSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  wornCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  wornCountText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  infoCard: { borderRadius: 16, padding: 4, borderWidth: 1, overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", maxWidth: "60%" },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatchDot: { width: 14, height: 14, borderRadius: 7 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  tagsSection: { gap: 10 },
  tagsLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
