import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const LAST_UPDATED = "June 19, 2025";

type Section = { heading: string; body: string };

const SECTIONS: Section[] = [
  {
    heading: "1. Information We Collect",
    body: `We collect information you provide directly:

• Account information — name, email address, profile photo (via Apple Sign‑In or Google Sign‑In through Clerk Auth).
• Clothing images — photos you take or choose from your library when scanning items.
• Wardrobe data — item names, categories, colors, brands, wear history, and outfit combinations.
• Laundry and planner history — items marked as worn, sent to laundry, or scheduled for specific dates.
• AI interaction data — messages exchanged with the Aura AI stylist and outfit requests.
• Weather data — approximate location used only in‑session to retrieve weather conditions for outfit suggestions (not stored on our servers).
• Device information — device type, operating system, and app version for crash reporting and compatibility.`,
  },
  {
    heading: "2. How We Use Your Information",
    body: `We use the information we collect to:

• Provide, operate, and improve the Aura Wardrobe service.
• Power AI outfit suggestions, style recommendations, and clothing analysis.
• Personalize your experience based on your wardrobe and preferences.
• Send service‑related notifications (if enabled).
• Respond to support requests and feedback.
• Monitor app performance and diagnose technical issues.

We do not sell your personal information to third parties.`,
  },
  {
    heading: "3. How We Store Your Data",
    body: `Wardrobe items, outfits, laundry lists, and planner data are stored locally on your device using secure AsyncStorage. This data does not leave your device unless you explicitly use the Export feature.

AI chat conversations are stored in our secure PostgreSQL database (hosted on Neon.tech) to support conversation history. These are linked to your Clerk user ID, not directly to your personal identity.

Authentication is handled by Clerk, which meets SOC 2 Type II compliance standards.`,
  },
  {
    heading: "4. Data Sharing",
    body: `We share data only with the following trusted service providers, strictly to operate the app:

• Clerk — authentication and identity management.
• OpenAI (via Replit AI Integrations) — AI clothing analysis and outfit generation. Images are processed and not stored by OpenAI beyond the request lifecycle per their API data policy.
• Neon.tech — secure PostgreSQL database for conversation history.
• Open‑Meteo — anonymous weather API requests (no personal data sent).

We do not share your data with advertisers or data brokers.`,
  },
  {
    heading: "5. Data Deletion",
    body: `You have the right to delete your data at any time:

• Go to Profile → Delete Account to permanently erase all local wardrobe data and your Clerk account.
• To request deletion of server‑side conversation data, email privacy@aurawardrobe.app.
• We will fulfill server‑side deletion requests within 30 days.

Apple App Store policy requires that apps with accounts support account deletion, and we comply fully.`,
  },
  {
    heading: "6. Your Rights (GDPR & CCPA)",
    body: `Depending on your location, you may have the following rights:

• Right to Access — request a copy of your personal data.
• Right to Rectification — correct inaccurate data.
• Right to Erasure — request deletion of your data ("right to be forgotten").
• Right to Portability — export your data in a machine‑readable format (use the Export Wardrobe feature).
• Right to Object — opt out of certain processing activities.
• California residents (CCPA) — right to know, right to delete, and right to opt out of sale (we do not sell data).

To exercise these rights, contact us at privacy@aurawardrobe.app.`,
  },
  {
    heading: "7. Children's Privacy",
    body: `Aura Wardrobe is not directed to children under 13 (or under 16 in the EU). We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, contact us and we will delete it promptly.`,
  },
  {
    heading: "8. Security",
    body: `We implement industry‑standard security measures including:

• HTTPS / TLS encryption for all network communications.
• Clerk's enterprise‑grade authentication with multi‑factor authentication support.
• Database encryption at rest (Neon.tech).
• No storage of raw payment information.

While we strive to protect your data, no method of transmission over the internet is 100% secure.`,
  },
  {
    heading: "9. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date at the top of this page and, where appropriate, via in‑app notification. Continued use of the app after changes constitutes acceptance.`,
  },
  {
    heading: "10. Contact Us",
    body: `If you have questions about this Privacy Policy or your data:\n\nEmail: privacy@aurawardrobe.app\nGeneral support: support@aurawardrobe.app`,
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 20 : insets.top + 12;

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
          Last updated: {LAST_UPDATED}
        </Text>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          Aura Wardrobe ("we," "our," or "us") is committed to protecting your
          privacy. This policy explains how we collect, use, and safeguard your
          information when you use the Aura Wardrobe app.
        </Text>

        {SECTIONS.map((section) => (
          <View
            key={section.heading}
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
              {section.heading}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
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
  content: { paddingHorizontal: 20, gap: 12 },
  lastUpdated: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  intro: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 4,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
  },
  sectionBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
