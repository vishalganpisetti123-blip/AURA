import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Share } from "react-native";
import React from "react";
import {
  Alert,
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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { items, savedOutfits, laundryItems } = useWardrobe();

  const topPad = Platform.OS === "web" ? 20 : insets.top + 12;

  const displayName =
    user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "Guest";

  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const initials = (
    (user?.firstName?.charAt(0) ?? "") +
    (user?.lastName?.charAt(0) ?? "")
  ).toUpperCase() || displayName.charAt(0).toUpperCase();

  const handleSignOut = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/");
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const data = {
      exportedAt: new Date().toISOString(),
      itemCount: items.length,
      outfitCount: savedOutfits.length,
      items,
      outfits: savedOutfits,
    };
    const jsonStr = JSON.stringify(data, null, 2);

    if (Platform.OS === "web") {
      try {
        const win = globalThis as Record<string, any>;
        const doc = win["document"];
        if (doc) {
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = doc.createElement("a");
          a.href = url;
          a.download = `aura-wardrobe-${new Date().toISOString().split("T")[0]}.json`;
          doc.body.appendChild(a);
          a.click();
          doc.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch {
        Alert.alert("Export", "Could not export on this platform.");
      }
    } else {
      try {
        await Share.share({
          title: "Aura Wardrobe Export",
          message: jsonStr,
        });
      } catch {
        Alert.alert(
          "Export",
          `Your wardrobe has ${items.length} items and ${savedOutfits.length} outfits.`
        );
      }
    }
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all wardrobe data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "@aura_wardrobe_items",
                "@aura_saved_outfits",
                "@aura_laundry_items",
                "@aura_planned_dates",
              ]);
              await signOut();
              router.replace("/");
            } catch {
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.secondary }]}
          hitSlop={12}
        >
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={[colors.primary + "33", "transparent"]}
            style={styles.avatarGlow}
          />
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { backgroundColor: colors.primary + "33", borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                {initials}
              </Text>
            </View>
          )}
          <Text style={[styles.displayName, { color: colors.foreground }]}>
            {displayName}
          </Text>
          {email ? (
            <Text style={[styles.email, { color: colors.mutedForeground }]}>
              {email}
            </Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={items.length} label="In Wardrobe" icon="grid" colors={colors} />
          <StatCard value={savedOutfits.length} label="Saved Outfits" icon="layers" colors={colors} />
          <StatCard value={laundryItems.length} label="In Laundry" icon="droplet" colors={colors} />
        </View>

        {/* Analytics */}
        <Pressable
          onPress={() => router.push("/analytics" as any)}
          style={({ pressed }) => [
            styles.analyticsBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[styles.analyticsBtnIcon, { backgroundColor: colors.accent + "22" }]}>
            <Feather name="bar-chart-2" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.analyticsBtnTitle, { color: colors.foreground }]}>
              Wardrobe Analytics
            </Text>
            <Text style={[styles.analyticsBtnSub, { color: colors.mutedForeground }]}>
              Most worn, never worn, style insights
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>

        {/* Data actions */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Data
          </Text>
          <MenuRow
            icon="download"
            label="Export Wardrobe"
            subtitle="Download your wardrobe as JSON"
            colors={colors}
            onPress={handleExport}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="trash-2"
            label="Delete Account"
            subtitle="Permanently remove all data"
            colors={colors}
            onPress={handleDeleteAccount}
            destructive
          />
        </View>

        {/* Legal & Support */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Legal & Support
          </Text>
          <MenuRow
            icon="shield"
            label="Privacy Policy"
            colors={colors}
            onPress={() => router.push("/privacy-policy" as any)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="file-text"
            label="Terms & Conditions"
            colors={colors}
            onPress={() => router.push("/terms" as any)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="mail"
            label="Contact & Support"
            colors={colors}
            onPress={() => router.push("/contact" as any)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="info"
            label="About Aura"
            subtitle={`Version 1.0.0`}
            colors={colors}
            onPress={() => router.push("/about" as any)}
          />
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutBtn,
            {
              backgroundColor: colors.destructive + "18",
              borderColor: colors.destructive + "44",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatCard({
  value,
  label,
  icon,
  colors,
}: {
  value: number;
  label: string;
  icon: string;
  colors: any;
}) {
  return (
    <View
      style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Feather name={icon as any} size={18} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  subtitle,
  colors,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  colors: any;
  onPress: () => void;
  destructive?: boolean;
}) {
  const textColor = destructive ? colors.destructive : colors.foreground;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: destructive ? colors.destructive + "18" : colors.secondary },
        ]}
      >
        <Feather name={icon as any} size={16} color={textColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: textColor }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, gap: 16 },
  avatarSection: { alignItems: "center", paddingVertical: 24, position: "relative" },
  avatarGlow: { position: "absolute", width: 200, height: 200, borderRadius: 100, top: 0 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarFallback: { alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarInitials: { fontSize: 36, fontFamily: "Inter_700Bold" },
  displayName: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  email: { fontSize: 14, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", gap: 6, padding: 14, borderRadius: 16, borderWidth: 1 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  analyticsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  analyticsBtnIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  analyticsBtnTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  analyticsBtnSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { borderRadius: 16, borderWidth: 1, overflow: "hidden", paddingTop: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  divider: { height: 1, marginLeft: 52 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  menuIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  menuSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 4,
  },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
