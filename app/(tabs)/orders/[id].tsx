import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { OrderStatusModal } from '@/components/OrderStatusModal';
import { OrderItemPicker } from '@/components/OrderItemPicker';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Order } from '@/types/api';
import { 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CircleCheck as CheckCircle, 
  Truck, 
  CircleAlert as AlertCircle, 
  CreditCard as Edit3, 
  Trash2, 
  Download,
  ArrowLeft,
  Building,
  DollarSign,
  FileText,
  Save,
  X,
  Eye,
  MessageSquare,
  Star,
  Plus
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { isTablet } from '@/hooks/useResponsiveStyles';
import { PlatformSafeAreaView } from '@/components/PlatformSafeAreaView';
import { ModernHeader } from '@/components/ModernHeader';
import { ModernButton } from '@/components/ModernButton';

interface OrderDetails {
  // Core order fields
  id?: number;
  orderNumber?: string;
  retailerId?: number;
  status?: string;
  totalAmount?: number;
  orderDate?: string;
  deliveryDate?: string;
  notes?: string;
  urgent?: boolean;
  branch?: string;
  retailer?: {
    businessName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items?: OrderItem[];
  statusHistory?: StatusHistoryItem[];
  // API response fields
  Order_Id?: number;
  CRMOrderId?: string;
  Retailer_Id?: number;
  Transport_Id?: number | null;
  TransportBy?: string | null;
  Place_By?: string;
  Place_Date?: number;
  Confirm_By?: string | null;
  Confirm_Date?: number | null;
  Pick_By?: string | null;
  Pick_Date?: number | null;
  Pack_By?: string | null;
  Checked_By?: string | null;
  Pack_Date?: number | null;
  Delivered_By?: string | null;
  Delivered_Date?: number | null;
  Order_Status?: string;
  Branch?: string;
  DispatchId?: string | null;
  Remark?: string;
  PO_Number?: string;
  PO_Date?: number;
  Urgent_Status?: number | boolean;
  Longitude?: number | null;
  IsSync?: number | boolean;
  Latitude?: number | null;
  Last_Sync?: number;
  created_at?: string;
  updated_at?: string;
  Retailer_Name?: string;
  Contact_Person?: string;
  Retailer_Email?: string;
  Branch_Name?: string;
  Company_Name?: string;
}

interface OrderItem {
  id: number;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pickedQuantity?: number;
  basicDiscount?: number;
  schemeDiscount?: number;
  additionalDiscount?: number;
  urgent?: boolean;
  picked?: boolean;
  rackLocation?: string;
  part?: {
    name: string;
    category: string;
    image?: string;
  };
  // API response fields
  Order_Item_Id?: number;
  Order_Id?: number;
  Order_Srl?: number;
  Part_Admin?: string;
  Part_Salesman?: string;
  Order_Qty?: number;
  Dispatch_Qty?: number;
  Pick_Date?: number | null;
  Pick_By?: string | null;
  OrderItemStatus?: string;
  PlaceDate?: number;
  RetailerId?: number;
  ItemAmount?: number;
  SchemeDisc?: number;
  AdditionalDisc?: number;
  Discount?: number;
  MRP?: number;
  FirstOrderDate?: number;
  Urgent_Status?: number;
  Last_Sync?: number;
  created_at?: string;
  updated_at?: string;
  Part_Name?: string;
  Part_Image?: string | null;
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  updatedBy: string;
  notes?: string;
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

export default function OrderDetailsScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const isTabletDevice = isTablet();

  const canEdit = ['admin', 'manager'].includes(user?.role || '');
  const canUpdateStatus = ['admin', 'manager', 'storeman'].includes(user?.role || '');
  const canCancel = ['admin', 'manager'].includes(user?.role || '');

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setError(null);
      const response = await apiService.getOrder(parseInt(id));
      
      console.log('📦 Raw API Response:', JSON.stringify(response, null, 2));
      
      // Transform API response to match our OrderDetails interface
      const transformedOrder: OrderDetails = {
        ...response,
        id: response.Order_Id,
        orderNumber: response.CRMOrderId,
        retailerId: response.Retailer_Id,
        status: response.Order_Status,
        totalAmount: calculateOrderTotal(response),
        orderDate: response.Place_Date ? new Date(response.Place_Date).toISOString() : response.created_at,
        deliveryDate: response.Delivered_Date ? new Date(response.Delivered_Date).toISOString() : undefined,
        notes: response.Remark,
        urgent: response.Urgent_Status === 1,
        branch: response.Branch_Name,
        retailer: {
          businessName: response.Retailer_Name,
          contactName: response.Contact_Person !== '0' ? response.Contact_Person : undefined,
          email: response.Retailer_Email !== '0' ? response.Retailer_Email : undefined,
        }
      };
      
      // Transform order items if they exist
      if (response.items && Array.isArray(response.items) && response.items.length > 0) {
        console.log('📦 Processing items:', response.items);
        transformedOrder.items = response.items.map((item: any) => {
          console.log('📦 Processing item:', item);
          
          // Generate deterministic rack location based on part number
          const generateRackLocation = (partNumber: string) => {
            if (!partNumber) return undefined;
            const hash = partNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const rackNumber = (hash % 10) + 1;
            const sectionLetter = String.fromCharCode(65 + (hash % 5));
            return `${rackNumber}-${sectionLetter}`;
          };
          
          return {
            id: item.Order_Item_Id,
            partNumber: item.Part_Admin,
            partName: item.Part_Name || item.Part_Salesman,
            quantity: item.Order_Qty,
            unitPrice: item.MRP,
            totalPrice: item.ItemAmount,
            pickedQuantity: item.Dispatch_Qty || 0,
            picked: item.OrderItemStatus?.toLowerCase() === 'picked' || Boolean(item.Pick_Date && item.Pick_By),
            basicDiscount: item.Discount || 0,
            schemeDiscount: item.SchemeDisc || 0,
            additionalDiscount: item.AdditionalDisc || 0,
            urgent: item.Urgent_Status === 1,
            rackLocation: generateRackLocation(item.Part_Admin),
            part: {
              name: item.Part_Name || item.Part_Salesman,
              category: item.Part_Admin?.split('-')[1] || 'General',
              image: item.Part_Image,
            },
            // Keep all original API fields for reference
            Order_Item_Id: item.Order_Item_Id,
            Order_Id: item.Order_Id,
            Order_Srl: item.Order_Srl,
            Part_Admin: item.Part_Admin,
            Part_Salesman: item.Part_Salesman,
            Order_Qty: item.Order_Qty,
            Dispatch_Qty: item.Dispatch_Qty,
            Pick_Date: item.Pick_Date,
            Pick_By: item.Pick_By,
            OrderItemStatus: item.OrderItemStatus,
            PlaceDate: item.PlaceDate,
            RetailerId: item.RetailerId,
            ItemAmount: item.ItemAmount,
            SchemeDisc: item.SchemeDisc,
            AdditionalDisc: item.AdditionalDisc,
            Discount: item.Discount,
            MRP: item.MRP,
            FirstOrderDate: item.FirstOrderDate,
            Urgent_Status: item.Urgent_Status,
            Last_Sync: item.Last_Sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            Part_Name: item.Part_Name,
            Part_Image: item.Part_Image,
          };
        });
      } else {
        console.log('📦 No items found in response');
        transformedOrder.items = [];
      }
      
      // Generate status history from order data
      transformedOrder.statusHistory = generateStatusHistory(response);
      
      console.log('📦 Transformed Order:', JSON.stringify(transformedOrder, null, 2));
      setOrder(transformedOrder);
    } catch (error: any) {
      console.error('📦 Error loading order:', error);
      setError(error.error || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate status history from order data
  const generateStatusHistory = (orderData: any): StatusHistoryItem[] => {
    // Only use status_history from API, do not push any status from order fields
    if (Array.isArray(orderData.status_history) && orderData.status_history.length > 0) {
      return orderData.status_history.map((entry: any) => ({
        status: entry.status,
        timestamp: typeof entry.timestamp === 'number'
          ? new Date(entry.timestamp).toISOString()
          : entry.timestamp,
        updatedBy: entry.updated_by_role
          ? `${entry.updated_by_role[0].toUpperCase()}${entry.updated_by_role.slice(1)}`
          : 'User',
        notes: entry.notes,
      }));
    }
    // If no status_history, return empty array
    return [];
  };

  // Calculate order total from items
  const calculateOrderTotal = (orderData: any): number => {
    if (orderData.items && Array.isArray(orderData.items)) {
      return orderData.items.reduce((sum: number, item: any) => {
        return sum + (item.ItemAmount || 0);
      }, 0);
    }
    
    // If no items, return 0
    return 0;
  };

  const getStatusInfo = (status: string) => {
    switch ((status || 'unknown').toLowerCase()) {
      case 'new':
        return {
          icon: <Plus size={20} color="#3b82f6" />,
          color: '#3b82f6',
          bgColor: '#dbeafe',
          text: 'New',
          description: 'Order has been created and is awaiting processing',
        };
      case 'pending':
        return {
          icon: <Clock size={20} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Pending',
          description: 'Order is waiting for confirmation',
        };
      case 'processing':
        return {
          icon: <Package size={20} color="#8b5cf6" />,
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          text: 'Processing',
          description: 'Order is being processed and prepared',
        };
      case 'completed':
        return {
          icon: <CheckCircle size={20} color="#10b981" />,
          color: '#10b981',
          bgColor: '#dcfce7',
          text: 'Completed',
          description: 'Order has been completed successfully',
        };
      case 'hold':
        return {
          icon: <AlertCircle size={20} color="#f59e0b" />,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Hold',
          description: 'Order is on hold pending review',
        };
      case 'picked':
        return {
          icon: <Package size={20} color="#059669" />,
          color: '#059669',
          bgColor: '#dcfce7',
          text: 'Picked',
          description: 'Order items have been picked from inventory',
        };
      case 'dispatched':
        return {
          icon: <Truck size={20} color="#8b5cf6" />,
          color: '#8b5cf6',
          bgColor: '#ede9fe',
          text: 'Dispatched',
          description: 'Order has been dispatched for delivery',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle size={20} color="#ef4444" />,
          color: '#ef4444',
          bgColor: '#fee2e2',
          text: 'Cancelled',
          description: 'Order has been cancelled',
        };
      default:
        return {
          icon: <Clock size={20} color="#64748b" />,
          color: '#64748b',
          bgColor: '#f1f5f9',
          text: 'Unknown',
          description: 'Status unknown',
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const canEditOrder = () => {
    if (!order || !canEdit) return false;
    const editableStatuses = ['new', 'pending'];
    return editableStatuses.includes((order.Order_Status || 'unknown').toLowerCase());
  };

  const canCancelOrder = () => {
    if (!order || !canCancel) return false;
    const cancellableStatuses = ['new', 'pending', 'processing'];
    return cancellableStatuses.includes((order.Order_Status || 'unknown').toLowerCase());
  };

  const handleUpdateStatus = async (newStatus: string, notes: string) => {
    if (!order) return;
    
    // Special validation for Processing to Picked transition
    if ((order.Order_Status || '').toLowerCase() === 'processing' && 
        newStatus.toLowerCase() === 'picked') {
      
      // Check if all items are picked
      const allItemsPicked = order.items?.every(item => item.picked);
      
      if (!allItemsPicked) {
        showToast('All items must be picked before changing status to Picked', 'error');
        setShowStatusModal(false);
        return;
      }
    }

    setIsUpdatingStatus(true);
    try {
      const orderId = order.Order_Id;
      if (!orderId) {
        showToast('Invalid order ID', 'error');
        return;
      }
      await apiService.updateOrderStatus(orderId, newStatus, notes);
      
      // Update local state
      setOrder(prev => prev ? { 
        ...prev, 
        status: newStatus,
        Order_Status: newStatus,
        statusHistory: [
          ...(prev.statusHistory || []),
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            updatedBy: user?.name || 'User',
            notes: notes || `Status updated to ${newStatus}`,
          }
        ]
      } : null);
      
      setShowStatusModal(false);
      setStatusNotes('');
      showToast('Order status updated successfully', 'success');
      
      // Redirect back to orders list after a short delay to show the success message
      setTimeout(() => {
        router.replace('/(tabs)/orders');
      }, 1500);
      
    } catch (error: any) {
      showToast(error.error || 'Failed to update order status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleItemPick = (itemId: number, picked: boolean, pickedQuantity?: number) => {
    if (!order || !order.items) return;
    
    // Update the picked status and quantity for the specific item
    const updatedItems = order.items.map(item => 
      item.id === itemId ? { 
        ...item, 
        picked, 
        pickedQuantity: picked ? (pickedQuantity !== undefined ? pickedQuantity : item.quantity) : 0 
      } : item
    );
    
    // Update the order with the new items array
    setOrder(prev => prev ? { ...prev, items: updatedItems } : null);
  };

  const areAllItemsPicked = () => {
    return order?.items?.every(item => item.picked) || false;
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const orderId = order!.Order_Id;
              if (!orderId) {
                showToast('Invalid order ID', 'error');
                return;
              }
              await apiService.updateOrderStatus(orderId, 'Cancelled');
              setOrder(prev => prev ? { ...prev, status: 'Cancelled', Order_Status: 'Cancelled' } : null);
              showToast('Order has been cancelled', 'success');
              
              // Redirect back to orders list after cancellation
              setTimeout(() => {
                router.replace('/(tabs)/orders');
              }, 1500);
              
            } catch (error: any) {
              showToast(error.error || 'Failed to cancel order', 'error');
            }
          },
        },
      ]
    );
  };

  const handleDownloadInvoice = () => {
    showToast('Downloading invoice...', 'info');
  };

  const handleBackPress = () => {
    // Navigate back to orders list to ensure refresh
    router.replace('/(tabs)/orders');
  };

  const calculateItemTotal = (item: OrderItem) => {
    const totalDiscount = (item.basicDiscount || 0) + (item.schemeDiscount || 0) + (item.additionalDiscount || 0);
    const discountedPrice = item.unitPrice * (1 - totalDiscount / 100);
    return discountedPrice * item.quantity;
  };

  const calculateOrderSubtotal = () => {
    return order?.items?.reduce((sum, item) => sum + calculateItemTotal(item), 0) || order?.totalAmount || 0;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading order details..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadOrderDetails} />;
  }

  if (!order) {
    return <ErrorMessage error="Order not found" />;
  }

  const statusInfo = getStatusInfo(order.Order_Status || 'unknown');
  const subtotal = calculateOrderSubtotal();
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  const orderNumber = order.CRMOrderId;
  const retailerName = order.Retailer_Name;
  const contactPerson = order.Contact_Person;
  const orderDate = order.Place_Date || order.created_at;
  const branchName = order.Branch_Name;
  const companyName = order.Company_Name;
  const isUrgent = order.Urgent_Status === 1;
  const currentStatus = (order.Order_Status || '').toLowerCase();
  const showPickingInterface = currentStatus === 'processing' && canUpdateStatus && user?.role === 'storeman';

  return (
    <PlatformSafeAreaView style={styles.container} gradientHeader>
      {/* Header */}
      <ModernHeader
        title={`Order #${orderNumber}`}
        subtitle={`${order.items?.length || 0} item${(order.items?.length || 0) !== 1 ? 's' : ''}`}
        leftButton={{
          icon: <ArrowLeft size={24} color="#FFFFFF" />, 
          onPress: handleBackPress
        }}
        rightButton={{
          icon: <Download size={20} color="#FFFFFF" />, 
          onPress: handleDownloadInvoice
        }}
        variant="gradient"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order Status */}
        <Animated.View entering={FadeInUp.delay(0).duration(600)} style={styles.statusCard}>
          <View style={[styles.statusHeader, { backgroundColor: statusInfo.bgColor }]}>
            <View style={styles.statusInfo}>
              {statusInfo.icon}
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
                <Text style={styles.statusDescription}>{statusInfo.description}</Text>
              </View>
            </View>
            
            {isUrgent && (
              <View style={styles.urgentBadge}>
                <Star size={16} color="#ef4444" />
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </View>
          
          {canUpdateStatus && (
            <TouchableOpacity
              style={styles.updateStatusButton}
              onPress={() => setShowStatusModal(true)}
            >
              <Edit3 size={16} color="#667eea" />
              <Text style={styles.updateStatusText}>Update Status</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Order Summary */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.summaryCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Order Total</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(total)}</Text>
            </View>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Calendar size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.summaryText}>Ordered: {formatDate(orderDate || new Date().toISOString())}</Text>
              </View>
              {order.deliveryDate && (
                <View style={styles.summaryRow}>
                  <Truck size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.summaryText}>Delivery: {formatDate(order.deliveryDate)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Building size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.summaryText}>Branch: {branchName}</Text>
              </View>
              {order.PO_Number && (
                <View style={styles.summaryRow}>
                  <FileText size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.summaryText}>PO: {order.PO_Number}</Text>
                </View>
              )}
              {companyName && (
                <View style={styles.summaryRow}>
                  <Building size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.summaryText}>Company: {companyName}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Customer Information */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.customerCard}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfo}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.customerIcon}
            >
              <User size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{retailerName}</Text>
              {contactPerson && contactPerson !== '0' && (
                <Text style={styles.contactName}>{contactPerson}</Text>
              )}
              {order.Retailer_Email && order.Retailer_Email !== '0' && (
                <View style={styles.contactRow}>
                  <Mail size={14} color="#64748b" />
                  <Text style={styles.contactText}>{order.Retailer_Email}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Item Picking Interface (for Storeman when order is in Processing status) */}
        {showPickingInterface && order.items && (
          <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.pickingCard}>
            <Text style={styles.sectionTitle}>Pick Items</Text>
            <OrderItemPicker 
              items={order.items} 
              onItemPick={handleItemPick} 
            />
            
            <View style={styles.pickingActions}>
              <ModernButton
                title="Mark All as Picked"
                onPress={() => {
                  if (!order.items) return;
                  const updatedItems = order.items.map(item => ({ 
                    ...item, 
                    picked: true,
                    pickedQuantity: item.quantity
                  }));
                  setOrder(prev => prev ? { ...prev, items: updatedItems } : null);
                }}
                variant="outline"
                size="small"
                icon={<CheckCircle size={18} color="#10b981" />}
                style={{ flex: 1 }}
              />
              
              <ModernButton
                title="Update to Picked"
                onPress={() => {
                  if (areAllItemsPicked()) {
                    setShowStatusModal(true);
                  } else {
                    showToast('All items must be picked before changing status', 'warning');
                  }
                }}
                variant="primary"
                size="small"
                disabled={!areAllItemsPicked()}
                icon={<Package size={18} color="#FFFFFF" />}
                style={{ flex: 1 }}
              />
            </View>
          </Animated.View>
        )}

        {/* Order Items */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Order Items ({order.items?.length || 0})</Text>
          
          {/* Debug Information */}
         
          
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemImageContainer}>
                  {item.part?.image ? (
                    <Image source={{ uri: item.part.image }} style={styles.itemImage} />
                  ) : (
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.itemImagePlaceholder}
                    >
                      <Package size={20} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  {item.urgent && (
                    <View style={styles.itemUrgentBadge}>
                      <Star size={10} color="#ef4444" />
                    </View>
                  )}
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.partName || item.part?.name || item.Part_Name || 'Unknown Part'}
                  </Text>
                  <Text style={styles.itemNumber}>#{item.partNumber || item.Part_Admin}</Text>
                  
                  {item.part?.category && (
                    <Text style={styles.itemCategory}>{item.part.category}</Text>
                  )}
                  
                  {/* Picked Status */}
                  {item.picked && (
                    <View style={styles.pickedStatusContainer}>
                      <CheckCircle size={12} color="#10b981" />
                      <Text style={styles.pickedStatusText}>
                        Picked: {item.pickedQuantity || item.quantity}/{item.quantity}
                      </Text>
                    </View>
                  )}
                  
                  {/* Discount Information */}
                  {((item.basicDiscount || 0) + (item.schemeDiscount || 0) + (item.additionalDiscount || 0)) > 0 && (
                    <View style={styles.discountInfo}>
                      <Text style={styles.discountText}>
                        Discounts: {item.basicDiscount || 0}% + {item.schemeDiscount || 0}% + {item.additionalDiscount || 0}%
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.itemPricing}>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  <Text style={styles.itemUnitPrice}>{formatCurrency(item.unitPrice || item.MRP || 0)} each</Text>
                  <Text style={styles.itemTotalPrice}>{formatCurrency(item.totalPrice || item.ItemAmount || 0)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Package size={48} color="#94a3b8" />
              <Text style={{ fontSize: 16, color: '#64748b', marginTop: 12, textAlign: 'center' }}>
                No items found for this order
              </Text>
              <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                Items may not have been loaded or this order has no items
              </Text>
            </View>
          )}
          
          {/* Order Totals */}
          {order.items && order.items.length > 0 && (
            <View style={styles.orderTotals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (8%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.historyCard}>
            <Text style={styles.sectionTitle}>Status History</Text>
            {order.statusHistory.map((history, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  {getStatusInfo(history.status).icon}
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyStatus}>{getStatusInfo(history.status).text}</Text>
                  <Text style={styles.historyTime}>{formatDateTime(history.timestamp)}</Text>
                  <Text style={styles.historyUser}>by {history.updatedBy}</Text>
                  {history.notes && (
                    <Text style={styles.historyNotes}>{history.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Notes */}
        {(order.notes || order.Remark) && (
          <Animated.View entering={FadeInUp.delay(1000).duration(600)} style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes || order.Remark}</Text>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { marginBottom: 32 }]}> 
          {canEditOrder() && (
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => {
                // Use navigation replace to ensure the edit page loads correctly
                router.replace(`/(tabs)/orders/${order.id || order.Order_Id}?edit=true`);
              }}
            >
              <Edit3 size={18} color="#667eea" />
              <Text style={styles.actionButtonText}>Edit Order</Text>
            </TouchableOpacity>
          )}
          {canCancelOrder() && (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              activeOpacity={0.7}
              onPress={handleCancelOrder}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Status Update Modal */}
      <OrderStatusModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={order.Order_Status || ''}
        onUpdateStatus={handleUpdateStatus}
        isLoading={isUpdatingStatus}
      />

      {/* Add a bottom spacer to avoid overlap with bottom tab bar */}
      <View style={styles.bottomSpacer} />
    </PlatformSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  bottomSpacer: {
    height: 32, // Adjust as needed to match tab bar height
    backgroundColor: 'transparent',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusTextContainer: {
    marginLeft: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  updateStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  customerCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  customerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  pickingCard: {
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
  pickingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  itemsCard: {
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
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemImageContainer: {
    marginRight: 16,
    position: 'relative',
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
  itemUrgentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemNumber: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 4,
  },
  rackLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rackLocationText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  pickedStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pickedStatusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
  },
  discountInfo: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '600',
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemUnitPrice: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  orderTotals: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  grandTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  historyCard: {
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  historyUser: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  notesCard: {
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
  notesText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  dangerButton: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  dangerButtonText: {
    color: '#ef4444',
  },
});