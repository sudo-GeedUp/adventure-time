import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, TextInput, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { storage, UserProfile, EmergencyContact } from "@/utils/storage";

const COMMON_EQUIPMENT = [
  { id: "winch", label: "Winch", icon: "anchor" },
  { id: "tow_straps", label: "Tow Straps / Rope", icon: "link" },
  { id: "recovery_boards", label: "Recovery Boards", icon: "layout" },
  { id: "hi_lift_jack", label: "Hi-Lift Jack", icon: "tool" },
  { id: "shovel", label: "Shovel", icon: "trending-up" },
  { id: "tire_repair", label: "Tire Repair Kit", icon: "circle" },
  { id: "air_compressor", label: "Air Compressor", icon: "wind" },
  { id: "jumper_cables", label: "Jumper Cables", icon: "zap" },
];

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "Profile"
>;

const AVATAR_ICONS = [
  { icon: "truck", label: "Jeep" },
  { icon: "map", label: "Topo" },
  { icon: "circle", label: "Tire" },
  { icon: "navigation", label: "Compass" },
];

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>({
    id: "1",
    name: "",
    vehicleType: "",
    avatarIndex: 0,
    vehicleSpecs: {
      make: "",
      model: "",
      year: "",
      modifications: "",
    },
    equipment: [],
  });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    loadProfile();
    loadEmergencyContacts();
  }, []);

  const loadProfile = async () => {
    const savedProfile = await storage.getUserProfile();
    if (savedProfile) {
      setProfile({
        ...savedProfile,
        vehicleSpecs: savedProfile.vehicleSpecs || {
          make: "",
          model: "",
          year: "",
          modifications: "",
        },
        equipment: savedProfile.equipment || [],
      });
    }
  };

  const loadEmergencyContacts = async () => {
    const contacts = await storage.getEmergencyContacts();
    setEmergencyContacts(contacts);
  };

  const handleSaveProfile = async () => {
    await storage.saveUserProfile(profile);
  };

  const handleAvatarChange = async (index: number) => {
    const updatedProfile = { ...profile, avatarIndex: index };
    setProfile(updatedProfile);
    await storage.saveUserProfile(updatedProfile);
  };

  const toggleEquipment = async (equipmentId: string) => {
    const equipment = profile.equipment || [];
    const updatedEquipment = equipment.includes(equipmentId)
      ? equipment.filter((id) => id !== equipmentId)
      : [...equipment, equipmentId];
    
    const updatedProfile = { ...profile, equipment: updatedEquipment };
    setProfile(updatedProfile);
    await storage.saveUserProfile(updatedProfile);
  };

  return (
    <ScreenScrollView>
      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>Avatar</ThemedText>
        <View style={styles.avatarGrid}>
          {AVATAR_ICONS.map((avatar, index) => (
            <Pressable
              key={index}
              style={[
                styles.avatarOption,
                {
                  borderColor:
                    profile.avatarIndex === index ? theme.primary : theme.border,
                  borderWidth: profile.avatarIndex === index ? 3 : 1,
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
              onPress={() => handleAvatarChange(index)}
              android_ripple={{ color: theme.backgroundSecondary }}
            >
              <Feather name={avatar.icon as any} size={40} color={theme.primary} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>Profile Info</ThemedText>
        <View style={[styles.input, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="user" size={20} color={theme.tabIconDefault} />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Display Name"
            placeholderTextColor={theme.tabIconDefault}
            value={profile.name}
            onChangeText={(text) => setProfile({ ...profile, name: text })}
            onBlur={handleSaveProfile}
          />
        </View>
        <View style={[styles.input, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="truck" size={20} color={theme.tabIconDefault} />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Vehicle Type (e.g., Jeep Wrangler)"
            placeholderTextColor={theme.tabIconDefault}
            value={profile.vehicleType}
            onChangeText={(text) => setProfile({ ...profile, vehicleType: text })}
            onBlur={handleSaveProfile}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Vehicle Specifications
        </ThemedText>
        <View style={[styles.input, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="tag" size={20} color={theme.tabIconDefault} />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Make (e.g., Jeep)"
            placeholderTextColor={theme.tabIconDefault}
            value={profile.vehicleSpecs?.make || ""}
            onChangeText={(text) =>
              setProfile({
                ...profile,
                vehicleSpecs: {
                  ...(profile.vehicleSpecs || { make: "", model: "", year: "", modifications: "" }),
                  make: text,
                },
              })
            }
            onBlur={handleSaveProfile}
          />
        </View>
        <View style={[styles.input, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="tag" size={20} color={theme.tabIconDefault} />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Model (e.g., Wrangler JL)"
            placeholderTextColor={theme.tabIconDefault}
            value={profile.vehicleSpecs?.model || ""}
            onChangeText={(text) =>
              setProfile({
                ...profile,
                vehicleSpecs: {
                  ...(profile.vehicleSpecs || { make: "", model: "", year: "", modifications: "" }),
                  model: text,
                },
              })
            }
            onBlur={handleSaveProfile}
          />
        </View>
        <View style={[styles.input, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="calendar" size={20} color={theme.tabIconDefault} />
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Year (e.g., 2023)"
            placeholderTextColor={theme.tabIconDefault}
            value={profile.vehicleSpecs?.year || ""}
            onChangeText={(text) =>
              setProfile({
                ...profile,
                vehicleSpecs: {
                  ...(profile.vehicleSpecs || { make: "", model: "", year: "", modifications: "" }),
                  year: text,
                },
              })
            }
            onBlur={handleSaveProfile}
            keyboardType="numeric"
          />
        </View>
        <View
          style={[
            styles.input,
            styles.multilineInput,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <Feather
            name="settings"
            size={20}
            color={theme.tabIconDefault}
            style={styles.iconTop}
          />
          <TextInput
            style={[styles.textInput, styles.multilineTextInput, { color: theme.text }]}
            placeholder="Modifications (e.g., 3.5 inch lift, 35 inch tires, winch)"
            placeholderTextColor={theme.tabIconDefault}
            value={profile.vehicleSpecs?.modifications || ""}
            onChangeText={(text) =>
              setProfile({
                ...profile,
                vehicleSpecs: {
                  ...(profile.vehicleSpecs || { make: "", model: "", year: "", modifications: "" }),
                  modifications: text,
                },
              })
            }
            onBlur={handleSaveProfile}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>
          Recovery Equipment
        </ThemedText>
        <View style={[styles.equipmentCard, { backgroundColor: theme.backgroundDefault }]}>
          {COMMON_EQUIPMENT.map((item) => (
            <View key={item.id} style={styles.equipmentRow}>
              <View style={styles.equipmentInfo}>
                <Feather name={item.icon as any} size={20} color={theme.tabIconDefault} />
                <ThemedText style={styles.equipmentLabel}>{item.label}</ThemedText>
              </View>
              <Switch
                value={profile.equipment?.includes(item.id) || false}
                onValueChange={() => toggleEquipment(item.id)}
                trackColor={{ false: theme.border, true: theme.primary + "80" }}
                thumbColor={
                  profile.equipment?.includes(item.id) ? theme.primary : theme.tabIconDefault
                }
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[Typography.h4, styles.sectionTitle]}>
            Emergency Contacts
          </ThemedText>
          <Pressable style={styles.addButton}>
            <Feather name="plus-circle" size={24} color={theme.primary} />
          </Pressable>
        </View>
        {emergencyContacts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="phone" size={32} color={theme.tabIconDefault} />
            <ThemedText style={[styles.emptyText, { color: theme.tabIconDefault }]}>
              No emergency contacts added yet
            </ThemedText>
          </View>
        ) : (
          emergencyContacts.map((contact) => (
            <View
              key={contact.id}
              style={[styles.contactCard, { backgroundColor: theme.backgroundDefault }]}
            >
              <View style={styles.contactInfo}>
                <ThemedText style={Typography.label}>{contact.name}</ThemedText>
                <ThemedText style={[styles.phone, { color: theme.tabIconDefault }]}>
                  {contact.phone}
                </ThemedText>
              </View>
              <Feather name="phone" size={20} color={theme.success} />
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>Settings</ThemedText>
        <Pressable
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
          onPress={() => navigation.navigate("Settings")}
          android_ripple={{ color: theme.backgroundSecondary }}
        >
          <View style={styles.menuItemContent}>
            <Feather name="settings" size={24} color={theme.primary} />
            <ThemedText style={styles.menuItemText}>App Settings</ThemedText>
          </View>
          <Feather name="chevron-right" size={24} color={theme.tabIconDefault} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h4, styles.sectionTitle]}>Special Thanks</ThemedText>
        <View style={[styles.thanksCard, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="heart" size={24} color={theme.primary} />
          <ThemedText style={styles.thanksText}>ChloeAnn</ThemedText>
          <ThemedText style={[styles.thanksSubtext, { color: theme.tabIconDefault }]}>
            For inspiring Adventure Time
          </ThemedText>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  avatarGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  avatarOption: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    height: Spacing.inputHeight,
  },
  textInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  addButton: {
    padding: Spacing.xs,
  },
  emptyCard: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
    textAlign: "center",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  phone: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    minHeight: 64,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    alignItems: "flex-start",
    paddingTop: Spacing.md,
  },
  iconTop: {
    marginTop: Spacing.xs,
  },
  multilineTextInput: {
    minHeight: 80,
  },
  equipmentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  equipmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  equipmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  equipmentLabel: {
    marginLeft: Spacing.md,
    fontSize: 16,
  },
  thanksCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  thanksText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
    textAlign: "center",
  },
  thanksSubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
