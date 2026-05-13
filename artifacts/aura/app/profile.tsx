import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primary + "33", borderColor: colors.primary }]}>
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
          <StatCard
            value={items.length}
            label="In Wardrobe"
            icon="grid"
            colors={colors}
          />
          <StatCard
            value={savedOutfits.length}
            label="Saved Outfits"
            icon="layers"
            colors={colors}
          />
          <StatCard
            value={laundryItems.length}
            label="In Laundry"
            icon="droplet"
            colors={colors}
          />
        </View>

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Account
          </Text>
          <MenuRow
            icon="user"
            label="Edit Profile"
            colors={colors}
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="bell"
            label="Notifications"
            colors={colors}
            onPress={() => {}}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuRow
            icon="shield"
            label="Privacy"
            colors={colors}
            onPress={() => {}}
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
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
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
  colors,
  onPress,
}: {
  icon: string;
  label: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon as any} size={16} color={colors.foreground} />
      </View>
      <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    position: "relative",
  },
  avatarGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 0,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarInitials: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  displayName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
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
  signOutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
