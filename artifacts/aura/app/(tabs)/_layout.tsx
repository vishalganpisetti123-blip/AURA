import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan">
        <Icon sf={{ default: "camera", selected: "camera.fill" }} />
        <Label>Scan</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="outfits">
        <Icon sf={{ default: "tshirt", selected: "tshirt.fill" }} />
        <Label>Closet</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="style">
        <Icon sf={{ default: "calendar", selected: "calendar.badge.checkmark" }} />
        <Label>Planner</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plan">
        <Icon sf={{ default: "washer", selected: "washer.fill" }} />
        <Label>Laundry</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const TAB_ROUTES = [
  { name: "index", label: "Home", icon: "home" as const },
  { name: "scan", label: "Scan", icon: "camera" as const },
  { name: "outfits", label: "Closet", icon: "grid" as const },
  { name: "style", label: "Planner", icon: "calendar" as const },
  { name: "plan", label: "Laundry", icon: "droplet" as const },
];

function FloatingTabBar({ state, navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";
  const isWeb = Platform.OS === "web";

  const bottom = isWeb ? 20 : Math.max(insets.bottom, 16);
  const isScanCenter = (idx: number) => TAB_ROUTES[idx]?.name === "scan";

  return (
    <View style={[styles.floatWrap, { bottom }]}>
      <BlurView
        intensity={isWeb ? 0 : 75}
        tint={isDark ? "systemChromeMaterialDark" : "systemChromeMaterial"}
        style={[
          styles.floatBlur,
          {
            backgroundColor: isWeb
              ? isDark
                ? "rgba(18,18,18,0.96)"
                : "rgba(248,248,248,0.96)"
              : undefined,
            borderColor: isDark
              ? "rgba(255,255,255,0.09)"
              : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        <View style={styles.floatInner}>
          {state.routes.map((route: any, idx: number) => {
            const focused = state.index === idx;
            const tabInfo = TAB_ROUTES[idx];
            const isCenter = isScanCenter(idx);

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            if (isCenter) {
              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.tabCenter,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.tabCenterCircle,
                      {
                        backgroundColor: colors.foreground,
                        shadowColor: colors.foreground,
                        shadowOpacity: 0.25,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 8,
                      },
                    ]}
                  >
                    <Feather
                      name={tabInfo.icon}
                      size={22}
                      color={colors.background}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: focused
                          ? colors.foreground
                          : colors.mutedForeground,
                        fontFamily: focused
                          ? "Inter_600SemiBold"
                          : "Inter_400Regular",
                      },
                    ]}
                  >
                    {tabInfo.label}
                  </Text>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tab,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                {focused && (
                  <View
                    style={[
                      styles.activeIndicator,
                      {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(0,0,0,0.07)",
                      },
                    ]}
                  />
                )}
                <Feather
                  name={tabInfo.icon}
                  size={22}
                  color={focused ? colors.foreground : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? colors.foreground
                        : colors.mutedForeground,
                      fontFamily: focused
                        ? "Inter_600SemiBold"
                        : "Inter_400Regular",
                    },
                  ]}
                >
                  {tabInfo.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function ClassicTabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="scan" options={{ title: "Scan" }} />
      <Tabs.Screen name="outfits" options={{ title: "Closet" }} />
      <Tabs.Screen name="style" options={{ title: "Planner" }} />
      <Tabs.Screen name="plan" options={{ title: "Laundry" }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  floatWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
  },
  floatBlur: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 16,
  },
  floatInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 22,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
  },
  tabCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  tabCenterCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -14,
  },
  tabLabel: {
    fontSize: 9,
  },
});
