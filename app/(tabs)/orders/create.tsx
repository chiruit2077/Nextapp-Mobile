import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Plus,
  Minus,
  Trash2,
  Package,
  ShoppingCart,
  User,
  Search,
  X,
  Check,
  ArrowLeft,
  Building,
  CreditCard,
  FileText,
  Save,
  Store,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { isTablet } from '@/hooks/useResponsiveStyles';
import { PlatformSafeAreaView } from '@/components/PlatformSafeAreaView';

const { width, height } = Dimensions.get('window');

interface Part {
  partNumber: string;
  name: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  image?: string;
  Part_Number?: string;
  Part_Name?: string;
  Part_Price?: number;
  Part_Catagory?: string;
  Part_Image?: string;
}

interface Retailer {
  Retailer_Id: number;
  Retailer_Name: string;
  Contact_Person?: string;
  Retailer_Email?: string;
  Credit_Limit: string;
}

interface Store {
  Branch_Code?: string;
  Branch_Name?: string;
  branchCode?: string;
  name?: string;
  companyId?: string;
  Company_Name?: string;
  Branch_Address?: string;
  Branch_Phone?: string;
  Branch_Email?: string;
  Branch_Manager?: string;
  address?: string;
}

interface OrderItem {
  part: Part;
  quantity: number;
  totalPrice: number;
}

type CreateOrderStep = 'store' | 'retailer' | 'parts' | 'review';

export default function CreateOrderScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { cartItems } = useLocalSearchParams<{ cartItems?: string }>();
  
  const [step, setStep] = useState<CreateOrderStep>('store');
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTabletDevice = isTablet();

  // Order details
  const [poNumber, setPONumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  // Check if user needs to select a store
  const needsStoreSelection = ['super_admin', 'admin', 'manager'].includes(user?.role || '');

  useEffect(() => {
    // Initialize with cart items if provided
    if (cartItems) {
      try {
        const parsedCartItems = JSON.parse(cartItems);
        const convertedItems = parsedCartItems.map((item: any) => ({
          part: {
            partNumber: item.part.Part_Number,
            name: item.part.Part_Name,
            category: item.part.Part_Catagory,
            unitPrice: item.part.Part_Price,
            currentStock: Math.floor(Math.random() * 100) + 10,
            image: item.part.Part_Image,
            Part_Number: item.part.Part_Number,
            Part_Name: item.part.Part_Name,
            Part_Price: item.part.Part_Price,
            Part_Catagory: item.part.Part_Catagory,
            Part_Image: item.part.Part_Image,
          },
          quantity: item.quantity,
          totalPrice: item.part.Part_Price * item.quantity,
        }));
        setOrderItems(convertedItems);
      } catch (error) {
        console.error('Failed to parse cart items:', error);
      }
    }

    // For non-admin users, set the store from their profile
    if (!needsStoreSelection && user?.storeId) {
      setSelectedStore({
        branchCode: user.storeId,
        name: `Store ${user.storeId}`,
        companyId: user.companyId,
      });
      setStep('retailer');
    }
  }, [cartItems, user, needsStoreSelection]);

  useEffect(() => {
    if (step === 'store') {
      loadStores();
    } else if (step === 'retailer') {
      loadRetailers();
    } else if (step === 'parts') {
      loadParts();
    }
  }, [step]);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let storesData = [];
      
      if (user?.companyId) {
        // If user has a company ID, load stores for that company
        const response = await apiService.getStoresByCompany(user.companyId);
        storesData = response.stores || [];
      } else {
        // Otherwise load all stores
        const response = await apiService.getStores();
        storesData = response.stores || response.data || [];
      }
      
      console.log('🏪 Loaded stores:', storesData);
      
      // Map the API response to our Store interface
      const mappedStores = storesData.map((store: any) => ({
        branchCode: store.Branch_Code,
        name: store.Branch_Name,
        companyId: store.company_id,
        address: store.Branch_Address,
        Branch_Code: store.Branch_Code,
        Branch_Name: store.Branch_Name,
        Company_Name: store.Company_Name,
        Branch_Address: store.Branch_Address,
        Branch_Phone: store.Branch_Phone,
        Branch_Email: store.Branch_Email,
        Branch_Manager: store.Branch_Manager,
      }));
      
      setStores(mappedStores);
    } catch (error: any) {
      setError(error.error || 'Failed to load stores');
      console.error('Failed to load stores:', error);
      
      // Fallback to mock stores if API fails
      const mockStores = [
        { branchCode: '2081380', name: 'Surat', address: 'Opp. Sanjivani Hospital, NH8, Kadodara, Surat, Gujarat' },
        { branchCode: '2081381', name: 'Vapi', address: '6,7 GF-Wala Chambers, Nr. Swaminarayan School, NH8, salvav, vapi-396195, Gujarat' },
        { branchCode: '2081382', name: 'Baroda', address: 'Opp. L&T Ltd, NH8, Ranoli-Padamla Highway, Padamla, Vadodara-391350, Gujarat' },
      ];
      setStores(mockStores);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRetailers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getRetailers({ limit: 100 });
      const retailerData = response.retailers || response.data || [];
      setRetailers(retailerData);
    } catch (error: any) {
      setError(error.error || 'Failed to load retailers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadParts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getParts({ limit: 100 });
      const partsData = response.parts || response.data || [];
      
      // Convert API parts to our interface
      const convertedParts = partsData.map((part: any) => ({
        partNumber: part.Part_Number,
        name: part.Part_Name,
        category: part.Part_Catagory,
        unitPrice: part.Part_Price,
        currentStock: Math.floor(Math.random() * 100) + 10,
        image: part.Part_Image,
        Part_Number: part.Part_Number,
        Part_Name: part.Part_Name,
        Part_Price: part.Part_Price,
        Part_Catagory: part.Part_Catagory,
        Part_Image: part.Part_Image,
      }));
      
      setParts(convertedParts);
    } catch (error: any) {
      setError(error.error || 'Failed to load parts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setStep('retailer');
  };

  const handleRetailerSelect = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    if (orderItems.length > 0) {
      setStep('review');
    } else {
      setStep('parts');
    }
  };

  const addToOrder = (part: Part) => {
    const existingItem = orderItems.find(item => 
      item.part.partNumber === part.partNumber || 
      item.part.Part_Number === part.Part_Number
    );
    
    if (existingItem) {
      updateQuantity(part.partNumber || part.Part_Number || '', existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        part,
        quantity: 1,
        totalPrice: part.unitPrice || part.Part_Price || 0,
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateQuantity = (partNumber: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(partNumber);
      return;
    }

    setOrderItems(items =>
      items.map(item =>
        (item.part.partNumber === partNumber || item.part.Part_Number === partNumber)
          ? { 
              ...item, 
              quantity: newQuantity, 
              totalPrice: (item.part.unitPrice || item.part.Part_Price || 0) * newQuantity 
            }
          : item
      )
    );
  };

  const removeFromOrder = (partNumber: string) => {
    setOrderItems(items => items.filter(item => 
      item.part.partNumber !== partNumber && item.part.Part_Number !== partNumber
    ));
  };

  const getOrderTotal = () => {
    return orderItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSubmitOrder = async () => {
    if (!selectedRetailer || !selectedStore || orderItems.length === 0) {
      showToast('Please select a retailer, store, and add items to the order', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        retailer_id: selectedRetailer.Retailer_Id,
        branch: selectedStore.branchCode || selectedStore.Branch_Code,
        po_number: poNumber || `PO-${Date.now()}`,
        po_date: new Date().toISOString(),
        urgent: isUrgent,
        remark: notes || 'Order created via mobile app',
        items: orderItems.map(item => ({
          part_number: item.part.partNumber || item.part.Part_Number,
          part_name: item.part.name || item.part.Part_Name,
          quantity: item.quantity,
          mrp: item.part.unitPrice || item.part.Part_Price,
          basic_discount: 0,
          scheme_discount: 0,
          additional_discount: 0,
          urgent: false,
        })),
      };

      await apiService.createOrder(orderData);
      
      showToast('Order created successfully!', 'success');
      
      // Navigate back to orders list after a short delay
      setTimeout(() => {
        router.replace('/(tabs)/orders');
      }, 1500);
      
    } catch (error: any) {
      showToast(error.error || 'Failed to create order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackPress = () => {
    switch (step) {
      case 'retailer':
        if (needsStoreSelection) {
          setStep('store');
        } else {
          router.back();
        }
        setSearchQuery('');
        break;
      case 'parts':
        setStep('retailer');
        setSearchQuery('');
        break;
      case 'review':
        setStep(orderItems.length > 0 ? 'parts' : 'retailer');
        break;
      default:
        router.back();
    }
  };

  const renderStoreStep = () => {
    const filteredStores = stores.filter(store =>
      (store.name && store.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.Branch_Name && store.Branch_Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.branchCode && store.branchCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.Branch_Code && store.Branch_Code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.address && store.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (store.Branch_Address && store.Branch_Address.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <View style={styles.stepContainer}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, isTabletDevice && styles.tabletSearchContainer]}>
          <View style={[styles.searchBar, isTabletDevice && styles.tabletSearchBar]}>
            <Search size={isTabletDevice ? 24 : 20} color="#94a3b8" />
            <TextInput
              style={[styles.searchInput, isTabletDevice && styles.tabletSearchInput]}
              placeholder="Search stores..."
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
        </View>

        <FlatList
          data={filteredStores}
          keyExtractor={(item) => item.branchCode || item.Branch_Code || Math.random().toString()}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 100).duration(600)}>
              <TouchableOpacity
                style={[styles.storeCard, isTabletDevice && styles.tabletStoreCard]}
                onPress={() => handleStoreSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.storeInfo}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={[styles.storeIcon, isTabletDevice && styles.tabletStoreIcon]}
                  >
                    <Store size={isTabletDevice ? 32 : 24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.storeDetails}>
                    <Text style={[styles.storeName, isTabletDevice && styles.tabletStoreName]}>
                      {item.name || item.Branch_Name}
                    </Text>
                    <Text style={[styles.storeCode, isTabletDevice && styles.tabletStoreCode]}>
                      Branch Code: {item.branchCode || item.Branch_Code}
                    </Text>
                    {(item.address || item.Branch_Address) && (
                      <Text 
                        style={[styles.storeAddress, isTabletDevice && styles.tabletStoreAddress]}
                        numberOfLines={2}
                      >
                        {item.address || item.Branch_Address}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.selectButton, isTabletDevice && styles.tabletSelectButton]}>
                    <Check size={isTabletDevice ? 24 : 20} color="#10b981" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={[
            styles.listContent, 
            isTabletDevice && styles.tabletListContent,
            filteredStores.length === 0 && styles.emptyListContent
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.emptyState, isTabletDevice && styles.tabletEmptyState]}>
              <Text style={[styles.emptyTitle, isTabletDevice && styles.tabletEmptyTitle]}>
                {searchQuery ? 'No stores found' : 'No stores available'}
              </Text>
              <Text style={[styles.emptySubtitle, isTabletDevice && styles.tabletEmptySubtitle]}>
                {searchQuery ? 'Try adjusting your search terms' : 'Please add stores to continue'}
              </Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderRetailerStep = () => {
    const filteredRetailers = retailers.filter(retailer =>
      retailer.Retailer_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (retailer.Contact_Person && retailer.Contact_Person.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <View style={styles.stepContainer}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, isTabletDevice && styles.tabletSearchContainer]}>
          <View style={[styles.searchBar, isTabletDevice && styles.tabletSearchBar]}>
            <Search size={isTabletDevice ? 24 : 20} color="#94a3b8" />
            <TextInput
              style={[styles.searchInput, isTabletDevice && styles.tabletSearchInput]}
              placeholder="Search retailers..."
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
        </View>

        <FlatList
          data={filteredRetailers}
          keyExtractor={(item) => item.Retailer_Id.toString()}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 100).duration(600)}>
              <TouchableOpacity
                style={[styles.retailerCard, isTabletDevice && styles.tabletRetailerCard]}
                onPress={() => handleRetailerSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.retailerInfo}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={[styles.retailerIcon, isTabletDevice && styles.tabletRetailerIcon]}
                  >
                    <User size={isTabletDevice ? 32 : 24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.retailerDetails}>
                    <Text style={[styles.retailerName, isTabletDevice && styles.tabletRetailerName]}>
                      {item.Retailer_Name}
                    </Text>
                    {item.Contact_Person && item.Contact_Person !== '0' && (
                      <Text style={[styles.contactPerson, isTabletDevice && styles.tabletContactPerson]}>
                        {item.Contact_Person}
                      </Text>
                    )}
                    <Text style={[styles.creditLimit, isTabletDevice && styles.tabletCreditLimit]}>
                      Credit Limit: {formatCurrency(parseFloat(item.Credit_Limit))}
                    </Text>
                  </View>
                  <View style={[styles.selectButton, isTabletDevice && styles.tabletSelectButton]}>
                    <Check size={isTabletDevice ? 24 : 20} color="#667eea" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={[
            styles.listContent, 
            isTabletDevice && styles.tabletListContent,
            filteredRetailers.length === 0 && styles.emptyListContent
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.emptyState, isTabletDevice && styles.tabletEmptyState]}>
              <Text style={[styles.emptyTitle, isTabletDevice && styles.tabletEmptyTitle]}>
                {searchQuery ? 'No retailers found' : 'No retailers available'}
              </Text>
              <Text style={[styles.emptySubtitle, isTabletDevice && styles.tabletEmptySubtitle]}>
                {searchQuery ? 'Try adjusting your search terms' : 'Please add retailers to continue'}
              </Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderPartsStep = () => {
    const filteredParts = parts.filter(part =>
      (part.name && part.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (part.Part_Name && part.Part_Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (part.partNumber && part.partNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (part.Part_Number && part.Part_Number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (part.category && part.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (part.Part_Catagory && part.Part_Catagory.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <View style={styles.stepContainer}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, isTabletDevice && styles.tabletSearchContainer]}>
          <View style={[styles.searchBar, isTabletDevice && styles.tabletSearchBar]}>
            <Search size={isTabletDevice ? 24 : 20} color="#94a3b8" />
            <TextInput
              style={[styles.searchInput, isTabletDevice && styles.tabletSearchInput]}
              placeholder="Search parts..."
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
        </View>

        <FlatList
          data={filteredParts}
          keyExtractor={(item) => item.partNumber || item.Part_Number || Math.random().toString()}
          renderItem={({ item, index }) => {
            const partNumber = item.partNumber || item.Part_Number || '';
            const orderItem = orderItems.find(oi => 
              oi.part.partNumber === partNumber || 
              oi.part.Part_Number === partNumber
            );
            const quantity = orderItem?.quantity || 0;

            return (
              <Animated.View entering={FadeInUp.delay(index * 100).duration(600)}>
                <View style={[styles.partCard, isTabletDevice && styles.tabletPartCard]}>
                  <View style={styles.partHeader}>
                    <View style={[styles.partImageContainer, isTabletDevice && styles.tabletPartImageContainer]}>
                      {(item.image || item.Part_Image) ? (
                        <Image 
                          source={{ uri: item.image || item.Part_Image }} 
                          style={[styles.partImage, isTabletDevice && styles.tabletPartImage]} 
                        />
                      ) : (
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={[styles.partImagePlaceholder, isTabletDevice && styles.tabletPartImagePlaceholder]}
                        >
                          <Package size={isTabletDevice ? 36 : 28} color="#FFFFFF" />
                        </LinearGradient>
                      )}
                    </View>
                    
                    <View style={styles.partInfo}>
                      <Text 
                        style={[styles.partName, isTabletDevice && styles.tabletPartName]} 
                        numberOfLines={2}
                      >
                        {item.name || item.Part_Name}
                      </Text>
                      <Text style={[styles.partNumber, isTabletDevice && styles.tabletPartNumber]}>
                        #{item.partNumber || item.Part_Number}
                      </Text>
                      
                      <View style={styles.categoryContainer}>
                        <View style={[styles.categoryBadge, isTabletDevice && styles.tabletCategoryBadge]}>
                          <Text style={[styles.categoryText, isTabletDevice && styles.tabletCategoryText]}>
                            {item.category || item.Part_Catagory}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.partStock, isTabletDevice && styles.tabletPartStock]}>
                        {Math.floor(Math.random() * 100) + 10} in stock
                      </Text>
                    </View>
                    
                    <View style={styles.partPrice}>
                      <Text style={[styles.priceText, isTabletDevice && styles.tabletPriceText]}>
                        {formatCurrency(item.unitPrice || item.Part_Price || 0)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.partActions}>
                    {quantity > 0 ? (
                      <View style={[styles.quantityControls, isTabletDevice && styles.tabletQuantityControls]}>
                        <TouchableOpacity
                          style={[styles.quantityButton, isTabletDevice && styles.tabletQuantityButton]}
                          onPress={() => updateQuantity(partNumber, quantity - 1)}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                          <Minus size={isTabletDevice ? 20 : 16} color="#667eea" />
                        </TouchableOpacity>
                        
                        <Text style={[styles.quantityText, isTabletDevice && styles.tabletQuantityText]}>
                          {quantity}
                        </Text>
                        
                        <TouchableOpacity
                          style={[styles.quantityButton, isTabletDevice && styles.tabletQuantityButton]}
                          onPress={() => updateQuantity(partNumber, quantity + 1)}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                          <Plus size={isTabletDevice ? 20 : 16} color="#667eea" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.removeButton, isTabletDevice && styles.tabletRemoveButton]}
                          onPress={() => removeFromOrder(partNumber)}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                          <Trash2 size={isTabletDevice ? 20 : 16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.addButton, isTabletDevice && styles.tabletAddButton]}
                        onPress={() => addToOrder(item)}
                      >
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          style={[styles.addButtonGradient, isTabletDevice && styles.tabletAddButtonGradient]}
                        >
                          <Plus size={isTabletDevice ? 20 : 16} color="#FFFFFF" />
                          <Text style={[styles.addButtonText, isTabletDevice && styles.tabletAddButtonText]}>
                            Add to Order
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          }}
          contentContainerStyle={[
            styles.listContent, 
            isTabletDevice && styles.tabletListContent,
            filteredParts.length === 0 && styles.emptyListContent
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.emptyState, isTabletDevice && styles.tabletEmptyState]}>
              <Text style={[styles.emptyTitle, isTabletDevice && styles.tabletEmptyTitle]}>
                {searchQuery ? 'No parts found' : 'No parts available'}
              </Text>
              <Text style={[styles.emptySubtitle, isTabletDevice && styles.tabletEmptySubtitle]}>
                {searchQuery ? 'Try adjusting your search terms' : 'Parts will appear here once added'}
              </Text>
            </View>
          }
        />

        {orderItems.length > 0 && (
          <View style={[
            styles.orderSummary, 
            isTabletDevice && styles.tabletOrderSummary,
            Platform.OS === 'ios' && styles.iosOrderSummary
          ]}>
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <View style={styles.summaryHeader}>
                <Text style={[styles.summaryTitle, isTabletDevice && styles.tabletSummaryTitle]}>
                  Order Summary
                </Text>
                <Text style={[styles.summaryTotal, isTabletDevice && styles.tabletSummaryTotal]}>
                  {formatCurrency(getOrderTotal())}
                </Text>
              </View>
              <Text style={[styles.summaryItems, isTabletDevice && styles.tabletSummaryItems]}>
                {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} • {orderItems.reduce((sum, item) => sum + item.quantity, 0)} total quantity
              </Text>
              <TouchableOpacity
                style={[styles.reviewButton, isTabletDevice && styles.tabletReviewButton]}
                onPress={() => setStep('review')}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={[styles.reviewButtonGradient, isTabletDevice && styles.tabletReviewButtonGradient]}
                >
                  <Text style={[styles.reviewButtonText, isTabletDevice && styles.tabletReviewButtonText]}>
                    Review Order
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderReviewStep = () => {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.stepContainer} 
          contentContainerStyle={[
            styles.reviewContent,
            isTabletDevice && styles.tabletReviewContent
          ]}
        >
          {/* Store Info */}
          <Animated.View entering={FadeInUp.delay(0).duration(600)}>
            <View style={[styles.reviewCard, isTabletDevice && styles.tabletReviewCard]}>
              <Text style={[styles.reviewSectionTitle, isTabletDevice && styles.tabletReviewSectionTitle]}>
                Store
              </Text>
              <View style={styles.storeReview}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={[styles.storeIcon, isTabletDevice && styles.tabletStoreIcon]}
                >
                  <Store size={isTabletDevice ? 32 : 24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.storeDetails}>
                  <Text style={[styles.storeName, isTabletDevice && styles.tabletStoreName]}>
                    {selectedStore?.name || selectedStore?.Branch_Name}
                  </Text>
                  <Text style={[styles.storeCode, isTabletDevice && styles.tabletStoreCode]}>
                    Branch Code: {selectedStore?.branchCode || selectedStore?.Branch_Code}
                  </Text>
                  {(selectedStore?.address || selectedStore?.Branch_Address) && (
                    <Text 
                      style={[styles.storeAddress, isTabletDevice && styles.tabletStoreAddress]}
                      numberOfLines={2}
                    >
                      {selectedStore?.address || selectedStore?.Branch_Address}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Retailer Info */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <View style={[styles.reviewCard, isTabletDevice && styles.tabletReviewCard]}>
              <Text style={[styles.reviewSectionTitle, isTabletDevice && styles.tabletReviewSectionTitle]}>
                Customer
              </Text>
              <View style={styles.retailerReview}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={[styles.retailerIcon, isTabletDevice && styles.tabletRetailerIcon]}
                >
                  <User size={isTabletDevice ? 32 : 24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.retailerDetails}>
                  <Text style={[styles.retailerName, isTabletDevice && styles.tabletRetailerName]}>
                    {selectedRetailer?.Retailer_Name}
                  </Text>
                  {selectedRetailer?.Contact_Person && selectedRetailer.Contact_Person !== '0' && (
                    <Text style={[styles.contactPerson, isTabletDevice && styles.tabletContactPerson]}>
                      {selectedRetailer.Contact_Person}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Order Details */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <View style={[styles.reviewCard, isTabletDevice && styles.tabletReviewCard]}>
              <Text style={[styles.reviewSectionTitle, isTabletDevice && styles.tabletReviewSectionTitle]}>
                Order Details
              </Text>
              
              <View style={[styles.inputGroup, isTabletDevice && styles.tabletInputGroup]}>
                <Text style={[styles.inputLabel, isTabletDevice && styles.tabletInputLabel]}>
                  PO Number
                </Text>
                <TextInput
                  style={[styles.textInput, isTabletDevice && styles.tabletTextInput]}
                  placeholder="Enter PO number (optional)"
                  value={poNumber}
                  onChangeText={setPONumber}
                />
              </View>
              
              <View style={[styles.inputGroup, isTabletDevice && styles.tabletInputGroup]}>
                <Text style={[styles.inputLabel, isTabletDevice && styles.tabletInputLabel]}>
                  Notes
                </Text>
                <TextInput
                  style={[
                    styles.textAreaInput, 
                    isTabletDevice && styles.tabletTextAreaInput,
                    Platform.OS === 'ios' && styles.iosTextAreaInput
                  ]}
                  placeholder="Add any notes for this order..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={[styles.urgentContainer, isTabletDevice && styles.tabletUrgentContainer]}>
                <Text style={[styles.urgentLabel, isTabletDevice && styles.tabletUrgentLabel]}>
                  Mark as Urgent
                </Text>
                <TouchableOpacity
                  style={[
                    styles.urgentToggle, 
                    isUrgent && styles.urgentToggleActive,
                    isTabletDevice && styles.tabletUrgentToggle
                  ]}
                  onPress={() => setIsUrgent(!isUrgent)}
                >
                  <Text style={[
                    styles.urgentToggleText, 
                    isUrgent && styles.urgentToggleTextActive,
                    isTabletDevice && styles.tabletUrgentToggleText
                  ]}>
                    {isUrgent ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Order Items */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)}>
            <View style={[styles.reviewCard, isTabletDevice && styles.tabletReviewCard]}>
              <Text style={[styles.reviewSectionTitle, isTabletDevice && styles.tabletReviewSectionTitle]}>
                Order Items
              </Text>
              {orderItems.map((item, index) => (
                <View 
                  key={item.part.partNumber || item.part.Part_Number || index} 
                  style={[styles.reviewItem, isTabletDevice && styles.tabletReviewItem]}
                >
                  <View style={styles.reviewItemInfo}>
                    <Text style={[styles.reviewItemName, isTabletDevice && styles.tabletReviewItemName]}>
                      {item.part.name || item.part.Part_Name}
                    </Text>
                    <Text style={[styles.reviewItemNumber, isTabletDevice && styles.tabletReviewItemNumber]}>
                      #{item.part.partNumber || item.part.Part_Number}
                    </Text>
                  </View>
                  <View style={styles.reviewItemQuantity}>
                    <Text style={[styles.quantityLabel, isTabletDevice && styles.tabletQuantityLabel]}>
                      Qty: {item.quantity}
                    </Text>
                    <Text style={[styles.reviewItemPrice, isTabletDevice && styles.tabletReviewItemPrice]}>
                      {formatCurrency(item.totalPrice)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Order Total */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <View style={[styles.totalCard, isTabletDevice && styles.tabletTotalCard]}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={[styles.totalGradient, isTabletDevice && styles.tabletTotalGradient]}
              >
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, isTabletDevice && styles.tabletTotalLabel]}>
                    Order Total
                  </Text>
                  <Text style={[styles.totalAmount, isTabletDevice && styles.tabletTotalAmount]}>
                    {formatCurrency(getOrderTotal())}
                  </Text>
                </View>
                <Text style={[styles.totalItems, isTabletDevice && styles.tabletTotalItems]}>
                  {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} • {orderItems.reduce((sum, item) => sum + item.quantity, 0)} total quantity
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.delay(500).duration(600)}>
            <TouchableOpacity
              style={[styles.submitButton, isTabletDevice && styles.tabletSubmitButton]}
              onPress={handleSubmitOrder}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={[styles.submitGradient, isTabletDevice && styles.tabletSubmitGradient]}
              >
                {isSubmitting ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={isTabletDevice ? 24 : 20} color="#FFFFFF" />
                    <Text style={[styles.submitButtonText, isTabletDevice && styles.tabletSubmitButtonText]}>
                      Place Order
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Extra padding to ensure content is visible above tab bar */}
          <View style={{ height: Platform.OS === 'ios' ? 140 : 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const getStepTitle = () => {
    switch (step) {
      case 'store':
        return 'Select Store';
      case 'retailer':
        return 'Select Customer';
      case 'parts':
        return 'Add Products';
      case 'review':
        return 'Review Order';
      default:
        return 'Create Order';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'store':
        return 'Choose a store for this order';
      case 'retailer':
        return selectedStore ? `Order for ${selectedStore.name || selectedStore.Branch_Name}` : 'Select a customer for this order';
      case 'parts':
        return selectedRetailer ? `Order for ${selectedRetailer.Retailer_Name}` : 'Add products to order';
      case 'review':
        return 'Review and confirm your order';
      default:
        return '';
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <PlatformSafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.headerGradient, isTabletDevice && styles.tabletHeaderGradient]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[styles.backButton, isTabletDevice && styles.tabletBackButton]}
              onPress={handleBackPress}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <ArrowLeft size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={[styles.headerTitleText, isTabletDevice && styles.tabletHeaderTitleText]}>
                {getStepTitle()}
              </Text>
              <Text style={[styles.headerSubtitle, isTabletDevice && styles.tabletHeaderSubtitle]}>
                {getStepSubtitle()}
              </Text>
            </View>
            
            {step === 'parts' && (
              <TouchableOpacity
                style={[styles.headerActionButton, isTabletDevice && styles.tabletHeaderActionButton]}
                onPress={() => router.push('/(tabs)/parts/add')}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Plus size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {step !== 'parts' && (
              <View style={[styles.headerSpacer, isTabletDevice && styles.tabletHeaderSpacer]} />
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Step Indicator */}
      <View style={[styles.stepIndicator, isTabletDevice && styles.tabletStepIndicator]}>
        <View style={styles.stepIndicatorContainer}>
          {['store', 'retailer', 'parts', 'review'].map((stepName, index) => {
            // Skip store step for non-admin users
            if (stepName === 'store' && !needsStoreSelection) {
              return null;
            }
            
            return (
              <View key={stepName} style={styles.stepIndicatorItem}>
                <View style={[
                  styles.stepDot,
                  step === stepName && styles.stepDotActive,
                  ((step === 'retailer' && stepName === 'store') ||
                   (step === 'parts' && (stepName === 'store' || stepName === 'retailer')) ||
                   (step === 'review' && (stepName === 'store' || stepName === 'retailer' || stepName === 'parts')))
                    ? styles.stepDotCompleted : {},
                  isTabletDevice && styles.tabletStepDot
                ]}>
                  <Text style={[
                    styles.stepDotText,
                    ((step === stepName) || 
                     (step === 'retailer' && stepName === 'store') ||
                     (step === 'parts' && (stepName === 'store' || stepName === 'retailer')) ||
                     (step === 'review' && (stepName === 'store' || stepName === 'retailer' || stepName === 'parts')))
                      && styles.stepDotTextActive,
                    isTabletDevice && styles.tabletStepDotText
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                {index < (needsStoreSelection ? 3 : 2) && (
                  <View style={[
                    styles.stepLine,
                    ((step === 'retailer' && stepName === 'store') ||
                     (step === 'parts' && stepName === 'retailer') ||
                     (step === 'parts' && stepName === 'store') ||
                     (step === 'review' && stepName === 'store') ||
                     (step === 'review' && stepName === 'retailer') ||
                     (step === 'review' && stepName === 'parts')) && styles.stepLineCompleted,
                    isTabletDevice && styles.tabletStepLine
                  ]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Step Content */}
      {step === 'store' && renderStoreStep()}
      {step === 'retailer' && renderRetailerStep()}
      {step === 'parts' && renderPartsStep()}
      {step === 'review' && renderReviewStep()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletBackButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabletHeaderTitleText: {
    fontSize: 28,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabletHeaderSubtitle: {
    fontSize: 16,
  },
  headerSpacer: {
    width: 44,
  },
  tabletHeaderSpacer: {
    width: 56,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletHeaderActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  stepIndicator: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabletStepIndicator: {
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletStepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  stepDotActive: {
    backgroundColor: '#667eea',
  },
  stepDotCompleted: {
    backgroundColor: '#10b981',
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tabletStepDotText: {
    fontSize: 16,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  tabletStepLine: {
    width: 60,
    height: 3,
    marginHorizontal: 12,
  },
  stepLineCompleted: {
    backgroundColor: '#10b981',
  },
  stepContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabletSearchContainer: {
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  searchBar: {
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
  listContent: {
    paddingBottom: 180, // Increased to ensure content is visible above the order summary
    paddingHorizontal: 20,
  },
  tabletListContent: {
    paddingBottom: 200,
    paddingHorizontal: 32,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  retailerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  tabletRetailerCard: {
    borderRadius: 20,
    marginVertical: 12,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  retailerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retailerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tabletRetailerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 20,
  },
  retailerDetails: {
    flex: 1,
  },
  retailerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  tabletRetailerName: {
    fontSize: 22,
    marginBottom: 6,
  },
  contactPerson: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  tabletContactPerson: {
    fontSize: 16,
    marginBottom: 6,
  },
  creditLimit: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  tabletCreditLimit: {
    fontSize: 14,
  },
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletSelectButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  tabletStoreCard: {
    borderRadius: 20,
    marginVertical: 12,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tabletStoreIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 20,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  tabletStoreName: {
    fontSize: 22,
    marginBottom: 6,
  },
  storeCode: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  tabletStoreCode: {
    fontSize: 16,
    marginBottom: 6,
  },
  storeAddress: {
    fontSize: 12,
    color: '#94a3b8',
  },
  tabletStoreAddress: {
    fontSize: 14,
  },
  partCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  tabletPartCard: {
    borderRadius: 20,
    marginVertical: 12,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  partHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  partImageContainer: {
    marginRight: 16,
  },
  tabletPartImageContainer: {
    marginRight: 20,
  },
  partImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  tabletPartImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  partImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletPartImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  partInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  partName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  tabletPartName: {
    fontSize: 20,
    marginBottom: 6,
  },
  partNumber: {
    fontSize: 12,
    color: '#64748b',
  },
  tabletPartNumber: {
    fontSize: 14,
  },
  partCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  tabletPartCategory: {
    fontSize: 14,
  },
  partStock: {
    fontSize: 11,
    color: '#94a3b8',
  },
  tabletPartStock: {
    fontSize: 13,
  },
  partPrice: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  tabletPriceText: {
    fontSize: 22,
  },
  partActions: {
    alignItems: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 20,
    minWidth: 40,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletRemoveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabletAddButton: {
    borderRadius: 16,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  tabletAddButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabletAddButtonText: {
    fontSize: 16,
  },
  orderSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for safe area
    marginBottom: 80, // Adjust based on toolbar height
    backgroundColor: 'transparent',
    zIndex: 100
  },
  tabletOrderSummary: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: 100,
  },
  iosOrderSummary: {
    paddingBottom: 20, // iOS already has SafeAreaView
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabletSummaryCard: {
    margin: 24,
    padding: 20,
    borderRadius: 16,
    maxWidth: 600,
    alignSelf: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  tabletSummaryTitle: {
    fontSize: 22,
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  tabletSummaryTotal: {
    fontSize: 24,
  },
  summaryItems: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  tabletSummaryItems: {
    fontSize: 16,
    marginBottom: 20,
  },
  reviewButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabletReviewButton: {
    borderRadius: 16,
  },
  reviewButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabletReviewButtonGradient: {
    paddingVertical: 16,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabletReviewButtonText: {
    fontSize: 18,
  },
  reviewContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  tabletReviewContent: {
    paddingHorizontal: 32,
    paddingBottom: 140,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  tabletReviewCard: {
    borderRadius: 20,
    marginVertical: 12,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  tabletReviewSectionTitle: {
    fontSize: 22,
    marginBottom: 20,
  },
  retailerReview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeReview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  tabletInputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  tabletInputLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  tabletTextInput: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 18,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tabletTextAreaInput: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 18,
    minHeight: 100,
  },
  iosTextAreaInput: {
    paddingTop: 12, // iOS needs explicit padding for multiline inputs
  },
  urgentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabletUrgentContainer: {
    marginTop: 8,
  },
  urgentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  tabletUrgentLabel: {
    fontSize: 18,
  },
  urgentToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabletUrgentToggle: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  urgentToggleActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  urgentToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabletUrgentToggleText: {
    fontSize: 16,
  },
  urgentToggleTextActive: {
    color: '#ef4444',
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabletReviewItem: {
    paddingVertical: 16,
  },
  reviewItemInfo: {
    flex: 1,
  },
  reviewItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  tabletReviewItemName: {
    fontSize: 18,
    marginBottom: 6,
  },
  reviewItemNumber: {
    fontSize: 12,
    color: '#64748b',
  },
  tabletReviewItemNumber: {
    fontSize: 14,
  },
  reviewItemQuantity: {
    alignItems: 'flex-end',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  tabletQuantityLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  reviewItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  tabletReviewItemPrice: {
    fontSize: 18,
  },
  totalCard: {
    marginVertical: 8,
    borderRadius: 16,
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
  tabletTotalCard: {
    marginVertical: 12,
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  totalGradient: {
    padding: 20,
  },
  tabletTotalGradient: {
    padding: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabletTotalLabel: {
    fontSize: 24,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabletTotalAmount: {
    fontSize: 28,
  },
  totalItems: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabletTotalItems: {
    fontSize: 16,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabletSubmitButton: {
    marginTop: 24,
    marginBottom: 60,
    borderRadius: 20,
    maxWidth: 400,
    alignSelf: 'center',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabletSubmitGradient: {
    paddingVertical: 20,
    gap: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabletSubmitButtonText: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  tabletEmptyState: {
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  tabletEmptyTitle: {
    fontSize: 24,
    marginBottom: 12,
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
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
});