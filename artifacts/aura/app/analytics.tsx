import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
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
import { CATEGORY_LABELS, ClothingCategory } from "@/types/wardrobe";

function daysSince(dateStr: string) {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, laundryItems, savedOutfits } = useWardrobe();

  const topPad = Platform.OS === "web" ? 20 : insets.top + 12;
  const allItems = useMemo(() => [...items, ...laundryItems], [items, laundryItems]);

  const totalWears = useMemo(
    () => allItems.reduce((s, i) => s + (i.wornCount ?? 0), 0),
    [allItems]
  );

  const mostWorn = useMemo(
    () =>
      [...allItems]
        .filter((i) => (i.wornCount ?? 0) > 0)
        .sort((a, b) => (b.wornCount ?? 0) - (a.wornCount ?? 0))
        .slice(0, 6),
    [allItems]
  );

  const neverWorn = useMemo(
    () =>
      items
        .filter((i) => !i.wornCount || i.wornCount === 0)
        .sort(
          (a, b) =>
            new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
        )
        .slice(0, 5),
    [items]
  );

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.category] = (counts[i.category] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const maxCatCount = categoryBreakdown[0]?.[1] ?? 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
          hitSlop={12}
        >
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Analytics
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
        {/* Summary */}
        <View style={styles.statsRow}>
          <StatCard value={items.length} label="In Wardrobe" icon="grid" colors={colors} />
          <StatCard value={savedOutfits.length} label="Outfits" icon="layers" colors={colors} />
          <StatCard value={totalWears} label="Total Wears" icon="activity" colors={colors} />
        </View>

        {/* Most worn */}
        {mostWorn.length > 0 && (
          <Section title="Most Worn" colors={colors}>
            {mostWorn.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
                <View style={styles.itemRow}>
                  <View style={styles.rankWrap}>
                    <Text
                      style={[
                        styles.rankNum,
                        { color: idx === 0 ? colors.accent : colors.mutedForeground },
                      ]}
                    >
                      #{idx + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[styles.itemName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                      {item.wornCount} {item.wornCount === 1 ? "wear" : "wears"}
                      {item.lastWornAt ? ` · ${daysSince(item.lastWornAt)}` : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.wornBadge,
                      { backgroundColor: colors.accent + "22" },
                    ]}
                  >
                    <Text style={[styles.wornBadgeText, { color: colors.accent }]}>
                      {item.wornCount}×
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Never worn */}
        {neverWorn.length > 0 && (
          <Section
            title="Never Worn"
            subtitle={`${neverWorn.length} item${neverWorn.length > 1 ? "s" : ""} waiting to be worn`}
            colors={colors}
          >
            {neverWorn.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
                <View style={styles.itemRow}>
                  <View
                    style={[
                      styles.neverIcon,
                      { backgroundColor: colors.muted },
                    ]}
                  >
                    <Feather name="package" size={14} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[styles.itemName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                      Added {daysSince(item.addedAt)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <Section title="By Category" colors={colors}>
            {categoryBreakdown.map(([cat, count], idx) => (
              <View key={cat}>
                {idx > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
                <View style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: colors.foreground }]}>
                    {CATEGORY_LABELS[cat as ClothingCategory] ?? cat}
                  </Text>
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: colors.accent,
                          width: `${(count / maxCatCount) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barCount, { color: colors.mutedForeground }]}>
                    {count}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {items.length === 0 && laundryItems.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="bar-chart-2" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No data yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add items to your wardrobe and start tracking your wears.
            </Text>
          </View>
        )}
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
      <Feather name={icon as any} size={18} color={colors.accent} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
  colors,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {children}
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, gap: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rankWrap: { width: 28, alignItems: "center" },
  rankNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  itemName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  wornBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  wornBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  neverIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  barLabel: { fontSize: 13, fontFamily: "Inter_500Medium", width: 88 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barCount: { fontSize: 12, fontFamily: "Inter_500Medium", width: 24, textAlign: "right" },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
