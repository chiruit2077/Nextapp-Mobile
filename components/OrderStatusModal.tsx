import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { isTablet } from '@/hooks/useResponsiveStyles';

interface OrderStatusModalProps {
  visible: boolean;
  onClose: () => void;
  currentStatus: string;
  onUpdateStatus: (status: string, notes: string) => Promise<void>;
  isLoading?: boolean;
}

// Define valid status transitions
const validTransitions: Record<string, string[]> = {
  New: ['Pending', 'Hold', 'Cancelled'],
  Pending: ['Processing', 'Hold', 'Cancelled'],
  Processing: ['Picked', 'Hold', 'Cancelled'],
  Hold: ['New', 'Pending', 'Processing', 'Picked', 'Dispatched', 'Completed', 'Cancelled'],
  Picked: ['Dispatched', 'Hold'],
  Dispatched: ['Completed'],
  Completed: [],
  Cancelled: []
};

// Status info with colors and descriptions
const statusInfo: Record<string, { color: string, bgColor: string, description: string }> = {
  New: { 
    color: '#3b82f6', 
    bgColor: '#dbeafe',
    description: 'Order has been created and is awaiting processing'
  },
  Pending: { 
    color: '#f59e0b', 
    bgColor: '#fef3c7',
    description: 'Order is waiting for confirmation'
  },
  Processing: { 
    color: '#8b5cf6', 
    bgColor: '#ede9fe',
    description: 'Order is being processed and prepared'
  },
  Hold: { 
    color: '#f59e0b', 
    bgColor: '#fef3c7',
    description: 'Order is on hold pending review'
  },
  Picked: { 
    color: '#059669', 
    bgColor: '#dcfce7',
    description: 'Order items have been picked from inventory'
  },
  Dispatched: { 
    color: '#8b5cf6', 
    bgColor: '#ede9fe',
    description: 'Order has been dispatched for delivery'
  },
  Completed: { 
    color: '#10b981', 
    bgColor: '#dcfce7',
    description: 'Order has been completed successfully'
  },
  Cancelled: { 
    color: '#ef4444', 
    bgColor: '#fee2e2',
    description: 'Order has been cancelled'
  }
};

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  visible,
  onClose,
  currentStatus,
  onUpdateStatus,
  isLoading = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const isTabletDevice = isTablet();

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedStatus('');
      setNotes('');
    }
  }, [visible]);

  // Get available status options based on current status
  const getAvailableStatuses = () => {
    const normalizedStatus = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase();
    return validTransitions[normalizedStatus] || [];
  };

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    await onUpdateStatus(selectedStatus, notes);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          entering={FadeInDown.duration(300)}
          style={[
            styles.modalContainer,
            isTabletDevice && styles.tabletModalContainer
          ]}
        >
          <View style={[
            styles.modalHeader,
            isTabletDevice && styles.tabletModalHeader
          ]}>
            <Text style={[
              styles.modalTitle,
              isTabletDevice && styles.tabletModalTitle
            ]}>
              Update Order Status
            </Text>
            <TouchableOpacity 
              onPress={onClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <X size={isTabletDevice ? 28 : 24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.currentStatusContainer}>
            <Text style={[
              styles.currentStatusLabel,
              isTabletDevice && styles.tabletCurrentStatusLabel
            ]}>
              Current Status:
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusInfo[currentStatus]?.bgColor || '#f1f5f9' },
              isTabletDevice && styles.tabletStatusBadge
            ]}>
              <Text style={[
                styles.statusText,
                { color: statusInfo[currentStatus]?.color || '#64748b' },
                isTabletDevice && styles.tabletStatusText
              ]}>
                {currentStatus}
              </Text>
            </View>
          </View>
          
          <Text style={[
            styles.sectionTitle,
            isTabletDevice && styles.tabletSectionTitle
          ]}>
            Select New Status
          </Text>
          
          <View style={styles.statusOptions}>
            {getAvailableStatuses().length > 0 ? (
              getAvailableStatuses().map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    { backgroundColor: statusInfo[status]?.bgColor || '#f1f5f9' },
                    selectedStatus === status && styles.selectedStatusOption,
                    isTabletDevice && styles.tabletStatusOption
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text style={[
                    styles.statusOptionText,
                    { color: statusInfo[status]?.color || '#64748b' },
                    selectedStatus === status && styles.selectedStatusOptionText,
                    isTabletDevice && styles.tabletStatusOptionText
                  ]}>
                    {status}
                  </Text>
                  
                  {selectedStatus === status && (
                    <View style={[
                      styles.checkIcon,
                      isTabletDevice && styles.tabletCheckIcon
                    ]}>
                      <Check size={isTabletDevice ? 20 : 16} color={statusInfo[status]?.color || '#64748b'} />
                    </View>
                  )}
                  
                  <Text style={[
                    styles.statusDescription,
                    { color: statusInfo[status]?.color || '#64748b' },
                    isTabletDevice && styles.tabletStatusDescription
                  ]}>
                    {statusInfo[status]?.description}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noStatusesContainer}>
                <Text style={styles.noStatusesText}>
                  No status changes available for {currentStatus} orders
                </Text>
              </View>
            )}
          </View>
          
          <View style={[
            styles.notesContainer,
            isTabletDevice && styles.tabletNotesContainer
          ]}>
            <Text style={[
              styles.notesLabel,
              isTabletDevice && styles.tabletNotesLabel
            ]}>
              Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                isTabletDevice && styles.tabletNotesInput
              ]}
              placeholder="Add notes about this status change..."
              placeholderTextColor="#94a3b8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
          
          <View style={[
            styles.modalFooter,
            isTabletDevice && styles.tabletModalFooter
          ]}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                isTabletDevice && styles.tabletCancelButton
              ]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[
                styles.cancelButtonText,
                isTabletDevice && styles.tabletCancelButtonText
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.updateButton,
                (!selectedStatus || isLoading) && styles.disabledButton,
                isTabletDevice && styles.tabletUpdateButton
              ]}
              onPress={handleSubmit}
              disabled={!selectedStatus || isLoading}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={[
                  styles.updateGradient,
                  isTabletDevice && styles.tabletUpdateGradient
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
                    <Text style={[
                      styles.updateButtonText,
                      isTabletDevice && styles.tabletUpdateButtonText
                    ]}>
                      Update Status
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabletModalContainer: {
    maxWidth: 500,
    padding: 32,
    borderRadius: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabletModalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tabletModalTitle: {
    fontSize: 24,
  },
  currentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  currentStatusLabel: {
    fontSize: 16,
    color: '#64748b',
    marginRight: 12,
  },
  tabletCurrentStatusLabel: {
    fontSize: 18,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabletStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabletStatusText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  tabletSectionTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  statusOptions: {
    marginBottom: 24,
    maxHeight: 300,
  },
  statusOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tabletStatusOption: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  selectedStatusOption: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tabletStatusOptionText: {
    fontSize: 18,
  },
  selectedStatusOptionText: {
    fontWeight: '700',
  },
  checkIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletCheckIcon: {
    top: 20,
    right: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  statusDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  tabletStatusDescription: {
    fontSize: 16,
  },
  noStatusesContainer: {
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  noStatusesText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  notesContainer: {
    marginBottom: 24,
  },
  tabletNotesContainer: {
    marginBottom: 32,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  tabletNotesLabel: {
    fontSize: 18,
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tabletNotesInput: {
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    minHeight: 120,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tabletModalFooter: {
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  tabletCancelButton: {
    paddingVertical: 16,
    borderRadius: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  tabletCancelButtonText: {
    fontSize: 18,
  },
  updateButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabletUpdateButton: {
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  updateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  tabletUpdateGradient: {
    paddingVertical: 16,
    gap: 12,
  },
  updateButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabletUpdateButtonText: {
    fontSize: 18,
  },
});