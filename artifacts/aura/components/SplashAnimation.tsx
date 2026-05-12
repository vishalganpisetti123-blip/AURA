import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface SplashAnimationProps {
  onComplete: () => void;
}

export function SplashAnimation({ onComplete }: SplashAnimationProps) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  useEffect(() => {
    // Entrance: scale up with spring + fade in
    scale.value = withSpring(1, { damping: 14, stiffness: 160 });
    opacity.value = withTiming(1, { duration: 400 });

    // After 1.6s, fade the whole overlay out
    containerOpacity.value = withDelay(
      1600,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      })
    );

    // Fallback: always dismiss after 2.5s in case Reanimated callback misfires on web
    const fallback = setTimeout(onComplete, 2500);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A0A12",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: width * 0.1,
  },
});
