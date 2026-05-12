import { Feather } from "@expo/vector-icons";
import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startSSOFlow } = useSSO();

  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);

  useEffect(() => {
    if (Platform.OS === "android") {
      WebBrowser.warmUpAsync();
      return () => {
        WebBrowser.coolDownAsync();
      };
    }
  }, []);

  const handleSSO = useCallback(
    async (provider: "google" | "apple") => {
      setLoadingProvider(provider);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const strategy = provider === "google" ? "oauth_google" : "oauth_apple";
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri({ scheme: "aura" }),
        });

        if (createdSessionId) {
          await setActive!({ session: createdSessionId });
          router.replace("/");
        }
      } catch (err: any) {
        Alert.alert(
          "Sign in failed",
          err?.errors?.[0]?.longMessage ?? "Something went wrong. Please try again."
        );
      } finally {
        setLoadingProvider(null);
      }
    },
    [startSSOFlow, router]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      {/* Close button */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
        hitSlop={12}
      >
        <Feather name="x" size={20} color={colors.foreground} />
      </Pressable>

      {/* Logo + branding */}
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: colors.foreground }]}>AURA</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Your personal AI wardrobe stylist
        </Text>
      </View>

      {/* Auth buttons */}
      <View style={styles.authSection}>
        <Text style={[styles.welcomeText, { color: colors.foreground }]}>
          Sign in to get started
        </Text>
        <Text style={[styles.subText, { color: colors.mutedForeground }]}>
          Your wardrobe syncs across devices when you're signed in.
        </Text>

        {/* Google */}
        <Pressable
          onPress={() => handleSSO("google")}
          disabled={loadingProvider !== null}
          style={({ pressed }) => [
            styles.socialBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed || loadingProvider !== null ? 0.8 : 1,
            },
          ]}
        >
          {loadingProvider === "google" ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <GoogleIcon />
          )}
          <Text style={[styles.socialBtnText, { color: colors.foreground }]}>
            Continue with Google
          </Text>
        </Pressable>

        {/* Apple (iOS only) */}
        {Platform.OS === "ios" && (
          <Pressable
            onPress={() => handleSSO("apple")}
            disabled={loadingProvider !== null}
            style={({ pressed }) => [
              styles.socialBtn,
              styles.appleBtn,
              {
                backgroundColor: colors.foreground,
                borderColor: colors.foreground,
                opacity: pressed || loadingProvider !== null ? 0.8 : 1,
              },
            ]}
          >
            {loadingProvider === "apple" ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <AppleIcon color={colors.background} />
            )}
            <Text style={[styles.socialBtnText, { color: colors.background }]}>
              Continue with Apple
            </Text>
          </Pressable>
        )}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

function GoogleIcon() {
  return (
    <View style={styles.iconWrap}>
      <Text style={styles.gIcon}>G</Text>
    </View>
  );
}

function AppleIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.appleGlyph, { color }]}></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  authSection: {
    gap: 14,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  appleBtn: {
    borderWidth: 0,
  },
  socialBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  iconWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  gIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4285F4",
  },
  appleGlyph: {
    fontSize: 18,
    lineHeight: 22,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
});
