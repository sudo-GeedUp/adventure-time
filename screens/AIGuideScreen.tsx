import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  aiGuideService,
  GuideMessage,
  GuideSuggestion,
} from "@/services/aiGuideService";
import { useAuth } from "@/contexts/AuthContext";
import * as Location from "expo-location";

interface ChatMessage extends GuideMessage {
  id: string;
  timestamp: number;
}

export default function AIGuideScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GuideSuggestion[]>([]);
  const [quickTip, setQuickTip] = useState("");

  useEffect(() => {
    initializeGuide();
  }, []);

  const initializeGuide = async () => {
    // Update context with user info
    if (userProfile) {
      aiGuideService.updateContext({
        vehicleType: userProfile.vehicleType,
        userPreferences: {
          difficulty: "Moderate",
        },
      });
    }

    // Get user location
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        aiGuideService.updateContext({
          userLocation: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }

    // Send welcome message
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `👋 Hey there! I'm Trail Buddy, your personal off-road adventure guide!\n\nI can help you with:\n• Trail recommendations\n• Safety advice\n• Trip planning\n• Real-time guidance\n• Emergency assistance\n\nWhat would you like to explore today?`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);

    // Load suggestions and tip
    loadSuggestions();
    loadQuickTip();
  };

  const loadSuggestions = async () => {
    try {
      const sug = await aiGuideService.getSmartSuggestions();
      setSuggestions(sug.slice(0, 3));
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  };

  const loadQuickTip = async () => {
    try {
      const tip = await aiGuideService.getQuickTip();
      setQuickTip(tip);
    } catch (error) {
      console.error("Error loading tip:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    if (!aiGuideService.isAvailable()) {
      Alert.alert(
        "AI Guide Unavailable",
        "The AI Guide requires an OpenAI API key to function. Please configure your API key in the settings."
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await aiGuideService.chat(userMessage.content);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: GuideSuggestion) => {
    setInputText(suggestion.message);
  };

  const handleQuickAction = (action: string) => {
    setInputText(action);
  };

  const clearConversation = () => {
    Alert.alert(
      "Clear Conversation",
      "Are you sure you want to start a new conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            aiGuideService.clearConversation();
            initializeGuide();
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View
            style={[styles.avatarContainer, { backgroundColor: theme.primary }]}
          >
            <Feather name="compass" size={20} color="white" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: theme.primary }
              : { backgroundColor: theme.backgroundSecondary },
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <ThemedText
            style={[styles.messageText, isUser && { color: "white" }]}
          >
            {item.content}
          </ThemedText>
        </View>

        {isUser && (
          <View
            style={[styles.avatarContainer, { backgroundColor: theme.accent }]}
          >
            <Feather name="user" size={20} color="white" />
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Quick Tip */}
      {quickTip && (
        <View
          style={[
            styles.tipCard,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText style={styles.tipText}>{quickTip}</ThemedText>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Quick Actions
        </ThemedText>
        <View style={styles.actionButtons}>
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => handleQuickAction("Recommend trails near me")}
          >
            <Feather name="map" size={20} color={theme.primary} />
            <ThemedText style={styles.actionButtonText}>Find Trails</ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() =>
              handleQuickAction("Give me safety tips for off-roading")
            }
          >
            <Feather name="shield" size={20} color={theme.warning} />
            <ThemedText style={styles.actionButtonText}>Safety Tips</ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
            onPress={() => handleQuickAction("Help me plan a trip")}
          >
            <Feather name="calendar" size={20} color={theme.accent} />
            <ThemedText style={styles.actionButtonText}>Plan Trip</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <ThemedText style={[Typography.h4, styles.sectionTitle]}>
            Suggestions
          </ThemedText>
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={index}
              style={[
                styles.suggestionCard,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <View style={styles.suggestionHeader}>
                <Feather
                  name={
                    suggestion.type === "safety"
                      ? "alert-triangle"
                      : suggestion.type === "trail"
                      ? "map-pin"
                      : suggestion.type === "warning"
                      ? "alert-circle"
                      : "info"
                  }
                  size={16}
                  color={
                    suggestion.priority === "critical"
                      ? theme.error
                      : suggestion.priority === "high"
                      ? theme.warning
                      : theme.primary
                  }
                />
                <ThemedText style={styles.suggestionTitle}>
                  {suggestion.title}
                </ThemedText>
              </View>
              <ThemedText
                style={[
                  styles.suggestionMessage,
                  { color: theme.tabIconDefault },
                ]}
              >
                {suggestion.message}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={insets.top + 60}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.headerAvatar, { backgroundColor: theme.primary }]}
            >
              <Feather name="compass" size={24} color="white" />
            </View>
            <View>
              <ThemedText style={[Typography.h3]}>Trail Buddy</ThemedText>
              <ThemedText
                style={[styles.headerSubtitle, { color: theme.tabIconDefault }]}
              >
                Your AI Adventure Guide
              </ThemedText>
            </View>
          </View>
          <Pressable onPress={clearConversation} style={styles.clearButton}>
            <Feather name="refresh-cw" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: Spacing.xl },
          ]}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Ask me anything..."
              placeholderTextColor={theme.tabIconDefault}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!loading}
              onSubmitEditing={sendMessage}
            />
            <Pressable
              style={[
                styles.sendButton,
                { backgroundColor: theme.primary },
                (!inputText.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Feather name="send" size={20} color="white" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  clearButton: {
    padding: Spacing.sm,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  headerContent: {
    marginBottom: Spacing.xl,
  },
  tipCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickActions: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  suggestions: {
    marginBottom: Spacing.lg,
  },
  suggestionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  suggestionMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
