import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";
import { ClothingItem, CATEGORY_LABELS } from "@/types/wardrobe";

export default function LaundryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { laundryItems, returnFromLaundry, resetLaundry } = useWardrobe();

  const topPad = Platform.OS === "web" ? 20 : insets.top + 8;
  const displayName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "";
  const initials = ((user?.firstName?.charAt(0) ?? "") + (user?.lastName?.charAt(0) ?? "")).toUpperCase() || displayName.charAt(0).toUpperCase();

  const handleProfile = () => {
    if (isSignedIn) router.push("/profile");
    else router.push("/(auth)/sign-in");
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetLaundry();
  };

  const handleReturn = (item: ClothingItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    returnFromLaundry(item.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={[styles.headerEyebrow, { color: colors.mutedForeground }]}>
            {laundryItems.length} {laundryItems.length === 1 ? "item" : "items"} in wash
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Laundry</Text>
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

      {/* Return All */}
      {laundryItems.length > 0 && (
        <View style={styles.subHeader}>
          <Text style={[styles.countSub, { color: colors.mutedForeground }]}>
            Items return to your closet after washing
          </Text>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.resetBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="refresh-cw" size={14} color={colors.primaryForeground} />
            <Text style={[styles.resetText, { color: colors.primaryForeground }]}>Return All</Text>
          </Pressable>
        </View>
      )}

      {laundryItems.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={[colors.primary + "18", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="droplet" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Laundry is empty</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Items you send to laundry from your Closet will appear here.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/outfits")}
            style={[styles.goClosetBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Feather name="grid" size={16} color={colors.foreground} />
            <Text style={[styles.goClosetText, { color: colors.foreground }]}>Go to Closet</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={laundryItems}
          keyExtractor={(i) => i.id}
          numColumns={2}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: Platform.OS === "web" ? 80 : insets.bottom + 80 },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ width: "48%" }}>
              <LaundryCard item={item} colors={colors} onReturn={handleReturn} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function LaundryCard({
  item,
  colors,
  onReturn,
}: {
  item: ClothingItem;
  colors: any;
  onReturn: (item: ClothingItem) => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Image with wash overlay */}
      <View style={styles.cardImgWrap}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImgPlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={28} color={colors.mutedForeground} />
          </View>
        )}
        {/* Wash badge */}
        <View style={[styles.washBadge, { backgroundColor: "rgba(0,0,0,0.65)" }]}>
          <Feather name="droplet" size={10} color="#60B4FF" />
          <Text style={styles.washText}>Washing</Text>
        </View>
        {/* Color dot */}
        <View style={[styles.colorDot, { backgroundColor: item.colorHex, borderColor: "rgba(255,255,255,0.3)" }]} />
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
          {CATEGORY_LABELS[item.category]}
        </Text>
        <Pressable
          onPress={() => onReturn(item)}
          style={({ pressed }) => [
            styles.returnBtn,
            { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44", opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="corner-up-left" size={12} color={colors.primary} />
          <Text style={[styles.returnText, { color: colors.primary }]}>Return</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  headerEyebrow: { fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 0.3, marginBottom: 2 },
  headerTitle: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { height: 36, minWidth: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  avatarInitials: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  signInRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  signInLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  subHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, paddingTop: 4 },
  countTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  countSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14 },
  resetText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 280 },
  goClosetBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  goClosetText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  grid: { paddingHorizontal: 16 },
  columnWrapper: { justifyContent: "space-between", marginBottom: 12 },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  cardImgWrap: { width: "100%", height: 170, position: "relative" },
  cardImg: { width: "100%", height: "100%" },
  cardImgPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  washBadge: { position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  washText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#60B4FF" },
  colorDot: { position: "absolute", bottom: 8, right: 8, width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  cardInfo: { padding: 10, gap: 4 },
  cardName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  returnBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginTop: 4, alignSelf: "flex-start" },
  returnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
