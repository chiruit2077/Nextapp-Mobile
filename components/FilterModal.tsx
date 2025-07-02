import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { SlideInDown, SlideOutDown, FadeIn } from 'react-native-reanimated';
import { isTablet } from '@/hooks/useResponsiveStyles';

const { height, width } = Dimensions.get('window');

interface FilterOption {
  key: string;
  label: string;
  icon?: React.ComponentType<any>;
  count?: number;
}

interface SortOption {
  key: string;
  label: string;
  icon?: React.ComponentType<any>;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  filters: FilterOption[];
  sorts: SortOption[];
  selectedFilter: string;
  selectedSort: string;
  onFilterSelect: (filter: string) => void;
  onSortSelect: (sort: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  title,
  filters,
  sorts,
  selectedFilter,
  selectedSort,
  onFilterSelect,
  onSortSelect,
}) => {
  const isTabletDevice = isTablet();
  const isLandscape = width > height;

  const handleApply = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          entering={SlideInDown.duration(300)} 
          exiting={SlideOutDown.duration(300)}
          style={[
            styles.filterModal,
            isTabletDevice && styles.tabletFilterModal,
            isLandscape && styles.landscapeFilterModal
          ]}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Modal Header */}
            <View style={[
              styles.modalHeader,
              isTabletDevice && styles.tabletModalHeader
            ]}>
              <View style={styles.modalTitleContainer}>
                <Text style={[
                  styles.modalTitle,
                  isTabletDevice && styles.tabletModalTitle
                ]}>
                  {title}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                style={[
                  styles.closeButton,
                  isTabletDevice && styles.tabletCloseButton
                ]}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <X size={isTabletDevice ? 28 : 24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.modalScrollContent,
                isTabletDevice && styles.tabletModalScrollContent
              ]}
            >
              {/* Filter Section */}
              <View style={[
                styles.filterSection,
                isTabletDevice && styles.tabletFilterSection
              ]}>
                <Text style={[
                  styles.filterSectionTitle,
                  isTabletDevice && styles.tabletFilterSectionTitle
                ]}>
                  Filter Options
                </Text>
                <View style={[
                  styles.filterGrid,
                  isTabletDevice && isLandscape && styles.tabletLandscapeFilterGrid
                ]}>
                  {filters.map((filter) => (
                    <TouchableOpacity
                      key={filter.key}
                      style={[
                        styles.filterOption,
                        selectedFilter === filter.key && styles.selectedFilterOption,
                        isTabletDevice && styles.tabletFilterOption
                      ]}
                      onPress={() => onFilterSelect(filter.key)}
                    >
                      <View style={styles.filterOptionContent}>
                        {filter.icon && (
                          <filter.icon 
                            size={isTabletDevice ? 24 : 20} 
                            color={selectedFilter === filter.key ? '#667eea' : '#64748b'} 
                          />
                        )}
                        <Text style={[
                          styles.filterOptionText,
                          selectedFilter === filter.key && styles.selectedFilterOptionText,
                          isTabletDevice && styles.tabletFilterOptionText
                        ]}>
                          {filter.label}
                        </Text>
                      </View>
                      {filter.count !== undefined && (
                        <View style={[
                          styles.filterCount,
                          selectedFilter === filter.key && styles.selectedFilterCount
                        ]}>
                          <Text style={[
                            styles.filterCountText,
                            selectedFilter === filter.key && styles.selectedFilterCountText,
                            isTabletDevice && styles.tabletFilterCountText
                          ]}>
                            {filter.count}
                          </Text>
                        </View>
                      )}
                      {selectedFilter === filter.key && (
                        <View style={[
                          styles.selectedIndicator,
                          isTabletDevice && styles.tabletSelectedIndicator
                        ]}>
                          <Check size={isTabletDevice ? 20 : 16} color="#667eea" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Sort Section */}
              <View style={[
                styles.sortSection,
                isTabletDevice && styles.tabletSortSection
              ]}>
                <Text style={[
                  styles.filterSectionTitle,
                  isTabletDevice && styles.tabletFilterSectionTitle
                ]}>
                  Sort Options
                </Text>
                <View style={[
                  styles.sortGrid,
                  isTabletDevice && isLandscape && styles.tabletLandscapeSortGrid
                ]}>
                  {sorts.map((sort) => (
                    <TouchableOpacity
                      key={sort.key}
                      style={[
                        styles.sortOption,
                        selectedSort === sort.key && styles.selectedSortOption,
                        isTabletDevice && styles.tabletSortOption
                      ]}
                      onPress={() => onSortSelect(sort.key)}
                    >
                      {sort.icon && (
                        <sort.icon 
                          size={isTabletDevice ? 24 : 18} 
                          color={selectedSort === sort.key ? '#667eea' : '#64748b'} 
                        />
                      )}
                      <Text style={[
                        styles.sortOptionText,
                        selectedSort === sort.key && styles.selectedSortOptionText,
                        isTabletDevice && styles.tabletSortOptionText
                      ]}>
                        {sort.label}
                      </Text>
                      {selectedSort === sort.key && (
                        <View style={[
                          styles.selectedIndicator,
                          isTabletDevice && styles.tabletSelectedIndicator
                        ]}>
                          <Check size={isTabletDevice ? 20 : 16} color="#667eea" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            {/* Apply Button */}
            <View style={[
              styles.modalFooter,
              isTabletDevice && styles.tabletModalFooter
            ]}>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  isTabletDevice && styles.tabletApplyButton
                ]}
                onPress={handleApply}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.applyGradient,
                    isTabletDevice && styles.tabletApplyGradient
                  ]}
                >
                  <Check size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
                  <Text style={[
                    styles.applyButtonText,
                    isTabletDevice && styles.tabletApplyButtonText
                  ]}>
                    Apply Filters
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.5,
  },
  tabletFilterModal: {
    maxHeight: height * 0.8,
    maxWidth: 600,
    marginHorizontal: 'auto',
    borderRadius: 24,
    alignSelf: 'center',
  },
  landscapeFilterModal: {
    maxHeight: height * 0.9,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabletModalHeader: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tabletModalTitle: {
    fontSize: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  tabletModalScrollContent: {
    paddingBottom: 32,
  },
  filterSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  tabletFilterSection: {
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  tabletFilterSectionTitle: {
    fontSize: 20,
    marginBottom: 20,
  },
  filterGrid: {
    gap: 8,
  },
  tabletLandscapeFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#FFFFFF',
  },
  tabletFilterOption: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    } : {
      elevation: 2,
    }),
  },
  selectedFilterOption: {
    backgroundColor: '#ede9fe',
    borderColor: '#667eea',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    fontWeight: '500',
  },
  tabletFilterOptionText: {
    fontSize: 18,
    marginLeft: 16,
  },
  selectedFilterOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
  filterCount: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  selectedFilterCount: {
    backgroundColor: '#667eea',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabletFilterCountText: {
    fontSize: 14,
  },
  selectedFilterCountText: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletSelectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sortSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  tabletSortSection: {
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  sortGrid: {
    gap: 8,
  },
  tabletLandscapeSortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#FFFFFF',
  },
  tabletSortOption: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    } : {
      elevation: 2,
    }),
  },
  selectedSortOption: {
    backgroundColor: '#ede9fe',
    borderColor: '#667eea',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
  tabletSortOptionText: {
    fontSize: 18,
    marginLeft: 16,
  },
  selectedSortOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tabletModalFooter: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  applyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabletApplyButton: {
    borderRadius: 20,
    maxWidth: 400,
    alignSelf: 'center',
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabletApplyGradient: {
    paddingVertical: 20,
    gap: 12,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabletApplyButtonText: {
    fontSize: 20,
  },
});