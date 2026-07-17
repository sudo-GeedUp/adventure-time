import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { storage, ChatMessage } from "@/utils/storage";

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const mountedRef = useRef(true);
  
  const { participantId, participantName, participantVehicle } = route.params;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    loadUserProfile();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    
    loadConversation();
  }, [participantId, currentUserId]);

  const loadUserProfile = async () => {
    const profile = await storage.getUserProfile();
    if (profile && mountedRef.current) {
      setCurrentUserId(profile.id);
      setCurrentUserName(profile.name);
    }
  };

  const loadConversation = async () => {
    let conversation = await storage.getConversation(participantId);
    
    if (!conversation) {
      conversation = await storage.createOrUpdateConversation(
        participantId,
        participantName,
        participantVehicle
      );
    }
    
    if (!mountedRef.current) return;
    
    setMessages(conversation.messages);
    
    if (currentUserId) {
      await storage.markMessagesAsRead(participantId, currentUserId);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    if (!currentUserId || !currentUserName) {
      Alert.alert("Error", "Unable to send message. Please try again.");
      return;
    }

    try {
      await storage.sendMessage(
        participantId,
        participantName,
        participantVehicle,
        currentUserId,
        currentUserName,
        messageText.trim()
      );
      setMessageText("");
      loadConversation();
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      setTimeout(async () => {
        await storage.sendSimulatedResponse(
          participantId,
          participantName
        );
        loadConversation();
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 2500);
    } catch (error) {
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.theirMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwnMessage ? theme.primary : theme.backgroundDefault,
            },
          ]}
        >
          {!isOwnMessage ? (
            <ThemedText
              style={[
                styles.senderName,
                { color: theme.primary },
              ]}
            >
              {item.senderName}
            </ThemedText>
          ) : null}
          <ThemedText
            style={[
              styles.messageText,
              { color: isOwnMessage ? "white" : theme.text },
            ]}
          >
            {item.text}
          </ThemedText>
          <ThemedText
            style={[
              styles.messageTime,
              { color: isOwnMessage ? "rgba(255,255,255,0.7)" : theme.tabIconDefault },
            ]}
          >
            {formatTime(item.timestamp)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messagesList,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: Spacing.md,
          },
        ]}
        ListHeaderComponent={
          <View style={[styles.demoBanner, { backgroundColor: theme.warning }]}>
            <Feather name="info" size={20} color="#000" style={styles.demoBannerIcon} />
            <View style={styles.demoBannerTextContainer}>
              <ThemedText style={[styles.demoBannerTitle, { color: "#000" }]}>
                Demo Mode - Simulated Responses
              </ThemedText>
              <ThemedText style={[styles.demoBannerSubtext, { color: "#000" }]}>
                This chat feature demonstrates the UI. Responses are automatically generated.
              </ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={48} color={theme.tabIconDefault} />
            <ThemedText style={styles.emptyText}>No messages yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Start the conversation with {participantName}
            </ThemedText>
          </View>
        }
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + Spacing.sm,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundRoot,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.tabIconDefault}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <Pressable
          style={[
            styles.sendButton,
            {
              backgroundColor: messageText.trim() ? theme.primary : theme.border,
            },
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Feather name="send" size={20} color="white" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messagesList: {
    paddingHorizontal: Spacing.md,
  },
  demoBanner: {
    flexDirection: "row",
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "flex-start",
  },
  demoBannerIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  demoBannerTextContainer: {
    flex: 1,
  },
  demoBannerTitle: {
    ...Typography.body,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  demoBannerSubtext: {
    ...Typography.small,
    lineHeight: 16,
  },
  messageContainer: {
    marginBottom: Spacing.md,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  senderName: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 20,
  },
  messageTime: {
    ...Typography.small,
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"] * 2,
  },
  emptyText: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptySubtext: {
    ...Typography.body,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: Spacing.md,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    maxHeight: 100,
    ...Typography.body,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
