import React from "react";
import { Modal, View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius, Colors } from "@/constants/theme";

interface SpecialThanksModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SpecialThanksModal({ visible, onClose }: SpecialThanksModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <Feather name="heart" size={48} color={theme.primary} />
          </View>

          <ThemedText style={[Typography.h2, styles.title]}>
            Special Thanks
          </ThemedText>

          <View style={styles.content}>
            <ThankItem
              icon="map"
              text="To every adventurer who trusts Adventure Time to guide their journey"
              theme={theme}
            />
            <ThankItem
              icon="users"
              text="To our community of offroaders who share their expertise"
              theme={theme}
            />
            <ThankItem
              icon="shield"
              text="To those who prioritize safety and help others in need"
              theme={theme}
            />
            <ThankItem
              icon="heart"
              text="Special thanks to Bryan, Bruce, Tayt, Ryan, Dillon, and ChloeAnn"
              theme={theme}
            />
          </View>

          <ThemedText style={[styles.footer, { color: theme.tabIconDefault }]}>
            Every mile matters. Every adventure counts.
          </ThemedText>

          <Pressable
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={onClose}
            android_ripple={{ color: theme.secondary }}
          >
            <ThemedText style={[styles.buttonText, { color: theme.backgroundDefault }]}>
              Let's Go Adventure
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ThankItem({
  icon,
  text,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  theme: any;
}) {
  return (
    <View style={styles.thankItem}>
      <Feather name={icon} size={24} color={theme.primary} style={styles.itemIcon} />
      <ThemedText style={[styles.itemText, { color: theme.text }]}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    maxWidth: 400,
    alignItems: "center",
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  content: {
    width: "100%",
    marginBottom: Spacing["2xl"],
  },
  thankItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  itemIcon: {
    marginRight: Spacing.md,
    marginTop: Spacing.xs,
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: Spacing.xl,
    fontStyle: "italic",
  },
  button: {
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
