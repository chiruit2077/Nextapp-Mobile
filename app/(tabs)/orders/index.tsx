import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { FilterModal } from '@/components/FilterModal';
import { OrderStatusModal } from '@/components/OrderStatusModal';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { ModernHeader } from '@/components/ModernHeader';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types/api';
import { ShoppingCart, Clock, CircleCheck as CheckCircle, Truck, Package, CircleAlert as AlertCircle, Plus, Calendar, User, DollarSign, MapPin, Search, X, Filter, Eye, CreditCard as Edit3, Trash2, Download, Building, FileText, Star, ArrowUpDown, SlidersHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { isTablet } from '@/hooks/useResponsiveStyles';
import { PlatformSafeAreaView } from '@/components/PlatformSafeAreaView';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'new' | 'processing' | 'completed' | 'hold' | 'picked' | 'dispatched' | 'pending' | 'cancelled';
type SortType = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'status';

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

export default function OrdersScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('date_desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const isTabletDevice = isTablet();

  const canCreateOrder = ['admin', 'manager', 'salesman'].includes(user?.role || '');
  const canEditOrders = ['admin', 'manager'].includes(user?.role || '');
  const canUpdateStatus = ['admin', 'manager', 'storeman'].includes(user?.role || '');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [orders, searchQuery, selectedFilter, selectedSort]);

  const loadOrders = async () => {
    try {
      setError(null);
      const response = await apiService.getOrders({ limit: 100 });
      const orderData = response.data || response.orders || [];
      
      console.log('📦 Loaded orders:', orderData);
      setOrders(orderData);
    } catch (error: any) {
      setError(error.error || 'Failed to load orders');
      showToast('Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const applyFiltersAndSort = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (order) =>
          (order.orderNumber || order.CRMOrderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.retailer?.businessName || order.Retailer_Name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.retailer?.contactName || order.Contact_Person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.status || order.Order_Status || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(order => 
        (order.status || order.Order_Status || '').toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'date_desc':
          const dateA = new Date(a.orderDate || a.created_at).getTime();
          const dateB = new Date(b.orderDate || b.created_at).getTime();
          return dateB - dateA;
        case 'date_asc':
          const dateA2 = new Date(a.orderDate || a.created_at).getTime();
          const dateB2 = new Date(b.orderDate || b.created_at).getTime();
          return dateA2 - dateB2;
        case 'amount_desc':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        case 'amount_asc':
          return (a.totalAmount || 0) - (b.totalAmount || 0);
        case 'status':
          return (a.status || a.Order_Status || '').localeCompare(b.status || b.Order_Status || '');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const getStatusInfo = (status: string) => {
    const safeStatus = (status || 'unknown').toLowerCase();
    switch (safeStatus) {
      case 'new':
        return {
          icon: <Plus size={16} color="#3b82f6" />,
          color: '#3b82f6',
          bgColor: '#dbeafe',
          text: 'New',
        };
      case 'pending':
        return {
          icon: <Clock size={16} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Pending',
        };
      case 'processing':
        return {
          icon: <Package size={16} color="#8b5cf6" />,
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          text: 'Processing',
        };
      case 'completed':
        return {
          icon: <CheckCircle size={16} color="#10b981" />,
          color: '#10b981',
          bgColor: '#dcfce7',
          text: 'Completed',
        };
      case 'hold':
        return {
          icon: <AlertCircle size={16} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Hold',
        };
      case 'picked':
        return {
          icon: <Package size={16} color="#059669" />,
          color: '#059669',
          bgColor: '#dcfce7',
          text: 'Picked',
        };
      case 'dispatched':
        return {
          icon: <Truck size={16} color="#8b5cf6" />,
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          text: 'Dispatched',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle size={16} color="#ef4444" />,
          color: '#ef4444',
          bgColor: '#fee2e2',
          text: 'Cancelled',
        };
      default:
        return {
          icon: <Clock size={16} color="#64748b" />,
          color: '#64748b',
          bgColor: '#f1f5f9',
          text: 'Unknown',
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | number) => {
    const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | number) => {
    const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScreenTitle = () => {
    const role = user?.role || '';
    switch (role) {
      case 'retailer':
        return 'My Orders';
      case 'salesman':
        return 'Sales Orders';
      case 'storeman':
        return 'Order Fulfillment';
      default:
        return 'Order Management';
    }
  };

  const handleCreateOrder = () => {
    router.push('/(tabs)/orders/create');
  };

  const handleOrderPress = (order: Order) => {
    const orderId = order.id || order.Order_Id;
    router.push(`/(tabs)/orders/${orderId}`);
  };

  const handleQuickAction = (order: Order, action: 'view' | 'edit' | 'cancel' | 'download' | 'status') => {
    const orderId = order.id || order.Order_Id;
    const orderNumber = order.orderNumber || order.CRMOrderId;
    
    switch (action) {
      case 'view':
        handleOrderPress(order);
        break;
      case 'edit':
        if (canEditOrders) {
          router.push(`/(tabs)/orders/${orderId}?edit=true`);
        } else {
          showToast('You don\'t have permission to edit orders', 'warning');
        }
        break;
      case 'status':
        if (canUpdateStatus) {
          setSelectedOrder(order);
          setShowStatusModal(true);
        } else {
          showToast('You don\'t have permission to update order status', 'warning');
        }
        break;
      case 'cancel':
        if (canEditOrders) {
          Alert.alert(
            'Cancel Order',
            `Are you sure you want to cancel order ${orderNumber}?`,
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes, Cancel',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await apiService.updateOrderStatus(orderId, 'Cancelled');
                    showToast(`Order ${orderNumber} cancelled`, 'success');
                    loadOrders(); // Refresh the list
                  } catch (error: any) {
                    showToast(error.error || 'Failed to cancel order', 'error');
                  }
                },
              },
            ]
          );
        } else {
          showToast('You don\'t have permission to cancel orders', 'warning');
        }
        break;
      case 'download':
        showToast('Downloading order invoice...', 'info');
        break;
    }
  };

  const handleUpdateStatus = async (newStatus: string, notes: string) => {
    if (!selectedOrder) return;
    
    setIsUpdatingStatus(true);
    try {
      const orderId = selectedOrder.id || selectedOrder.Order_Id;
      await apiService.updateOrderStatus(orderId, newStatus, notes);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          (order.id === orderId || order.Order_Id === orderId) 
            ? { ...order, status: newStatus, Order_Status: newStatus } 
            : order
        )
      );
      
      showToast(`Order status updated to ${newStatus}`, 'success');
      setShowStatusModal(false);
    } catch (error: any) {
      showToast(error.error || 'Failed to update order status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderOrderItem = ({ item, index }: { item: Order; index: number }) => {
    const statusInfo = getStatusInfo(item.status || item.Order_Status);
    const orderNumber = item.orderNumber || item.CRMOrderId;
    const retailerName = item.retailer?.businessName || item.Retailer_Name;
    const contactPerson = item.retailer?.contactName || item.Contact_Person;
    const orderDate = item.orderDate || item.created_at;
    const branchName = item.branch || item.Branch_Name;
    const companyName = item.Company_Name;
    const isUrgent = item.urgent || item.Urgent_Status === 1;
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
        <TouchableOpacity
          style={[styles.orderCard, isTabletDevice && styles.tabletOrderCard]}
          onPress={() => handleOrderPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <View style={styles.orderTitleRow}>
                <Text style={[styles.orderNumber, isTabletDevice && styles.tabletOrderNumber]}>
                  #{orderNumber}
                </Text>
                {isUrgent && (
                  <View style={[styles.urgentBadge, isTabletDevice && styles.tabletUrgentBadge]}>
                    <Star size={isTabletDevice ? 14 : 12} color="#ef4444" />
                    <Text style={[styles.urgentText, isTabletDevice && styles.tabletUrgentText]}>
                      Urgent
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.retailerInfo}>
                <User size={isTabletDevice ? 16 : 14} color="#64748b" />
                <Text style={[styles.retailerName, isTabletDevice && styles.tabletRetailerName]}>
                  {retailerName || 'Unknown Retailer'}
                </Text>
              </View>
              
              {contactPerson && contactPerson !== '0' && (
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactText, isTabletDevice && styles.tabletContactText]}>
                    Contact: {contactPerson}
                  </Text>
                </View>
              )}
              
              <View style={styles.dateInfo}>
                <Calendar size={isTabletDevice ? 16 : 14} color="#64748b" />
                <Text style={[styles.orderDate, isTabletDevice && styles.tabletOrderDate]}>
                  {formatDateTime(orderDate)}
                </Text>
              </View>
              
              {branchName && (
                <View style={styles.branchInfo}>
                  <Building size={isTabletDevice ? 16 : 14} color="#64748b" />
                  <Text style={[styles.branchText, isTabletDevice && styles.tabletBranchText]}>
                    {branchName}
                  </Text>
                </View>
              )}
              
              {companyName && (
                <View style={styles.companyInfo}>
                  <Text style={[styles.companyText, isTabletDevice && styles.tabletCompanyText]}>
                    {companyName}
                  </Text>
                </View>
              )}
              
              {item.PO_Number && (
                <View style={styles.poInfo}>
                  <FileText size={isTabletDevice ? 16 : 14} color="#64748b" />
                  <Text style={[styles.poText, isTabletDevice && styles.tabletPoText]}>
                    PO: {item.PO_Number}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.orderAmount}>
              <Text style={[styles.amountText, isTabletDevice && styles.tabletAmountText]}>
                {formatCurrency(item.totalAmount || 0)}
              </Text>
              <Text style={[styles.itemCount, isTabletDevice && styles.tabletItemCount]}>
                {Math.floor(Math.random() * 10) + 1} item{Math.floor(Math.random() * 10) + 1 !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          <View style={styles.orderFooter}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: statusInfo.bgColor },
              isTabletDevice && styles.tabletStatusBadge
            ]}>
              {statusInfo.icon}
              <Text style={[
                styles.statusText, 
                { color: statusInfo.color },
                isTabletDevice && styles.tabletStatusText
              ]}>
                {statusInfo.text}
              </Text>
            </View>
            
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickActionButton, isTabletDevice && styles.tabletQuickActionButton]}
                onPress={() => handleQuickAction(item, 'view')}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Eye size={isTabletDevice ? 20 : 16} color="#667eea" />
              </TouchableOpacity>
              
              {canUpdateStatus && (
                <TouchableOpacity
                  style={[styles.quickActionButton, isTabletDevice && styles.tabletQuickActionButton]}
                  onPress={() => handleQuickAction(item, 'status')}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Edit3 size={isTabletDevice ? 20 : 16} color="#059669" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.quickActionButton, isTabletDevice && styles.tabletQuickActionButton]}
                onPress={() => handleQuickAction(item, 'download')}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Download size={isTabletDevice ? 20 : 16} color="#f59e0b" />
              </TouchableOpacity>
              
              {canEditOrders && ['new', 'pending', 'processing'].includes((item.status || item.Order_Status || '').toLowerCase()) && (
                <TouchableOpacity
                  style={[styles.quickActionButton, isTabletDevice && styles.tabletQuickActionButton]}
                  onPress={() => handleQuickAction(item, 'cancel')}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Trash2 size={isTabletDevice ? 20 : 16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {item.Remark && (
            <View style={styles.remarksSection}>
              <Text style={[styles.remarksLabel, isTabletDevice && styles.tabletRemarksLabel]}>
                Notes:
              </Text>
              <Text 
                style={[styles.remarksText, isTabletDevice && styles.tabletRemarksText]} 
                numberOfLines={2}
              >
                {item.Remark}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderStats = () => {
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'new').length;
    const processingOrders = orders.filter(o => ['processing', 'picked'].includes((o.status || o.Order_Status || '').toLowerCase())).length;
    const completedOrders = orders.filter(o => ['completed', 'dispatched'].includes((o.status || o.Order_Status || '').toLowerCase())).length;
    
    return (
      <View style={[styles.statsContainer, isTabletDevice && styles.tabletStatsContainer]}>
        <View style={styles.statCard}>
          <LinearGradient 
            colors={['#667eea', '#764ba2']} 
            style={[styles.statGradient, isTabletDevice && styles.tabletStatGradient]}
          >
            <ShoppingCart size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
            <Text style={[styles.statNumber, isTabletDevice && styles.tabletStatNumber]}>
              {totalOrders}
            </Text>
            <Text style={[styles.statLabel, isTabletDevice && styles.tabletStatLabel]}>
              Total
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient 
            colors={['#3b82f6', '#2563eb']} 
            style={[styles.statGradient, isTabletDevice && styles.tabletStatGradient]}
          >
            <Plus size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
            <Text style={[styles.statNumber, isTabletDevice && styles.tabletStatNumber]}>
              {newOrders}
            </Text>
            <Text style={[styles.statLabel, isTabletDevice && styles.tabletStatLabel]}>
              New
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient 
            colors={['#8b5cf6', '#7c3aed']} 
            style={[styles.statGradient, isTabletDevice && styles.tabletStatGradient]}
          >
            <Package size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
            <Text style={[styles.statNumber, isTabletDevice && styles.tabletStatNumber]}>
              {processingOrders}
            </Text>
            <Text style={[styles.statLabel, isTabletDevice && styles.tabletStatLabel]}>
              Processing
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient 
            colors={['#10b981', '#059669']} 
            style={[styles.statGradient, isTabletDevice && styles.tabletStatGradient]}
          >
            <CheckCircle size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
            <Text style={[styles.statNumber, isTabletDevice && styles.tabletStatNumber]}>
              {completedOrders}
            </Text>
            <Text style={[styles.statLabel, isTabletDevice && styles.tabletStatLabel]}>
              Completed
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const filterOptions = [
    { key: 'all', label: 'All Orders', icon: ShoppingCart, count: orders.length },
    { key: 'new', label: 'New', icon: Plus, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'new').length },
    { key: 'pending', label: 'Pending', icon: Clock, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'pending').length },
    { key: 'processing', label: 'Processing', icon: Package, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'processing').length },
    { key: 'completed', label: 'Completed', icon: CheckCircle, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'completed').length },
    { key: 'hold', label: 'Hold', icon: AlertCircle, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'hold').length },
    { key: 'picked', label: 'Picked', icon: Package, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'picked').length },
    { key: 'dispatched', label: 'Dispatched', icon: Truck, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'dispatched').length },
    { key: 'cancelled', label: 'Cancelled', icon: AlertCircle, count: orders.filter(o => (o.status || o.Order_Status || '').toLowerCase() === 'cancelled').length },
  ];

  const sortOptions = [
    { key: 'date_desc', label: 'Newest First', icon: ArrowUpDown },
    { key: 'date_asc', label: 'Oldest First', icon: ArrowUpDown },
    { key: 'amount_desc', label: 'Highest Amount', icon: DollarSign },
    { key: 'amount_asc', label: 'Lowest Amount', icon: DollarSign },
    { key: 'status', label: 'Status', icon: SlidersHorizontal },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading orders..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadOrders} />;
  }

  return (
    <PlatformSafeAreaView style={styles.container} gradientHeader>
      {/* Header */}
      <ModernHeader
        title={getScreenTitle()}
        subtitle={`${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
        leftButton={<HamburgerMenu />}
        rightButton={
          canCreateOrder ? {
            icon: <Plus size={isTabletDevice ? 28 : 24} color="#FFFFFF" />,
            onPress: handleCreateOrder
          } : undefined
        }
        variant="gradient"
      />

      {/* Stats */}
      {renderStats()}

      {/* Search and Filter */}
      <View style={[styles.searchContainer, isTabletDevice && styles.tabletSearchContainer]}>
        <View style={[styles.searchBar, isTabletDevice && styles.tabletSearchBar]}>
          <Search size={isTabletDevice ? 24 : 20} color="#94a3b8" />
          <TextInput
            style={[styles.searchInput, isTabletDevice && styles.tabletSearchInput]}
            placeholder="Search orders by number, retailer..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={isTabletDevice ? 24 : 20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton, 
            (selectedFilter !== 'all' || selectedSort !== 'date_desc') && styles.filterButtonActive,
            isTabletDevice && styles.tabletFilterButton
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter 
            size={isTabletDevice ? 24 : 20} 
            color={(selectedFilter !== 'all' || selectedSort !== 'date_desc') ? "#FFFFFF" : "#667eea"} 
          />
          {(selectedFilter !== 'all' || selectedSort !== 'date_desc') && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => (item.id || item.Order_Id || index).toString()}
        contentContainerStyle={[
          styles.listContent, 
          isTabletDevice && styles.tabletListContent
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, isTabletDevice && styles.tabletEmptyState]}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={[styles.emptyIcon, isTabletDevice && styles.tabletEmptyIcon]}
            >
              <ShoppingCart size={isTabletDevice ? 64 : 48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, isTabletDevice && styles.tabletEmptyTitle]}>
              {searchQuery ? 'No orders found' : 'No orders yet'}
            </Text>
            <Text style={[styles.emptySubtitle, isTabletDevice && styles.tabletEmptySubtitle]}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : user?.role === 'retailer'
                ? 'Place your first order to get started'
                : 'Orders will appear here once created'}
            </Text>
            {canCreateOrder && !searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, isTabletDevice && styles.tabletEmptyButton]}
                onPress={handleCreateOrder}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={[styles.emptyButtonGradient, isTabletDevice && styles.tabletEmptyButtonGradient]}
                >
                  <Plus size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
                  <Text style={[styles.emptyButtonText, isTabletDevice && styles.tabletEmptyButtonText]}>
                    Create First Order
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter & Sort Orders"
        filters={filterOptions}
        sorts={sortOptions}
        selectedFilter={selectedFilter}
        selectedSort={selectedSort}
        onFilterSelect={(filter) => setSelectedFilter(filter as FilterType)}
        onSortSelect={(sort) => setSelectedSort(sort as SortType)}
      />

      {/* Status Update Modal */}
      <OrderStatusModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={selectedOrder?.status || selectedOrder?.Order_Status || ''}
        onUpdateStatus={handleUpdateStatus}
        isLoading={isUpdatingStatus}
      />
    </PlatformSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  tabletStatsContainer: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statGradient: {
    padding: 12,
    alignItems: 'center',
  },
  tabletStatGradient: {
    padding: 16,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 2,
  },
  tabletStatNumber: {
    fontSize: 20,
    marginTop: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  tabletStatLabel: {
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  tabletSearchContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabletSearchBar: {
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 60,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  tabletSearchInput: {
    fontSize: 18,
    marginLeft: 16,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  tabletFilterButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  listContent: {
    paddingBottom: 120,
  },
  tabletListContent: {
    paddingHorizontal: 12,
    paddingBottom: 140,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabletOrderCard: {
    borderRadius: 24,
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 24,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 12,
  },
  tabletOrderNumber: {
    fontSize: 22,
    marginRight: 16,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tabletUrgentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  tabletUrgentText: {
    fontSize: 12,
  },
  retailerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  retailerName: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  tabletRetailerName: {
    fontSize: 16,
    marginLeft: 8,
  },
  contactInfo: {
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 20,
  },
  tabletContactText: {
    fontSize: 14,
    marginLeft: 24,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  tabletOrderDate: {
    fontSize: 14,
    marginLeft: 8,
  },
  branchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  branchText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  tabletBranchText: {
    fontSize: 14,
    marginLeft: 8,
  },
  companyInfo: {
    marginBottom: 4,
  },
  companyText: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 20,
  },
  tabletCompanyText: {
    fontSize: 13,
    marginLeft: 24,
  },
  poInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 6,
  },
  tabletPoText: {
    fontSize: 13,
    marginLeft: 8,
  },
  orderAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  tabletAmountText: {
    fontSize: 24,
    marginBottom: 6,
  },
  itemCount: {
    fontSize: 12,
    color: '#64748b',
  },
  tabletItemCount: {
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  tabletStatusText: {
    fontSize: 14,
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabletQuickActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  remarksSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  tabletRemarksLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  remarksText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  tabletRemarksText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  tabletEmptyState: {
    paddingVertical: 120,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tabletEmptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  tabletEmptyTitle: {
    fontSize: 28,
    marginBottom: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  tabletEmptySubtitle: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabletEmptyButton: {
    borderRadius: 20,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  tabletEmptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    gap: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabletEmptyButtonText: {
    fontSize: 18,
  },
});