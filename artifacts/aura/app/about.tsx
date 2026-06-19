import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "100";
const RELEASE_DATE = "June 2025";

const TECH_STACK = [
  { name: "Expo (React Native)", desc: "Cross-platform mobile framework" },
  { name: "OpenAI GPT", desc: "AI clothing analysis & outfit generation" },
  { name: "Clerk", desc: "Authentication & identity management" },
  { name: "PostgreSQL (Neon)", desc: "Conversation history storage" },
  { name: "Open-Meteo", desc: "Free weather API" },
  { name: "Express 5", desc: "API server" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", route: "/privacy-policy" as const },
  { label: "Terms & Conditions", route: "/terms" as const },
  { label: "Contact & Support", route: "/contact" as const },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 20 : insets.top + 12;

  const handleOpenLink = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL(url);
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.secondary }]}
          hitSlop={12}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>About</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* App identity */}
        <View style={styles.identitySection}>
          <View style={[styles.appIconWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="star" size={36} color={colors.foreground} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>Aura Wardrobe</Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
            Your Personal AI Stylist
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
              Version {APP_VERSION} · Build {BUILD_NUMBER}
            </Text>
          </View>
        </View>

        {/* Version details */}
        <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow label="App Version" value={APP_VERSION} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow label="Build Number" value={BUILD_NUMBER} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow label="Released" value={RELEASE_DATE} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow label="Platform" value={Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web"} colors={colors} />
        </View>

        {/* Description */}
        <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descTitle, { color: colors.foreground }]}>About the App</Text>
          <Text style={[styles.descBody, { color: colors.mutedForeground }]}>
            Aura Wardrobe is an AI-powered personal stylist that helps you organize your
            clothing, discover new outfit combinations, and dress better every day.

            {"\n\n"}
            Scan any clothing item with your camera and AI instantly catalogs it —
            detecting category, color, brand, fabric, and occasion. Then let Aura
            suggest complete outfits tailored to the weather, your plans, and your
            personal style.

            {"\n\n"}
            Built with a focus on privacy: your wardrobe stays on-device by default.
            No ads. No data selling. Just style.
          </Text>
        </View>

        {/* Tech stack */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            BUILT WITH
          </Text>
          <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {TECH_STACK.map((item, i) => (
              <React.Fragment key={item.name}>
                <View style={styles.techRow}>
                  <View style={[styles.techDot, { backgroundColor: colors.foreground }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.techName, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.techDesc, { color: colors.mutedForeground }]}>
                      {item.desc}
                    </Text>
                  </View>
                </View>
                {i < TECH_STACK.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Legal links */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            LEGAL
          </Text>
          <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {LEGAL_LINKS.map((link, i) => (
              <React.Fragment key={link.label}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(link.route as any);
                  }}
                  style={({ pressed }) => [styles.legalRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.legalLabel, { color: colors.foreground }]}>
                    {link.label}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
                {i < LEGAL_LINKS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Copyright */}
        <Text style={[styles.copyright, { color: colors.mutedForeground }]}>
          © {new Date().getFullYear()} Aura Wardrobe. All rights reserved.{"\n"}
          Made with love for fashion-forward people.
        </Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
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
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, gap: 16 },
  identitySection: { alignItems: "center", paddingVertical: 24, gap: 8 },
  appIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  appName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  appTagline: { fontSize: 14, fontFamily: "Inter_400Regular" },
  versionBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  versionText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cardGroup: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginHorizontal: 16 },
  descCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  descTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  descBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  sectionBlock: { gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.8 },
  techRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  techDot: { width: 6, height: 6, borderRadius: 3 },
  techName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  techDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  legalLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  copyright: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
