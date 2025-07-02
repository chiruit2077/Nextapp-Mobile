import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { CircleCheck as CheckCircle, Circle, Package, MapPin, CircleAlert as AlertCircle, Plus, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isTablet } from '@/hooks/useResponsiveStyles';

export interface OrderItem {
  id: number;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  picked?: boolean;
  pickedQuantity?: number;
  rackLocation?: string;
  part?: {
    name: string;
    category: string;
    image?: string;
  };
}

interface OrderItemPickerProps {
  items: OrderItem[];
  onItemPick: (itemId: number, picked: boolean, pickedQuantity?: number) => void;
  disabled?: boolean;
}

export const OrderItemPicker: React.FC<OrderItemPickerProps> = ({
  items,
  onItemPick,
  disabled = false,
}) => {
  const isTabletDevice = isTablet();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const allItemsPicked = items.every(item => item.picked);
  const hasPartialPicks = items.some(item => item.picked && (item.pickedQuantity || 0) < item.quantity);

  const handleQuantityChange = (item: OrderItem, newQuantity: number) => {
    // Ensure quantity is not negative and doesn't exceed order quantity
    const validQuantity = Math.max(0, Math.min(newQuantity, item.quantity));
    
    // If quantity is 0, uncheck the item
    if (validQuantity === 0) {
      onItemPick(item.id, false, 0);
    } else {
      onItemPick(item.id, true, validQuantity);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isTabletDevice && styles.tabletTitle]}>
          Order Items
        </Text>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: allItemsPicked ? '#dcfce7' : '#fef3c7',
            borderColor: allItemsPicked ? '#86efac' : '#fde68a',
          },
          isTabletDevice && styles.tabletStatusBadge
        ]}>
          {allItemsPicked ? (
            <>
              <CheckCircle size={isTabletDevice ? 16 : 14} color="#10b981" />
              <Text style={[styles.statusText, { color: '#10b981' }, isTabletDevice && styles.tabletStatusText]}>
                All Picked
              </Text>
            </>
          ) : (
            <>
              <AlertCircle size={isTabletDevice ? 16 : 14} color="#f59e0b" />
              <Text style={[styles.statusText, { color: '#f59e0b' }, isTabletDevice && styles.tabletStatusText]}>
                {items.filter(item => item.picked).length} of {items.length} Picked
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {items.map((item) => (
          <View key={item.id} style={[styles.itemCard, isTabletDevice && styles.tabletItemCard]}>
            <TouchableOpacity
              style={[
                styles.checkboxContainer,
                item.picked && styles.checkedContainer,
                disabled && styles.disabledCheckbox,
                isTabletDevice && styles.tabletCheckboxContainer
              ]}
              onPress={() => !disabled && onItemPick(item.id, !item.picked, item.picked ? 0 : item.quantity)}
              disabled={disabled}
            >
              {item.picked ? (
                <CheckCircle 
                  size={isTabletDevice ? 24 : 20} 
                  color={disabled ? "#94a3b8" : "#10b981"} 
                />
              ) : (
                <Circle 
                  size={isTabletDevice ? 24 : 20} 
                  color={disabled ? "#94a3b8" : "#64748b"} 
                />
              )}
            </TouchableOpacity>
            
            <View style={styles.itemImageContainer}>
              {item.part?.image ? (
                <Image source={{ uri: item.part.image }} style={styles.itemImage} />
              ) : (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.itemImagePlaceholder}
                >
                  <Package size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
                </LinearGradient>
              )}
            </View>
            
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, isTabletDevice && styles.tabletItemName]} numberOfLines={2}>
                {item.partName || item.part?.name || 'Unknown Part'}
              </Text>
              <Text style={[styles.itemNumber, isTabletDevice && styles.tabletItemNumber]}>
                #{item.partNumber}
              </Text>
              
              {item.rackLocation && (
                <View style={styles.rackContainer}>
                  <MapPin size={isTabletDevice ? 14 : 12} color="#64748b" />
                  <Text style={[styles.rackText, isTabletDevice && styles.tabletRackText]}>
                    Rack: {item.rackLocation}
                  </Text>
                </View>
              )}
              
              <View style={styles.quantityContainer}>
                <Text style={[styles.quantityLabel, isTabletDevice && styles.tabletQuantityLabel]}>
                  Order Qty: {item.quantity}
                </Text>
                
                {item.picked && (
                  <View style={styles.pickedQuantityContainer}>
                    <Text style={[
                      styles.pickedQuantityLabel, 
                      isTabletDevice && styles.tabletPickedQuantityLabel,
                      (item.pickedQuantity || 0) < item.quantity && styles.partialQuantityLabel
                    ]}>
                      Picked: {item.pickedQuantity || 0}/{item.quantity}
                    </Text>
                    
                    {(item.pickedQuantity || 0) < item.quantity && (
                      <View style={styles.partialBadge}>
                        <Text style={styles.partialBadgeText}>Partial</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.itemDetails}>
              <Text style={[styles.priceText, isTabletDevice && styles.tabletPriceText]}>
                {formatCurrency(item.totalPrice)}
              </Text>
              
              {item.picked && (
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(item, (item.pickedQuantity || 0) - 1)}
                    disabled={disabled || (item.pickedQuantity || 0) <= 0}
                  >
                    <Minus size={16} color={(item.pickedQuantity || 0) <= 0 ? "#cbd5e1" : "#64748b"} />
                  </TouchableOpacity>
                  
                  <TextInput
                    style={styles.quantityInput}
                    value={String(item.pickedQuantity || 0)}
                    onChangeText={(text) => {
                      const newQuantity = parseInt(text) || 0;
                      handleQuantityChange(item, newQuantity);
                    }}
                    keyboardType="numeric"
                    editable={!disabled}
                  />
                  
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(item, (item.pickedQuantity || 0) + 1)}
                    disabled={disabled || (item.pickedQuantity || 0) >= item.quantity}
                  >
                    <Plus size={16} color={(item.pickedQuantity || 0) >= item.quantity ? "#cbd5e1" : "#64748b"} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
      
      {!allItemsPicked && !disabled && (
        <View style={styles.infoContainer}>
          <AlertCircle size={16} color="#f59e0b" />
          <Text style={styles.infoText}>
            All items must be picked before changing order status to "Picked"
          </Text>
        </View>
      )}
      
      {hasPartialPicks && !disabled && (
        <View style={styles.warningContainer}>
          <AlertCircle size={16} color="#ef4444" />
          <Text style={styles.warningText}>
            Some items have partial quantities. You can still proceed with the picked status.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tabletTitle: {
    fontSize: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabletStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabletStatusText: {
    fontSize: 14,
  },
  itemsContainer: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabletItemCard: {
    borderRadius: 16,
    padding: 16,
  },
  checkboxContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabletCheckboxContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  checkedContainer: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  disabledCheckbox: {
    opacity: 0.5,
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  tabletItemName: {
    fontSize: 16,
  },
  itemNumber: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  tabletItemNumber: {
    fontSize: 14,
  },
  rackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rackText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  tabletRackText: {
    fontSize: 14,
    marginLeft: 6,
  },
  quantityContainer: {
    marginTop: 4,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  tabletQuantityLabel: {
    fontSize: 14,
  },
  pickedQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pickedQuantityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  tabletPickedQuantityLabel: {
    fontSize: 14,
  },
  partialQuantityLabel: {
    color: '#f59e0b',
  },
  partialBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  partialBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  tabletPriceText: {
    fontSize: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  infoText: {
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 8,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  warningText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
    flex: 1,
  },
});