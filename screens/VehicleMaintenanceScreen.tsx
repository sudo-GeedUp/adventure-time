import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  SectionList,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import ThemedText from '@/components/ThemedText';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { MaintenanceTracker, MaintenanceItem, MaintenanceSchedule } from '@/utils/vehicleMaintenance';

export default function VehicleMaintenanceScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [maintenanceLog, setMaintenanceLog] = useState<MaintenanceItem[]>([]);
  const [schedule, setSchedule] = useState<MaintenanceSchedule[]>([]);
  const [dueMaintenance, setDueMaintenance] = useState<MaintenanceSchedule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [costAnalysis, setCostAnalysis] = useState<any>(null);
  const [newMaintenance, setNewMaintenance] = useState({
    type: 'Oil Change',
    customType: '',
    mileage: '',
    trailMiles: '',
    cost: '',
    notes: '',
    shop: '',
  });

  useEffect(() => {
    loadMaintenanceData();
    setupScheduleIfNeeded();
  }, []);

  const loadMaintenanceData = async () => {
    const log = await MaintenanceTracker.getMaintenanceLog();
    setMaintenanceLog(log);

    const sched = await MaintenanceTracker.getMaintenanceSchedule();
    setSchedule(sched);

    const due = await MaintenanceTracker.checkDueMaintenance();
    setDueMaintenance(due);

    const cost = await MaintenanceTracker.calculateCostPerAdventure();
    setCostAnalysis(cost);
  };

  const setupScheduleIfNeeded = async () => {
    const sched = await MaintenanceTracker.getMaintenanceSchedule();
    if (sched.length === 0) {
      await MaintenanceTracker.setupMaintenanceSchedule('Default');
      loadMaintenanceData();
    }
  };

  const handleAddMaintenance = async () => {
    if (!newMaintenance.cost || !newMaintenance.mileage) {
      Alert.alert('Missing Information', 'Please fill in cost and mileage');
      return;
    }

    await MaintenanceTracker.addMaintenanceRecord({
      type: newMaintenance.type as any,
      customType: newMaintenance.customType,
      performedAt: Date.now(),
      mileage: parseInt(newMaintenance.mileage),
      trailMiles: parseInt(newMaintenance.trailMiles) || 0,
      cost: parseFloat(newMaintenance.cost),
      notes: newMaintenance.notes,
      shop: newMaintenance.shop,
    });

    setShowAddModal(false);
    setNewMaintenance({
      type: 'Oil Change',
      customType: '',
      mileage: '',
      trailMiles: '',
      cost: '',
      notes: '',
      shop: '',
    });
    loadMaintenanceData();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const renderMaintenanceItem = ({ item }: { item: MaintenanceItem }) => (
    <View style={[styles.logItem, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.logHeader}>
        <View style={styles.logTypeContainer}>
          <Feather name="tool" size={20} color={theme.primary} />
          <ThemedText style={[Typography.h4, styles.logType]}>
            {item.type === 'Custom' ? item.customType : item.type}
          </ThemedText>
        </View>
        <ThemedText style={styles.logDate}>{formatDate(item.performedAt)}</ThemedText>
      </View>
      <View style={styles.logDetails}>
        <View style={styles.logDetailRow}>
          <ThemedText style={styles.logLabel}>Mileage:</ThemedText>
          <ThemedText style={styles.logValue}>{item.mileage.toLocaleString()} mi</ThemedText>
        </View>
        {item.trailMiles > 0 && (
          <View style={styles.logDetailRow}>
            <ThemedText style={styles.logLabel}>Trail Miles:</ThemedText>
            <ThemedText style={styles.logValue}>{item.trailMiles} mi</ThemedText>
          </View>
        )}
        <View style={styles.logDetailRow}>
          <ThemedText style={styles.logLabel}>Cost:</ThemedText>
          <ThemedText style={[styles.logValue, { color: theme.success }]}>${item.cost.toFixed(2)}</ThemedText>
        </View>
        {item.shop && (
          <View style={styles.logDetailRow}>
            <ThemedText style={styles.logLabel}>Shop:</ThemedText>
            <ThemedText style={styles.logValue}>{item.shop}</ThemedText>
          </View>
        )}
        {item.notes && (
          <ThemedText style={styles.logNotes}>{item.notes}</ThemedText>
        )}
      </View>
    </View>
  );

  const renderScheduleItem = ({ item }: { item: MaintenanceSchedule }) => {
    const isDue = dueMaintenance.some(d => d.id === item.id);
    return (
      <View style={[
        styles.scheduleItem,
        { 
          backgroundColor: theme.backgroundDefault,
          borderLeftColor: isDue ? theme.error : theme.primary,
        }
      ]}>
        <View style={styles.scheduleHeader}>
          <ThemedText style={[Typography.h4, styles.scheduleType]}>
            {item.type}
          </ThemedText>
          {isDue && (
            <View style={[styles.dueBadge, { backgroundColor: theme.error }]}>
              <ThemedText style={styles.dueBadgeText}>DUE</ThemedText>
            </View>
          )}
        </View>
        <View style={styles.scheduleDetails}>
          <ThemedText style={styles.scheduleInterval}>
            Every {item.intervalMiles.toLocaleString()} miles or {item.intervalMonths} months
          </ThemedText>
          {item.lastPerformed && (
            <ThemedText style={styles.lastPerformed}>
              Last: {formatDate(item.lastPerformed)}
            </ThemedText>
          )}
          <ThemedText style={styles.nextDue}>
            Next: {item.nextDueMiles.toLocaleString()} mi or {formatDate(item.nextDueDate)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cost Analysis Card */}
        {costAnalysis && (
          <View style={[styles.costCard, { backgroundColor: theme.primary + '15' }]}>
            <ThemedText style={[Typography.h4, styles.costTitle]}>Cost Analysis</ThemedText>
            <View style={styles.costRow}>
              <ThemedText style={styles.costLabel}>Total Spent:</ThemedText>
              <ThemedText style={[styles.costValue, { color: theme.primary }]}>
                ${costAnalysis.totalCost.toFixed(2)}
              </ThemedText>
            </View>
            <View style={styles.costRow}>
              <ThemedText style={styles.costLabel}>Adventures:</ThemedText>
              <ThemedText style={styles.costValue}>{costAnalysis.adventureCount}</ThemedText>
            </View>
            <View style={styles.costRow}>
              <ThemedText style={styles.costLabel}>Per Adventure:</ThemedText>
              <ThemedText style={[styles.costValue, { color: theme.success }]}>
                ${costAnalysis.costPerAdventure.toFixed(2)}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Add Button */}
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Feather name="plus" size={24} color="white" />
          <ThemedText style={styles.addButtonText}>Log Maintenance</ThemedText>
        </Pressable>

        {/* Maintenance Due */}
        {dueMaintenance.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[Typography.h4, styles.sectionHeader]}>
              Maintenance Due
            </ThemedText>
            {dueMaintenance.map((item) => renderScheduleItem({ item }))}
          </View>
        )}

        {/* Maintenance Schedule */}
        {schedule.filter(s => !dueMaintenance.some(d => d.id === s.id)).length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[Typography.h4, styles.sectionHeader]}>
              Maintenance Schedule
            </ThemedText>
            {schedule.filter(s => !dueMaintenance.some(d => d.id === s.id)).map((item) => renderScheduleItem({ item }))}
          </View>
        )}

        {/* Maintenance History */}
        {maintenanceLog.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[Typography.h4, styles.sectionHeader]}>
              Maintenance History
            </ThemedText>
            {maintenanceLog.slice(0, 10).map((item) => renderMaintenanceItem({ item }))}
          </View>
        )}
      </ScrollView>

      {/* Add Maintenance Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[Typography.h3, styles.modalTitle]}>
                Log Maintenance
              </ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            <ScrollView>
              <ThemedText style={styles.inputLabel}>Type</ThemedText>
              <View style={styles.typeButtons}>
                {['Oil Change', 'Tire Rotation', 'Air Filter', 'Brake Service', 'Custom'].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: newMaintenance.type === type ? theme.primary : theme.backgroundRoot,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => setNewMaintenance({ ...newMaintenance, type })}
                  >
                    <ThemedText
                      style={[
                        styles.typeButtonText,
                        { color: newMaintenance.type === type ? 'white' : theme.text }
                      ]}
                    >
                      {type}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {newMaintenance.type === 'Custom' && (
                <>
                  <ThemedText style={styles.inputLabel}>Custom Type</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
                    placeholder="Enter maintenance type"
                    placeholderTextColor={theme.tabIconDefault}
                    value={newMaintenance.customType}
                    onChangeText={(text) => setNewMaintenance({ ...newMaintenance, customType: text })}
                  />
                </>
              )}

              <ThemedText style={styles.inputLabel}>Current Mileage</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
                placeholder="Enter current mileage"
                placeholderTextColor={theme.tabIconDefault}
                value={newMaintenance.mileage}
                onChangeText={(text) => setNewMaintenance({ ...newMaintenance, mileage: text })}
                keyboardType="numeric"
              />

              <ThemedText style={styles.inputLabel}>Trail Miles Since Last Service</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
                placeholder="Enter trail miles (optional)"
                placeholderTextColor={theme.tabIconDefault}
                value={newMaintenance.trailMiles}
                onChangeText={(text) => setNewMaintenance({ ...newMaintenance, trailMiles: text })}
                keyboardType="numeric"
              />

              <ThemedText style={styles.inputLabel}>Cost</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
                placeholder="Enter cost"
                placeholderTextColor={theme.tabIconDefault}
                value={newMaintenance.cost}
                onChangeText={(text) => setNewMaintenance({ ...newMaintenance, cost: text })}
                keyboardType="decimal-pad"
              />

              <ThemedText style={styles.inputLabel}>Shop (Optional)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
                placeholder="Enter shop name"
                placeholderTextColor={theme.tabIconDefault}
                value={newMaintenance.shop}
                onChangeText={(text) => setNewMaintenance({ ...newMaintenance, shop: text })}
              />

              <ThemedText style={styles.inputLabel}>Notes (Optional)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, minHeight: 80 }]}
                placeholder="Enter notes"
                placeholderTextColor={theme.tabIconDefault}
                value={newMaintenance.notes}
                onChangeText={(text) => setNewMaintenance({ ...newMaintenance, notes: text })}
                multiline
              />

              <Pressable
                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                onPress={handleAddMaintenance}
              >
                <ThemedText style={styles.submitButtonText}>Add Maintenance</ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  costCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  costTitle: {
    marginBottom: Spacing.md,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  costLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  logItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  logTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logType: {
    flex: 1,
  },
  logDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  logDetails: {
    marginLeft: Spacing.lg + 20,
  },
  logDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  logLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  logValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  logNotes: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: Spacing.xs,
  },
  scheduleItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scheduleType: {},
  dueBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  dueBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  scheduleDetails: {},
  scheduleInterval: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  lastPerformed: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: Spacing.xs,
  },
  nextDue: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {},
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
