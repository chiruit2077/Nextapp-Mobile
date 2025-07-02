import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { apiService } from '@/services/api';
import { SearchBar } from '@/components/SearchBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { ModernHeader } from '@/components/ModernHeader';
import { useAuth } from '@/context/AuthContext';
import { Package, TriangleAlert as AlertTriangle, Plus, Minus, CreditCard as Edit3, TrendingUp, TrendingDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ModernButton } from '@/components/ModernButton';
import { isTablet } from '@/hooks/useResponsiveStyles';
import { PlatformSafeAreaView } from '@/components/PlatformSafeAreaView';

interface InventoryItem {
  branchCode: string;
  partNo: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  rackLocation?: string;
  lastUpdated: string;
  part?: {
    name: string;
    category: string;
    unitPrice: number;
  };
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isTabletDevice = isTablet();

  const loadInventory = async () => {
    try {
      setError(null);
      const response = await apiService.getItemStatus({ limit: 100 });
      setInventory(response.data || []);
      setFilteredInventory(response.data || []);
    } catch (error: any) {
      setError(error.error || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(
        (item) =>
          item.partNo.toLowerCase().includes(query.toLowerCase()) ||
          item.part?.name.toLowerCase().includes(query.toLowerCase()) ||
          item.part?.category.toLowerCase().includes(query.toLowerCase()) ||
          item.rackLocation?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredInventory(filtered);
    }
  };

  const handleStockUpdate = async (item: InventoryItem, operation: 'add' | 'subtract', quantity: number) => {
    try {
      await apiService.updateItemStock(item.branchCode, item.partNo, quantity, operation);
      loadInventory(); // Refresh the list
      Alert.alert('Success', `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`);
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to update stock');
    }
  };

  const showStockUpdateDialog = (item: InventoryItem, operation: 'add' | 'subtract') => {
    Alert.prompt(
      `${operation === 'add' ? 'Add' : 'Remove'} Stock`,
      `Enter quantity to ${operation}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (quantity) => {
            const qty = parseInt(quantity || '0', 10);
            if (qty > 0) {
              handleStockUpdate(item, operation, qty);
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const isLowStock = (item: InventoryItem) => {
    return item.currentStock <= item.minimumStock;
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minimumStock) {
      return { status: 'low', color: '#DC2626', text: 'Low Stock' };
    } else if (item.currentStock >= item.maximumStock) {
      return { status: 'high', color: '#D97706', text: 'Overstock' };
    } else {
      return { status: 'normal', color: '#059669', text: 'Normal' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const stockStatus = getStockStatus(item);
    
    return (
      <View style={[styles.inventoryCard, isTabletDevice && styles.tabletInventoryCard]}>
        <View style={styles.inventoryHeader}>
          <View style={styles.partInfo}>
            <Text style={[styles.partNumber, isTabletDevice && styles.tabletPartNumber]}>
              #{item.partNo}
            </Text>
            <Text 
              style={[styles.partName, isTabletDevice && styles.tabletPartName]} 
              numberOfLines={2}
            >
              {item.part?.name || 'Unknown Part'}
            </Text>
            <Text style={[styles.partCategory, isTabletDevice && styles.tabletPartCategory]}>
              {item.part?.category}
            </Text>
            {item.rackLocation && (
              <Text style={[styles.rackLocation, isTabletDevice && styles.tabletRackLocation]}>
                Rack: {item.rackLocation}
              </Text>
            )}
          </View>
          
          <View style={styles.stockInfo}>
            <Text style={[styles.stockNumber, isTabletDevice && styles.tabletStockNumber]}>
              {item.currentStock}
            </Text>
            <Text style={[styles.stockLabel, isTabletDevice && styles.tabletStockLabel]}>
              in stock
            </Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: `${stockStatus.color}20` },
              isTabletDevice && styles.tabletStatusBadge
            ]}>
              <Text style={[
                styles.statusText, 
                { color: stockStatus.color },
                isTabletDevice && styles.tabletStatusText
              ]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.stockDetails}>
          <View style={styles.stockRange}>
            <Text style={[styles.stockRangeLabel, isTabletDevice && styles.tabletStockRangeLabel]}>
              Min: {item.minimumStock}
            </Text>
            <Text style={[styles.stockRangeLabel, isTabletDevice && styles.tabletStockRangeLabel]}>
              Max: {item.maximumStock}
            </Text>
            {item.part?.unitPrice && (
              <Text style={[styles.priceText, isTabletDevice && styles.tabletPriceText]}>
                {formatCurrency(item.part.unitPrice)}
              </Text>
            )}
          </View>
          
          <Text style={[styles.lastUpdated, isTabletDevice && styles.tabletLastUpdated]}>
            Updated: {formatDate(item.lastUpdated)}
          </Text>
        </View>

        {/* Stock Actions */}
        <View style={styles.actionButtons}>
          <ModernButton
            title="Add"
            onPress={() => showStockUpdateDialog(item, 'add')}
            icon={<Plus size={isTabletDevice ? 20 : 16} color="#059669" />}
            variant="outline"
            size={isTabletDevice ? "medium" : "small"}
            style={styles.addButton}
          />
          <ModernButton
            title="Remove"
            onPress={() => showStockUpdateDialog(item, 'subtract')}
            icon={<Minus size={isTabletDevice ? 20 : 16} color="#DC2626" />}
            variant="outline"
            size={isTabletDevice ? "medium" : "small"}
            style={styles.removeButton}
          />
          <ModernButton
            title="Edit"
            onPress={() => {}}
            icon={<Edit3 size={isTabletDevice ? 20 : 16} color="#2563EB" />}
            variant="outline"
            size={isTabletDevice ? "medium" : "small"}
            style={styles.editButton}
          />
        </View>

        {isLowStock(item) && (
          <View style={[styles.alertBanner, isTabletDevice && styles.tabletAlertBanner]}>
            <AlertTriangle size={isTabletDevice ? 20 : 16} color="#DC2626" />
            <Text style={[styles.alertText, isTabletDevice && styles.tabletAlertText]}>
              Stock level is below minimum threshold
            </Text>
          </View>
        )}
      </View>
    );
  };

  const handleAddPart = () => {
    // Navigation or logic to add a new part
    Alert.alert('Add Part', 'Navigate to add part screen');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading inventory..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadInventory} />;
  }

  return (
    <PlatformSafeAreaView style={styles.container} gradientHeader>
      {/* Header */}
      <ModernHeader
        title="Inventory Management"
        subtitle={`${filteredInventory.length} item${filteredInventory.length !== 1 ? 's' : ''} in stock`}
        leftButton={<HamburgerMenu />}
        rightButton={{
          icon: <Plus size={isTabletDevice ? 20 : 16} color="#FFFFFF" />,
          title: "Add Part",
          onPress: handleAddPart
        }}
        variant="gradient"
      />

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search by part number, name, category, rack..."
        value={searchQuery}
      />

      {/* Inventory List */}
      <FlatList
        data={filteredInventory}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => `${item.branchCode}-${item.partNo}`}
        contentContainerStyle={[
          styles.listContent, 
          isTabletDevice && styles.tabletListContent,
          filteredInventory.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, isTabletDevice && styles.tabletEmptyState]}>
            <Package size={isTabletDevice ? 80 : 64} color="#94A3B8" />
            <Text style={[styles.emptyTitle, isTabletDevice && styles.tabletEmptyTitle]}>
              {searchQuery ? 'No items found' : 'No inventory items'}
            </Text>
            <Text style={[styles.emptySubtitle, isTabletDevice && styles.tabletEmptySubtitle]}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Inventory items will appear here once added'}
            </Text>
          </View>
        }
      />
    </PlatformSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tabletListContent: {
    padding: 24,
    paddingBottom: 48,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabletInventoryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partInfo: {
    flex: 1,
    marginRight: 12,
  },
  partNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  tabletPartNumber: {
    fontSize: 16,
    marginBottom: 6,
  },
  partName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  tabletPartName: {
    fontSize: 18,
    marginBottom: 6,
  },
  partCategory: {
    fontSize: 12,
    color: '#7C3AED',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  tabletPartCategory: {
    fontSize: 14,
    marginBottom: 6,
  },
  rackLocation: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  tabletRackLocation: {
    fontSize: 14,
  },
  stockInfo: {
    alignItems: 'center',
  },
  stockNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  tabletStockNumber: {
    fontSize: 30,
    marginBottom: 4,
  },
  stockLabel: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  tabletStockLabel: {
    fontSize: 12,
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tabletStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  tabletStatusText: {
    fontSize: 12,
  },
  stockDetails: {
    marginBottom: 12,
  },
  stockRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockRangeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  tabletStockRangeLabel: {
    fontSize: 14,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    fontFamily: 'Inter-SemiBold',
  },
  tabletPriceText: {
    fontSize: 16,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
  },
  tabletLastUpdated: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    flex: 1,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    flex: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tabletAlertBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  alertText: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  tabletAlertText: {
    fontSize: 14,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  tabletEmptyState: {
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  tabletEmptyTitle: {
    fontSize: 22,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 20,
  },
  tabletEmptySubtitle: {
    fontSize: 16,
    paddingHorizontal: 40,
  },
});