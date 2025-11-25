import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { storage, CommunityTip } from "@/utils/storage";

interface WarningType {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const WARNING_TYPES: WarningType[] = [
  {
    id: "police",
    label: "Police",
    icon: "shield",
    description: "Law enforcement present",
  },
  {
    id: "probation",
    label: "Probation Officer",
    icon: "alert-circle",
    description: "Probation/parole officer spotted",
  },
  {
    id: "mud",
    label: "Deep Mud",
    icon: "droplet",
    description: "Muddy trail conditions",
  },
  {
    id: "water",
    label: "Water Hazard",
    icon: "wave-2",
    description: "Flooded or wet sections",
  },
  {
    id: "rocks",
    label: "Rocky",
    icon: "zap",
    description: "Large rocks and obstacles",
  },
  {
    id: "snow",
    label: "Snow/Ice",
    icon: "cloud-snow",
    description: "Snow or ice on trail",
  },
  {
    id: "blocked",
    label: "Blocked",
    icon: "x-circle",
    description: "Trail impassable",
  },
  {
    id: "damage",
    label: "Damage",
    icon: "alert-triangle",
    description: "Trail damage reported",
  },
];

interface ReportConditionModalProps {
  visible: boolean;
  onClose: () => void;
  userLocation: any;
  userProfile: any;
  onReportSubmitted: () => void;
}

export default function ReportConditionModal({
  visible,
  onClose,
  userLocation,
  userProfile,
  onReportSubmitted,
}: ReportConditionModalProps) {
  const { theme } = useTheme();
  const [selectedWarning, setSelectedWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedWarning || !userLocation) {
      Alert.alert("Error", "Please select a warning type and ensure location is available");
      return;
    }

    setIsSubmitting(true);

    const warningType = WARNING_TYPES.find((w) => w.id === selectedWarning);
    if (!warningType) return;

    const tip: CommunityTip = {
      id: `tip_${Date.now()}`,
      title: warningType.label,
      description: warningType.description,
      category: "trail_condition",
      timestamp: Date.now(),
      location: {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      },
      author: {
        name: userProfile?.name || "Anonymous",
        vehicleType: userProfile?.vehicleType || "Unknown",
      },
      helpful: 0,
    };

    try {
      await storage.saveCommunityTip(tip);
      Alert.alert("Success", "Thank you! Your report helps other offroaders stay safe.");
      setSelectedWarning(null);
      onReportSubmitted();
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View
          style={[
            styles.content,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.header}>
            <ThemedText style={[Typography.h3, styles.title]}>
              Report Trail Condition
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.tabIconDefault} />
            </Pressable>
          </View>

          <ThemedText style={[styles.subtitle, { color: theme.tabIconDefault }]}>
            Alert other offroaders about what you've encountered
          </ThemedText>

          <ScrollView style={styles.warningList} showsVerticalScrollIndicator={false}>
            {WARNING_TYPES.map((warning) => (
              <Pressable
                key={warning.id}
                style={[
                  styles.warningOption,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor:
                      selectedWarning === warning.id
                        ? theme.primary
                        : "transparent",
                  },
                ]}
                onPress={() => setSelectedWarning(warning.id)}
              >
                <View
                  style={[
                    styles.warningIcon,
                    {
                      backgroundColor:
                        selectedWarning === warning.id
                          ? theme.primary
                          : "transparent",
                    },
                  ]}
                >
                  <Feather
                    name={warning.icon as any}
                    size={24}
                    color={
                      selectedWarning === warning.id
                        ? theme.buttonText
                        : theme.primary
                    }
                  />
                </View>
                <View style={styles.warningInfo}>
                  <ThemedText style={styles.warningLabel}>
                    {warning.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.warningDescription,
                      { color: theme.tabIconDefault },
                    ]}
                  >
                    {warning.description}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, { backgroundColor: theme.backgroundSecondary }]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <ThemedText style={styles.buttonText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: theme.primary,
                  opacity: selectedWarning ? 1 : 0.5,
                },
              ]}
              onPress={handleSubmit}
              disabled={!selectedWarning || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.buttonText} />
              ) : (
                <ThemedText
                  style={[styles.buttonText, { color: theme.buttonText }]}
                >
                  Submit Report
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  warningList: {
    marginBottom: Spacing.lg,
    maxHeight: 400,
  },
  warningOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
  },
  warningIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  warningInfo: {
    flex: 1,
  },
  warningLabel: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  warningDescription: {
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
  },
});
