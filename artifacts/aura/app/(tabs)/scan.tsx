import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";
import { AnalyzedClothing, ClothingItem } from "@/types/wardrobe";

type Step = "pick" | "preview" | "analyzing" | "result";

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addItem } = useWardrobe();

  const [step, setStep] = useState<Step>("pick");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzedClothing | null>(null);
  const [editedName, setEditedName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;

  const pickImage = async (useCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Camera access needed",
            "Please allow camera access in Settings to scan your clothes."
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          quality: 0.8,
          base64: true,
          allowsEditing: true,
          aspect: [3, 4],
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          quality: 0.8,
          base64: true,
          allowsEditing: true,
          aspect: [3, 4],
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 ?? null);
        setStep("preview");
      }
    } catch {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const analyzeImage = async () => {
    if (!imageBase64) return;
    setStep("analyzing");
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const response = await fetch(`${baseUrl}/api/wardrobe/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: "image/jpeg" }),
      });
      if (!response.ok) throw new Error("Analysis failed");
      const data: AnalyzedClothing = await response.json();
      setAnalysis(data);
      setEditedName(data.name);
      setStep("result");
    } catch {
      Alert.alert(
        "Analysis failed",
        "Could not analyze this image. Please try again.",
        [{ text: "Retry", onPress: () => setStep("preview") }]
      );
    }
  };

  const reset = () => {
    setStep("pick");
    setImageUri(null);
    setImageBase64(null);
    setAnalysis(null);
    setEditedName("");
  };

  const addToWardrobe = async () => {
    if (!analysis || !imageUri) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const item: ClothingItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: editedName || analysis.name,
      category: analysis.category as ClothingItem["category"],
      colorName: analysis.colorName,
      colorHex: analysis.colorHex,
      type: analysis.type,
      season: analysis.season as ClothingItem["season"],
      occasion: analysis.occasion as ClothingItem["occasion"],
      tags: analysis.tags,
      brand: analysis.brand ?? undefined,
      imageUri,
      addedAt: new Date().toISOString(),
    };

    await addItem(item);
    setIsSaving(false);
    setSuccessCount((c) => c + 1);
    // Reset to scan another item immediately
    reset();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        {step !== "pick" ? (
          <Pressable onPress={reset} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {step === "pick"
            ? "Scan Clothing"
            : step === "analyzing"
            ? "Analyzing..."
            : "Review Item"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Success toast */}
      {successCount > 0 && step === "pick" && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={[styles.successBanner, { backgroundColor: colors.primary }]}
          key={successCount}
        >
          <Feather name="check-circle" size={16} color={colors.primaryForeground} />
          <Text style={[styles.successText, { color: colors.primaryForeground }]}>
            Added to wardrobe! Scan another item.
          </Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP: Pick */}
        {step === "pick" && (
          <View style={styles.pickStep}>
            <View
              style={[styles.illustrationCircle, { backgroundColor: colors.muted }]}
            >
              <Feather name="camera" size={64} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.pickTitle, { color: colors.foreground }]}>
              {successCount > 0 ? "Add Another Item" : "Scan Your Clothing"}
            </Text>
            <Text style={[styles.pickSub, { color: colors.mutedForeground }]}>
              Take a photo or choose from your library. AI will catalog the item automatically.
            </Text>
            <Pressable
              onPress={() => pickImage(true)}
              style={({ pressed }) => [
                styles.bigBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="camera" size={20} color={colors.primaryForeground} />
              <Text style={[styles.bigBtnText, { color: colors.primaryForeground }]}>
                Take a Photo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage(false)}
              style={({ pressed }) => [
                styles.bigBtn,
                styles.secondaryBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="image" size={20} color={colors.foreground} />
              <Text style={[styles.bigBtnText, { color: colors.foreground }]}>
                Choose from Library
              </Text>
            </Pressable>
          </View>
        )}

        {/* STEP: Preview */}
        {step === "preview" && imageUri && (
          <View style={styles.previewStep}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.previewImage, { borderColor: colors.border }]}
              resizeMode="cover"
            />
            <View style={styles.previewActions}>
              <Pressable
                onPress={reset}
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
              >
                <Feather name="refresh-cw" size={18} color={colors.foreground} />
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
                  Retake
                </Text>
              </Pressable>
              <Pressable
                onPress={analyzeImage}
                style={[
                  styles.actionBtn,
                  styles.primaryActionBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Feather name="zap" size={18} color={colors.primaryForeground} />
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                  Analyze
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP: Analyzing */}
        {step === "analyzing" && imageUri && (
          <View style={styles.analyzingStep}>
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.previewImage,
                { borderColor: colors.border, opacity: 0.5 },
              ]}
              resizeMode="cover"
            />
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.analyzingText, { color: colors.foreground }]}>
                AI is analyzing your item...
              </Text>
              <Text style={[styles.analyzingSubText, { color: colors.mutedForeground }]}>
                Identifying type, color, season & style
              </Text>
            </View>
          </View>
        )}

        {/* STEP: Result */}
        {step === "result" && analysis && imageUri && (
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.resultStep}>
              <Image
                source={{ uri: imageUri }}
                style={[styles.resultImage, { borderColor: colors.border }]}
                resizeMode="cover"
              />

              {/* Name editing */}
              <View
                style={[
                  styles.fieldGroup,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Name
                </Text>
                <TextInput
                  value={editedName}
                  onChangeText={setEditedName}
                  style={[styles.nameInput, { color: colors.foreground }]}
                  placeholderTextColor={colors.mutedForeground}
                  placeholder="Enter item name"
                />
              </View>

              {/* Analysis details */}
              <View
                style={[
                  styles.detailsCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <DetailRow label="Category" value={analysis.category} colors={colors} />
                <DetailRow label="Type" value={analysis.type} colors={colors} />
                <DetailRow
                  label="Color"
                  value={analysis.colorName}
                  swatch={analysis.colorHex}
                  colors={colors}
                />
                {analysis.brand && (
                  <DetailRow label="Brand" value={analysis.brand} colors={colors} />
                )}
                <DetailRow
                  label="Season"
                  value={analysis.season.join(", ")}
                  colors={colors}
                />
                <DetailRow
                  label="Occasion"
                  value={analysis.occasion.join(", ")}
                  colors={colors}
                />
                <View style={styles.tagsRow}>
                  {analysis.tags.map((tag: string) => (
                    <View
                      key={tag}
                      style={[styles.tag, { backgroundColor: colors.muted }]}
                    >
                      <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <Pressable
                onPress={addToWardrobe}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.bigBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed || isSaving ? 0.8 : 1,
                  },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <>
                    <Feather name="plus" size={18} color={colors.primaryForeground} />
                    <Text style={[styles.bigBtnText, { color: colors.primaryForeground }]}>
                      Add to Wardrobe
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  swatch,
  colors,
}: {
  label: string;
  value: string;
  swatch?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View style={styles.detailValueRow}>
        {swatch && <View style={[styles.swatchDot, { backgroundColor: swatch }]} />}
        <Text
          style={[styles.detailValue, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
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
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  successText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Pick step
  pickStep: { alignItems: "center", gap: 20, paddingTop: 20 },
  illustrationCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pickTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  pickSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  bigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 16,
  },
  secondaryBtn: { borderWidth: 1 },
  bigBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },

  // Preview step
  previewStep: { gap: 16 },
  previewImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  previewActions: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  primaryActionBtn: { borderWidth: 0 },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Analyzing
  analyzingStep: { position: "relative" },
  analyzingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  analyzingText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  analyzingSubText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  // Result
  resultStep: { gap: 16 },
  resultImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  fieldGroup: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nameInput: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    paddingVertical: 2,
  },
  detailsCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatchDot: { width: 14, height: 14, borderRadius: 7 },
  detailValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
    maxWidth: 200,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
