import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWardrobe } from "@/context/WardrobeContext";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const STARTER_MESSAGES = [
  "What should I wear to a job interview?",
  "How do I style white sneakers?",
  "Suggest a capsule wardrobe for travel",
  "What colors complement my wardrobe?",
];

export default function StyleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { items } = useWardrobe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const listRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const wardrobeSummary =
    items.length > 0
      ? `The user has ${items.length} items: ${items
          .slice(0, 15)
          .map((i) => `${i.name} (${i.category})`)
          .join(", ")}${items.length > 15 ? " and more" : ""}.`
      : undefined;

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      };
      const assistantId =
        Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      try {
        const chatHistory = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: text.trim() },
        ];
        const domain = process.env.EXPO_PUBLIC_DOMAIN;
        const baseUrl = domain ? `https://${domain}` : "";
        const response = await fetch(`${baseUrl}/api/wardrobe/style-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: chatHistory,
            wardrobeSummary,
          }),
        });

        if (!response.ok || !response.body) throw new Error("Stream failed");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                }
                if (parsed.done) break;
              } catch {}
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (_) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Sorry, I couldn't respond right now. Please try again.",
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, wardrobeSummary]
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderColor: isUser ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {item.content}
          {item.isStreaming && (
            <Text style={{ color: colors.primary }}> ▌</Text>
          )}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Style Advisor
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Your personal AI stylist
          </Text>
        </View>
        {messages.length > 0 && (
          <Pressable
            onPress={() => setMessages([])}
            hitSlop={12}
          >
            <Feather
              name="refresh-cw"
              size={18}
              color={colors.mutedForeground}
            />
          </Pressable>
        )}
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Feather name="star" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Ask your stylist
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
          >
            {items.length > 0
              ? `I know your ${items.length}-item wardrobe. Ask me anything about style!`
              : "Add items to your wardrobe and I'll give personalized advice."}
          </Text>
          <View style={styles.starters}>
            {STARTER_MESSAGES.map((s) => (
              <Pressable
                key={s}
                onPress={() => sendMessage(s)}
                style={[
                  styles.starterBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.starterText, { color: colors.foreground }]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      {/* Input */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            marginBottom: bottomPad + 8,
            marginHorizontal: 16,
          },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about style, outfits, trends..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.textInput, { color: colors.foreground }]}
          multiline
          maxLength={500}
          editable={!isStreaming}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
        />
        <Pressable
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || isStreaming}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor:
                input.trim() && !isStreaming
                  ? colors.primary
                  : colors.muted,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {isStreaming ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Feather
              name="send"
              size={16}
              color={
                input.trim() ? colors.primaryForeground : colors.mutedForeground
              }
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  starters: {
    width: "100%",
    gap: 8,
    marginTop: 8,
  },
  starterBtn: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  starterText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: "82%",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 20,
    borderWidth: 1,
    padding: 8,
    paddingLeft: 14,
    gap: 8,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    paddingVertical: 6,
    paddingTop: 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
