import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { FilterModal } from '@/components/FilterModal';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Part } from '@/types/api';
import { 
  Package, 
  TriangleAlert as AlertTriangle, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Award, 
  Zap, 
  Search, 
  X, 
  Filter, 
  ShoppingCart, 
  Minus,
  Eye,
  CreditCard as Edit3,
  ArrowUpDown,
  DollarSign,
  Calendar,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { isTablet } from '@/hooks/useResponsiveStyles';
import { PlatformSafeAreaView } from '@/components/PlatformSafeAreaView';

const { width } = Dimensions.get('window');

interface CartItem {
  part: Part;
  quantity: number;
}

type FilterType = 'all' | 'low_stock' | 'high_demand' | 'new' | 'quick_order' | 'discounted';
type SortType = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'category' | 'date_desc';

export default function PartsScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('name_asc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const isTabletDevice = isTablet();

  const canManageParts = ['super_admin', 'admin', 'manager'].includes(user?.role || '');
  const canAddToCart = ['admin', 'manager', 'salesman'].includes(user?.role || '');

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [parts, searchQuery, selectedFilter, selectedSort]);

  const loadParts = async () => {
    try {
      setError(null);
      const response = await apiService.getParts({ limit: 100 });
      const partsData = response.parts || response.data || [];
      setParts(partsData);
    } catch (error: any) {
      setError(error.error || 'Failed to load parts');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadParts();
  };

  const applyFiltersAndSort = () => {
    let filtered = [...parts];

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (part) =>
          part.Part_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.Part_Number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.Part_Catagory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.Focus_Group.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'low_stock':
        filtered = filtered.filter(part => getStockStatus(part).isLowStock);
        break;
      case 'high_demand':
        filtered = filtered.filter(part => part.GuruPoint > 0 || part.ChampionPoint > 0);
        break;
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(part => new Date(part.created_at) > thirtyDaysAgo);
        break;
      case 'quick_order':
        filtered = filtered.filter(part => part.Is_Order_Pad === 1);
        break;
      case 'discounted':
        filtered = filtered.filter(part => 
          part.Part_BasicDisc > 0 || part.Part_SchemeDisc > 0 || part.Part_AdditionalDisc > 0
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'name_asc':
          return a.Part_Name.localeCompare(b.Part_Name);
        case 'name_desc':
          return b.Part_Name.localeCompare(a.Part_Name);
        case 'price_asc':
          return a.Part_Price - b.Part_Price;
        case 'price_desc':
          return b.Part_Price - a.Part_Price;
        case 'category':
          return a.Part_Catagory.localeCompare(b.Part_Catagory);
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredParts(filtered);
  };

  const getStockStatus = (part: Part) => {
    const mockCurrentStock = Math.floor(Math.random() * (part.Part_MinQty * 3)) + 1;
    const isLowStock = mockCurrentStock <= part.Part_MinQty;
    
    return {
      currentStock: mockCurrentStock,
      isLowStock,
      status: isLowStock ? 'Low Stock' : 'In Stock',
      color: isLowStock ? '#ef4444' : '#10b981',
      bgColor: isLowStock ? '#fee2e2' : '#dcfce7',
    };
  };

  const getPartBadges = (part: Part) => {
    const badges = [];
    
    if (part.GuruPoint > 0) {
      badges.push({
        icon: <Award size={isTabletDevice ? 14 : 12} color="#f59e0b" />,
        text: 'Guru',
        color: '#f59e0b',
        bgColor: '#fef3c7',
      });
    }
    
    if (part.ChampionPoint > 0) {
      badges.push({
        icon: <Star size={isTabletDevice ? 14 : 12} color="#8b5cf6" />,
        text: 'Champion',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
      });
    }
    
    if (part.Is_Order_Pad === 1) {
      badges.push({
        icon: <Zap size={isTabletDevice ? 14 : 12} color="#10b981" />,
        text: 'Quick Order',
        color: '#10b981',
        bgColor: '#dcfce7',
      });
    }
    
    return badges;
  };

  const getDiscountInfo = (part: Part) => {
    const totalDiscount = part.Part_BasicDisc + part.Part_SchemeDisc + part.Part_AdditionalDisc;
    if (totalDiscount > 0) {
      return {
        percentage: totalDiscount,
        finalPrice: part.Part_Price * (1 - totalDiscount / 100),
      };
    }
    return null;
  };

  const addToCart = (part: Part) => {
    const existingItem = cart.find(item => item.part.Part_Number === part.Part_Number);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.part.Part_Number === part.Part_Number
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { part, quantity: 1 }]);
    }
    
    showToast(`${part.Part_Name} added to cart`, 'success', 2000);
  };

  const updateCartQuantity = (partNumber: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.part.Part_Number !== partNumber));
    } else {
      setCart(cart.map(item =>
        item.part.Part_Number === partNumber
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const discountInfo = getDiscountInfo(item.part);
      const price = discountInfo ? discountInfo.finalPrice : item.part.Part_Price;
      return total + (price * item.quantity);
    }, 0);
  };

  const proceedToOrder = () => {
    if (cart.length === 0) {
      showToast('Please add items to your cart before proceeding', 'warning');
      return;
    }
    
    // Navigate to order creation with cart items
    router.push({
      pathname: '/(tabs)/orders/create',
      params: { cartItems: JSON.stringify(cart) }
    });
    setShowCart(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderPartItem = ({ item, index }: { item: Part; index: number }) => {
    const stockStatus = getStockStatus(item);
    const badges = getPartBadges(item);
    const discountInfo = getDiscountInfo(item);
    const cartItem = cart.find(cartItem => cartItem.part.Part_Number === item.Part_Number);
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
        <View style={[styles.partCard, isTabletDevice && styles.tabletPartCard]}>
          <TouchableOpacity
            style={styles.partContent}
            onPress={() => router.push(`/(tabs)/parts/${item.Part_Number}`)}
            activeOpacity={0.7}
          >
            <View style={styles.partHeader}>
              <View style={styles.partImageContainer}>
                {item.Part_Image ? (
                  <Image 
                    source={{ uri: item.Part_Image }} 
                    style={[styles.partImage, isTabletDevice && styles.tabletPartImage]} 
                  />
                ) : (
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={[styles.partImagePlaceholder, isTabletDevice && styles.tabletPartImagePlaceholder]}
                  >
                    <Package size={isTabletDevice ? 32 : 28} color="#FFFFFF" />
                  </LinearGradient>
                )}
                
                <View style={[
                  styles.stockIndicator, 
                  { backgroundColor: stockStatus.color },
                  isTabletDevice && styles.tabletStockIndicator
                ]}>
                  <Text style={[styles.stockIndicatorText, isTabletDevice && styles.tabletStockIndicatorText]}>
                    {stockStatus.currentStock}
                  </Text>
                </View>
              </View>
              
              <View style={styles.partInfo}>
                <Text 
                  style={[styles.partName, isTabletDevice && styles.tabletPartName]} 
                  numberOfLines={2}
                >
                  {item.Part_Name}
                </Text>
                <Text style={[styles.partNumber, isTabletDevice && styles.tabletPartNumber]}>
                  #{item.Part_Number}
                </Text>
                
                <View style={styles.categoryContainer}>
                  <View style={[styles.categoryBadge, isTabletDevice && styles.tabletCategoryBadge]}>
                    <Text style={[styles.categoryText, isTabletDevice && styles.tabletCategoryText]}>
                      {item.Part_Catagory}
                    </Text>
                  </View>
                  <View style={[styles.focusGroupBadge, isTabletDevice && styles.tabletFocusGroupBadge]}>
                    <Text style={[styles.focusGroupText, isTabletDevice && styles.tabletFocusGroupText]}>
                      {item.Focus_Group}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.badgesContainer}>
                  {badges.map((badge, badgeIndex) => (
                    <View
                      key={badgeIndex}
                      style={[
                        styles.badge, 
                        { backgroundColor: badge.bgColor },
                        isTabletDevice && styles.tabletBadge
                      ]}
                    >
                      {badge.icon}
                      <Text style={[
                        styles.badgeText, 
                        { color: badge.color },
                        isTabletDevice && styles.tabletBadgeText
                      ]}>
                        {badge.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.partPrice}>
                {discountInfo ? (
                  <View style={styles.discountPricing}>
                    <Text style={[styles.originalPrice, isTabletDevice && styles.tabletOriginalPrice]}>
                      {formatCurrency(item.Part_Price)}
                    </Text>
                    <Text style={[styles.discountedPrice, isTabletDevice && styles.tabletDiscountedPrice]}>
                      {formatCurrency(discountInfo.finalPrice)}
                    </Text>
                    <View style={[styles.discountBadge, isTabletDevice && styles.tabletDiscountBadge]}>
                      <Text style={[styles.discountText, isTabletDevice && styles.tabletDiscountText]}>
                        -{discountInfo.percentage}%
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.priceText, isTabletDevice && styles.tabletPriceText]}>
                    {formatCurrency(item.Part_Price)}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.partFooter}>
              <View style={styles.stockInfo}>
                <View style={[
                  styles.stockStatusBadge,
                  { backgroundColor: stockStatus.bgColor },
                  isTabletDevice && styles.tabletStockStatusBadge
                ]}>
                  {stockStatus.isLowStock && (
                    <AlertTriangle 
                      size={isTabletDevice ? 16 : 14} 
                      color={stockStatus.color} 
                      style={styles.stockIcon} 
                    />
                  )}
                  <Text style={[
                    styles.stockText, 
                    { color: stockStatus.color },
                    isTabletDevice && styles.tabletStockText
                  ]}>
                    {stockStatus.status}
                  </Text>
                </View>
                
                <Text style={[styles.minQtyText, isTabletDevice && styles.tabletMinQtyText]}>
                  Min Qty: {item.Part_MinQty}
                </Text>
              </View>
              
              {item.Part_Application && item.Part_Application !== '0' && (
                <View style={styles.applicationInfo}>
                  <Text style={[styles.applicationLabel, isTabletDevice && styles.tabletApplicationLabel]}>
                    Compatible:
                  </Text>
                  <Text 
                    style={[styles.applicationText, isTabletDevice && styles.tabletApplicationText]} 
                    numberOfLines={2}
                  >
                    {item.Part_Application}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.viewButton, isTabletDevice && styles.tabletViewButton]}
              onPress={() => router.push(`/(tabs)/parts/${item.Part_Number}`)}
            >
              <Eye size={isTabletDevice ? 20 : 16} color="#667eea" />
              <Text style={[styles.viewButtonText, isTabletDevice && styles.tabletViewButtonText]}>
                View
              </Text>
            </TouchableOpacity>

            {canManageParts && (
              <TouchableOpacity
                style={[styles.editButton, isTabletDevice && styles.tabletEditButton]}
                onPress={() => router.push(`/(tabs)/parts/${item.Part_Number}?edit=true`)}
              >
                <Edit3 size={isTabletDevice ? 20 : 16} color="#059669" />
                <Text style={[styles.editButtonText, isTabletDevice && styles.tabletEditButtonText]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}

            {canAddToCart && (
              <View style={styles.cartControls}>
                {cartItem ? (
                  <View style={[styles.quantityControls, isTabletDevice && styles.tabletQuantityControls]}>
                    <TouchableOpacity
                      style={[styles.quantityButton, isTabletDevice && styles.tabletQuantityButton]}
                      onPress={() => updateCartQuantity(item.Part_Number, cartItem.quantity - 1)}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Minus size={isTabletDevice ? 20 : 16} color="#667eea" />
                    </TouchableOpacity>
                    
                    <Text style={[styles.quantityText, isTabletDevice && styles.tabletQuantityText]}>
                      {cartItem.quantity}
                    </Text>
                    
                    <TouchableOpacity
                      style={[styles.quantityButton, isTabletDevice && styles.tabletQuantityButton]}
                      onPress={() => updateCartQuantity(item.Part_Number, cartItem.quantity + 1)}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Plus size={isTabletDevice ? 20 : 16} color="#667eea" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.addToCartButton, isTabletDevice && styles.tabletAddToCartButton]}
                    onPress={() => addToCart(item)}
                  >
                    <ShoppingCart size={isTabletDevice ? 20 : 16} color="#FFFFFF" />
                    <Text style={[styles.addToCartText, isTabletDevice && styles.tabletAddToCartText]}>
                      Add
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderStats = () => {
    const totalParts = parts.length;
    const lowStockParts = parts.filter(p => getStockStatus(p).isLowStock).length;
    const highDemandParts = parts.filter(p => p.GuruPoint > 0 || p.ChampionPoint > 0).length;
    const quickOrderParts = parts.filter(p => p.Is_Order_Pad === 1).length;
    
    return (
      <View style={[styles.statsContainer, isTabletDevice && styles.tabletStatsContainer]}>
        <View style={styles.statCard}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statGradient}>
            <Package size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
            <Text style={[styles.statNumber, isTabletDevice && styles.tabletStatNumber]}>
              {totalParts}
            </Text>
            <Text style={[styles.statLabel, isTabletDevice && styles.tabletStatLabel]}>
              Total Parts
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.statGradient}>
            <AlertTriangle size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
            <Text style={[styles.statNumber, isTabletDevice && styles.tabletStatNumber]}>
              {lowStockParts}
            </Text>
            <Text style={[styles.statLabel, isTabletDevice && styles.tabletStatLabel]}>
              Low Stock
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statGradient}>
            <TrendingUp size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
            <Text style={[styles.statNumber, isTabletDevice && styles.tabletStatNumber]}>
              {highDemandParts}
            </Text>
            <Text style={[styles.statLabel, isTabletDevice && styles.tabletStatLabel]}>
              High Demand
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
            <Zap size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
            <Text style={[styles.statNumber, isTabletDevice && styles.tabletStatNumber]}>
              {quickOrderParts}
            </Text>
            <Text style={[styles.statLabel, isTabletDevice && styles.tabletStatLabel]}>
              Quick Order
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const filterOptions = [
    { key: 'all', label: 'All Parts', icon: Package, count: parts.length },
    { key: 'low_stock', label: 'Low Stock', icon: AlertTriangle, count: parts.filter(p => getStockStatus(p).isLowStock).length },
    { key: 'high_demand', label: 'High Demand', icon: TrendingUp, count: parts.filter(p => p.GuruPoint > 0 || p.ChampionPoint > 0).length },
    { key: 'new', label: 'New Parts', icon: Star, count: parts.filter(p => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(p.created_at) > thirtyDaysAgo;
    }).length },
    { key: 'quick_order', label: 'Quick Order', icon: Zap, count: parts.filter(p => p.Is_Order_Pad === 1).length },
    { key: 'discounted', label: 'Discounted', icon: DollarSign, count: parts.filter(p => p.Part_BasicDisc > 0 || p.Part_SchemeDisc > 0 || p.Part_AdditionalDisc > 0).length },
  ];

  const sortOptions = [
    { key: 'name_asc', label: 'Name (A-Z)', icon: ArrowUpDown },
    { key: 'name_desc', label: 'Name (Z-A)', icon: ArrowUpDown },
    { key: 'price_asc', label: 'Price (Low to High)', icon: TrendingUp },
    { key: 'price_desc', label: 'Price (High to Low)', icon: TrendingDown },
    { key: 'category', label: 'Category', icon: Package },
    { key: 'date_desc', label: 'Newest First', icon: Calendar },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading parts..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadParts} />;
  }

  return (
    <PlatformSafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" translucent={true} />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.headerGradient, isTabletDevice && styles.tabletHeaderGradient]}
        >
          <View style={styles.headerContent}>
            <HamburgerMenu />
            
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, isTabletDevice && styles.tabletHeaderTitle]}>
                {user?.role === 'retailer' ? 'Parts Catalog' : 'Parts Management'}
              </Text>
              <Text style={[styles.headerSubtitle, isTabletDevice && styles.tabletHeaderSubtitle]}>
                {filteredParts.length} part{filteredParts.length !== 1 ? 's' : ''} available
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              {canAddToCart && cart.length > 0 && (
                <TouchableOpacity
                  style={[styles.cartButton, isTabletDevice && styles.tabletCartButton]}
                  onPress={() => setShowCart(true)}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <ShoppingCart size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                  <View style={[styles.cartBadge, isTabletDevice && styles.tabletCartBadge]}>
                    <Text style={[styles.cartBadgeText, isTabletDevice && styles.tabletCartBadgeText]}>
                      {cart.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              
              {canManageParts && (
                <TouchableOpacity
                  style={[styles.addButton, isTabletDevice && styles.tabletAddButton]}
                  onPress={() => router.push('/(tabs)/parts/add')}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Plus size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Stats */}
      {renderStats()}

      {/* Search and Filter */}
      <View style={[styles.searchContainer, isTabletDevice && styles.tabletSearchContainer]}>
        <View style={[styles.searchBar, isTabletDevice && styles.tabletSearchBar]}>
          <Search size={isTabletDevice ? 24 : 20} color="#94a3b8" />
          <TextInput
            style={[styles.searchInput, isTabletDevice && styles.tabletSearchInput]}
            placeholder="Search parts by name, number, category..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <X size={isTabletDevice ? 24 : 20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            (selectedFilter !== 'all' || selectedSort !== 'name_asc') && styles.filterButtonActive,
            isTabletDevice && styles.tabletFilterButton
          ]}
          onPress={() => setShowFilterModal(true)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Filter 
            size={isTabletDevice ? 24 : 20} 
            color={(selectedFilter !== 'all' || selectedSort !== 'name_asc') ? "#FFFFFF" : "#667eea"} 
          />
          {(selectedFilter !== 'all' || selectedSort !== 'name_asc') && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      </View>

      {/* Parts List */}
      <FlatList
        data={filteredParts}
        renderItem={renderPartItem}
        keyExtractor={(item) => item.Part_Number}
        contentContainerStyle={[
          styles.listContent, 
          isTabletDevice && styles.tabletListContent,
          filteredParts.length === 0 && styles.emptyListContent
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
              <Package size={isTabletDevice ? 64 : 48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, isTabletDevice && styles.tabletEmptyTitle]}>
              {searchQuery ? 'No parts found' : 'No parts available'}
            </Text>
            <Text style={[styles.emptySubtitle, isTabletDevice && styles.tabletEmptySubtitle]}>
              {searchQuery
                ? 'Try adjusting your search terms or filters'
                : 'Parts catalog is empty'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter & Sort Parts"
        filters={filterOptions}
        sorts={sortOptions}
        selectedFilter={selectedFilter}
        selectedSort={selectedSort}
        onFilterSelect={(filter) => setSelectedFilter(filter as FilterType)}
        onSortSelect={(sort) => setSelectedSort(sort as SortType)}
      />
    </PlatformSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 0,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  tabletHeaderGradient: {
    paddingHorizontal: 32,
    paddingBottom: 28,
    paddingTop: Platform.OS === 'ios' ? 16 : 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tabletHeaderTitle: {
    fontSize: 28,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabletHeaderSubtitle: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  tabletCartButton: {
    padding: 10,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletCartBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabletCartBadgeText: {
    fontSize: 14,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletAddButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  tabletStatsContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 16,
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
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 2,
  },
  tabletStatNumber: {
    fontSize: 20,
    marginTop: 8,
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
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
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
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  tabletListContent: {
    paddingHorizontal: 32,
    paddingBottom: 180,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  partCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  tabletPartCard: {
    borderRadius: 24,
    marginVertical: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  partContent: {
    padding: 20,
  },
  partHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  partImageContainer: {
    marginRight: 16,
    position: 'relative',
  },
  partImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  tabletPartImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  partImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletPartImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  stockIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tabletStockIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
  },
  stockIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabletStockIndicatorText: {
    fontSize: 12,
  },
  partInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  partName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 24,
  },
  tabletPartName: {
    fontSize: 22,
    marginBottom: 8,
    lineHeight: 28,
  },
  partNumber: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  tabletPartNumber: {
    fontSize: 16,
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tabletCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  tabletCategoryText: {
    fontSize: 14,
  },
  focusGroupBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tabletFocusGroupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  focusGroupText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  tabletFocusGroupText: {
    fontSize: 14,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  tabletBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabletBadgeText: {
    fontSize: 12,
  },
  partPrice: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#059669',
  },
  tabletPriceText: {
    fontSize: 26,
  },
  discountPricing: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  tabletOriginalPrice: {
    fontSize: 16,
    marginBottom: 4,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  tabletDiscountedPrice: {
    fontSize: 24,
    marginBottom: 6,
  },
  discountBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tabletDiscountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  tabletDiscountText: {
    fontSize: 12,
  },
  partFooter: {
    marginBottom: 16,
  },
  stockInfo: {
    marginBottom: 12,
  },
  stockStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tabletStockStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 6,
  },
  stockIcon: {
    marginRight: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabletStockText: {
    fontSize: 14,
  },
  minQtyText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  tabletMinQtyText: {
    fontSize: 13,
  },
  applicationInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  applicationLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  tabletApplicationLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  applicationText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  tabletApplicationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    gap: 6,
  },
  tabletViewButton: {
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  viewButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  tabletViewButtonText: {
    fontSize: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    gap: 6,
  },
  tabletEditButton: {
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  editButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  tabletEditButtonText: {
    fontSize: 16,
  },
  cartControls: {
    flex: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tabletQuantityControls: {
    gap: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletQuantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    minWidth: 30,
    textAlign: 'center',
  },
  tabletQuantityText: {
    fontSize: 18,
    minWidth: 36,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#667eea',
    borderRadius: 12,
    gap: 6,
  },
  tabletAddToCartButton: {
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabletAddToCartText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  tabletEmptyState: {
    paddingVertical: 120,
    paddingHorizontal: 40,
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
    fontSize: 30,
    marginBottom: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  tabletEmptySubtitle: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 500,
  },
});