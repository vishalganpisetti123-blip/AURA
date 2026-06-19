import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const CONTACT_ITEMS = [
  {
    icon: "mail" as const,
    label: "General Support",
    value: "support@aurawardrobe.app",
    href: "mailto:support@aurawardrobe.app",
  },
  {
    icon: "shield" as const,
    label: "Privacy & Data",
    value: "privacy@aurawardrobe.app",
    href: "mailto:privacy@aurawardrobe.app",
  },
  {
    icon: "briefcase" as const,
    label: "Business Inquiries",
    value: "hello@aurawardrobe.app",
    href: "mailto:hello@aurawardrobe.app",
  },
];

const BUG_CATEGORIES = [
  "Crash / App not working",
  "AI analysis incorrect",
  "Outfit generation issue",
  "Login / Account problem",
  "Sync / Data issue",
  "UI / Design feedback",
  "Feature request",
  "Other",
];

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [category, setCategory] = useState(BUG_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const topPad = Platform.OS === "web" ? 20 : insets.top + 12;

  const handleOpenLink = async (href: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL(href);
      if (supported) await Linking.openURL(href);
    } catch {
      Alert.alert("Could not open", href);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Message required", "Please describe your issue before sending.");
      return;
    }
    setSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const subject = encodeURIComponent(`[Aura] ${category}`);
    const body = encodeURIComponent(message.trim());
    const mailto = `mailto:support@aurawardrobe.app?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(mailto);
      setMessage("");
    } catch {
      Alert.alert(
        "Could not open mail app",
        `Please email support@aurawardrobe.app with subject: ${category}`
      );
    } finally {
      setSending(false);
    }
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Contact & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* Contact cards */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            GET IN TOUCH
          </Text>
          <View style={[styles.cardGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {CONTACT_ITEMS.map((item, i) => (
              <React.Fragment key={item.href}>
                <Pressable
                  onPress={() => handleOpenLink(item.href)}
                  style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.contactIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name={item.icon} size={16} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactLabel, { color: colors.mutedForeground }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.contactValue, { color: colors.foreground }]}>
                      {item.value}
                    </Text>
                  </View>
                  <Feather name="external-link" size={14} color={colors.mutedForeground} />
                </Pressable>
                {i < CONTACT_ITEMS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Feedback form */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            REPORT A BUG OR SEND FEEDBACK
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {BUG_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat);
                }}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: category === cat ? colors.foreground : colors.secondary,
                    borderColor: category === cat ? colors.foreground : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catPillText,
                    { color: category === cat ? colors.background : colors.mutedForeground },
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
            Message
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue or feedback in detail…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={6}
            style={[
              styles.textarea,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          />

          <Pressable
            onPress={handleSend}
            disabled={sending}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: colors.foreground,
                opacity: pressed || sending ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="send" size={16} color={colors.background} />
            <Text style={[styles.sendBtnText, { color: colors.background }]}>
              {sending ? "Opening Mail…" : "Send Feedback"}
            </Text>
          </Pressable>
          <Text style={[styles.sendNote, { color: colors.mutedForeground }]}>
            Opens your default mail app with the message pre-filled.
          </Text>
        </View>
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
  content: { paddingHorizontal: 20, gap: 8 },
  sectionBlock: { gap: 10, marginTop: 12 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.8,
  },
  cardGroup: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  contactValue: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 1 },
  divider: { height: 1, marginLeft: 62 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2 },
  catRow: { gap: 8, paddingRight: 4 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  textarea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 8,
  },
  sendBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sendNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});
