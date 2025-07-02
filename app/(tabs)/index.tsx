import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ModernCard } from '@/components/ModernCard';
import { ModernHeader } from '@/components/ModernHeader';
import { ModernButton } from '@/components/ModernButton';
import { StatsCard } from '@/components/StatsCard';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Package, ShoppingCart, Users, TriangleAlert as AlertTriangle, TrendingUp, Clock, CircleCheck as CheckCircle, ChartBar as BarChart3, DollarSign, Bell, Plus, Scan, Camera, FileText, Menu, Grid3x3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { isTablet } from '@/hooks/useResponsiveStyles';
import { PlatformSafeAreaView } from '@/components/PlatformSafeAreaView';

const { width } = Dimensions.get('window');

interface DashboardStats {
  orders?: {
    total: number;
    pending: number;
    delivered: number;
    revenue: number;
    growth?: number;
  };
  parts?: {
    total: number;
    lowStock: number;
    categories: number;
  };
  retailers?: {
    total: number;
    active: number;
    pending: number;
  };
  sales?: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth?: number;
  };
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [notifications, setNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isTabletDevice = isTablet();

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      const promises = [];
      
      // Load data based on user role
      if (['super_admin', 'admin', 'manager'].includes(user?.role || '')) {
        promises.push(
          apiService.getOrderStats(),
          apiService.getRetailerStats()
        );
      }
      
      if (['super_admin', 'admin', 'manager', 'storeman'].includes(user?.role || '')) {
        promises.push(apiService.getLowStockParts());
      }

      if (['salesman'].includes(user?.role || '')) {
        promises.push(apiService.getSalesReport());
      }
      
      const results = await Promise.allSettled(promises);
      
      const newStats: DashboardStats = {};
      let alertsData = [];
      
      if (results[0]?.status === 'fulfilled') {
        newStats.orders = {
          ...results[0].value,
          growth: Math.floor(Math.random() * 20) - 5,
        };
      }
      
      if (results[1]?.status === 'fulfilled') {
        newStats.retailers = results[1].value;
      }
      
      if (results[2]?.status === 'fulfilled') {
        alertsData = results[2].value;
        setNotifications(alertsData.length);
      }

      // Mock sales data for demonstration
      if (user?.role === 'salesman') {
        newStats.sales = {
          today: Math.floor(Math.random() * 5000) + 1000,
          thisWeek: Math.floor(Math.random() * 25000) + 5000,
          thisMonth: Math.floor(Math.random() * 100000) + 20000,
          growth: Math.floor(Math.random() * 30) - 10,
        };
      }
      
      setStats(newStats);
      setLowStockAlerts(alertsData);
    } catch (error: any) {
      setError(error.error || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'scan_barcode':
        Alert.alert('Barcode Scanner', 'Opening barcode scanner...');
        break;
      case 'new_order':
        router.push('/(tabs)/orders/create');
        break;
      case 'quick_stock':
        router.push('/(tabs)/inventory');
        break;
      case 'photo_report':
        Alert.alert('Photo Report', 'Opening camera for photo report...');
        break;
      case 'low_stock_alert':
        Alert.alert('Stock Alerts', `You have ${lowStockAlerts.length} low stock alerts`);
        break;
      case 'daily_report':
        router.push('/(tabs)/reports');
        break;
      case 'parts_catalog':
        router.push('/(tabs)/parts');
        break;
      case 'retailers_list':
        router.push('/(tabs)/retailers');
        break;
      case 'inventory_management':
        router.push('/(tabs)/inventory');
        break;
      default:
        Alert.alert('Action', `${actionId} feature coming soon!`);
    }
  };

  const getDashboardTitle = () => {
    const role = user?.role || '';
    const timeOfDay = new Date().getHours() < 12 ? 'Morning' : 
                     new Date().getHours() < 18 ? 'Afternoon' : 'Evening';
    
    switch (role) {
      case 'super_admin':
        return `Good ${timeOfDay}`;
      case 'admin':
        return `Company Overview`;
      case 'manager':
        return `Store Management`;
      case 'storeman':
        return `Inventory Control`;
      case 'salesman':
        return `Sales Dashboard`;
      case 'retailer':
        return `My Account`;
      default:
        return `Dashboard`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderQuickActions = () => {
    const role = user?.role || '';
    const actions = [];

    if (['admin', 'manager', 'storeman', 'salesman'].includes(role)) {
      actions.push({
        id: 'scan_barcode',
        title: 'Scan Part',
        icon: <Scan size={isTabletDevice ? 28 : 24} color="#FFFFFF" />,
        colors: ['#667eea', '#764ba2'],
      });
    }

    if (['admin', 'manager', 'salesman'].includes(role)) {
      actions.push({
        id: 'new_order',
        title: 'New Order',
        icon: <Plus size={isTabletDevice ? 28 : 24} color="#FFFFFF" />,
        colors: ['#f093fb', '#f5576c'],
      });
    }

    if (['admin', 'manager', 'storeman'].includes(role)) {
      actions.push({
        id: 'quick_stock',
        title: 'Quick Stock',
        icon: <Package size={isTabletDevice ? 28 : 24} color="#FFFFFF" />,
        colors: ['#4facfe', '#00f2fe'],
      });
    }

    if (['admin', 'manager', 'storeman', 'salesman'].includes(role)) {
      actions.push({
        id: 'photo_report',
        title: 'Photo Report',
        icon: <Camera size={isTabletDevice ? 28 : 24} color="#FFFFFF" />,
        colors: ['#43e97b', '#38f9d7'],
      });
    }

    if (actions.length === 0) return null;

    return (
      <Animated.View entering={FadeInUp.delay(200).duration(600)}>
        <ModernCard style={[styles.quickActionsCard, isTabletDevice && styles.tabletQuickActionsCard]}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Quick Actions
          </Text>
          <View style={[styles.quickActionsGrid, isTabletDevice && styles.tabletQuickActionsGrid]}>
            {actions.map((action, index) => (
              <ModernButton
                key={action.id}
                title={action.title}
                onPress={() => handleQuickAction(action.id)}
                icon={action.icon}
                variant="gradient"
                size={isTabletDevice ? "medium" : "small"}
                style={styles.quickActionButton}
              />
            ))}
          </View>
        </ModernCard>
      </Animated.View>
    );
  };

  const renderMenuActions = () => {
    const role = user?.role || '';
    const menuActions = [];

    // Add menu actions based on role
    if (['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'].includes(role)) {
      menuActions.push({
        id: 'parts_catalog',
        title: 'Parts Catalog',
        icon: <Package size={isTabletDevice ? 24 : 20} color="#667eea" />,
        description: 'Browse and manage parts',
      });
    }

    if (['super_admin', 'admin', 'manager', 'salesman'].includes(role)) {
      menuActions.push({
        id: 'retailers_list',
        title: 'Retailers',
        icon: <Users size={isTabletDevice ? 24 : 20} color="#059669" />,
        description: 'Manage customer relationships',
      });
    }

    if (['super_admin', 'admin', 'manager', 'storeman'].includes(role)) {
      menuActions.push({
        id: 'inventory_management',
        title: 'Inventory',
        icon: <Grid3x3 size={isTabletDevice ? 24 : 20} color="#f59e0b" />,
        description: 'Stock management & control',
      });
    }

    if (menuActions.length === 0) return null;

    return (
      <Animated.View entering={FadeInUp.delay(400).duration(600)}>
        <ModernCard style={[styles.menuCard, isTabletDevice && styles.tabletMenuCard]}>
          <View style={styles.menuHeader}>
            <Menu size={isTabletDevice ? 28 : 24} color="#1e293b" />
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              More Features
            </Text>
          </View>
          <View style={styles.menuGrid}>
            {menuActions.map((action, index) => (
              <ModernButton
                key={action.id}
                title={action.title}
                onPress={() => handleQuickAction(action.id)}
                icon={action.icon}
                variant="secondary"
                size={isTabletDevice ? "medium" : "small"}
                style={styles.menuItem}
              />
            ))}
          </View>
        </ModernCard>
      </Animated.View>
    );
  };

  const renderStatsCards = () => {
    const role = user?.role || '';
    
    if (role === 'salesman' && stats.sales) {
      return (
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Sales Performance
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.statsScroll}
            contentContainerStyle={isTabletDevice && styles.tabletStatsScrollContent}
          >
            <StatsCard
              title="Today"
              value={formatCurrency(stats.sales.today)}
              icon={<DollarSign size={isTabletDevice ? 28 : 24} color="#FFFFFF" />}
              variant="gradient"
              gradientColors={['#667eea', '#764ba2']}
              trend={{ value: 12, isPositive: true }}
              delay={0}
            />
            <StatsCard
              title="This Week"
              value={formatCurrency(stats.sales.thisWeek)}
              icon={<TrendingUp size={isTabletDevice ? 28 : 24} color="#FFFFFF" />}
              variant="gradient"
              gradientColors={['#f093fb', '#f5576c']}
              trend={{ value: 8, isPositive: true }}
              delay={100}
            />
            <StatsCard
              title="This Month"
              value={formatCurrency(stats.sales.thisMonth)}
              icon={<BarChart3 size={isTabletDevice ? 28 : 24} color="#FFFFFF" />}
              variant="gradient"
              gradientColors={['#4facfe', '#00f2fe']}
              trend={{ value: stats.sales.growth || 0, isPositive: (stats.sales.growth || 0) >= 0 }}
              delay={200}
            />
          </ScrollView>
        </Animated.View>
      );
    }

    if (['admin', 'manager'].includes(role) && stats.orders) {
      return (
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Business Overview
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.statsScroll}
            contentContainerStyle={isTabletDevice && styles.tabletStatsScrollContent}
          >
            <StatsCard
              title="Total Orders"
              value={stats.orders.total}
              icon={<ShoppingCart size={isTabletDevice ? 28 : 24} color="#667eea" />}
              trend={{ value: 15, isPositive: true }}
              delay={0}
            />
            <StatsCard
              title="Revenue"
              value={formatCurrency(stats.orders.revenue)}
              icon={<DollarSign size={isTabletDevice ? 28 : 24} color="#667eea" />}
              trend={{ value: stats.orders.growth || 0, isPositive: (stats.orders.growth || 0) >= 0 }}
              delay={100}
            />
            <StatsCard
              title="Pending"
              value={stats.orders.pending}
              icon={<Clock size={isTabletDevice ? 28 : 24} color="#667eea" />}
              delay={200}
            />
          </ScrollView>
        </Animated.View>
      );
    }

    if (role === 'storeman') {
      return (
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Inventory Status
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.statsScroll}
            contentContainerStyle={isTabletDevice && styles.tabletStatsScrollContent}
          >
            <StatsCard
              title="Low Stock"
              value={lowStockAlerts.length}
              icon={<AlertTriangle size={isTabletDevice ? 28 : 24} color="#ef4444" />}
              trend={{ value: 5, isPositive: false }}
              delay={0}
            />
            <StatsCard
              title="Total Parts"
              value="2,847"
              icon={<Package size={isTabletDevice ? 28 : 24} color="#667eea" />}
              trend={{ value: 3, isPositive: true }}
              delay={100}
            />
            <StatsCard
              title="Categories"
              value="24"
              icon={<BarChart3 size={isTabletDevice ? 28 : 24} color="#667eea" />}
              delay={200}
            />
          </ScrollView>
        </Animated.View>
      );
    }

    if (role === 'retailer') {
      return (
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            My Account
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.statsScroll}
            contentContainerStyle={isTabletDevice && styles.tabletStatsScrollContent}
          >
            <StatsCard
              title="My Orders"
              value="12"
              icon={<ShoppingCart size={isTabletDevice ? 28 : 24} color="#667eea" />}
              delay={0}
            />
            <StatsCard
              title="Pending"
              value="3"
              icon={<Clock size={isTabletDevice ? 28 : 24} color="#667eea" />}
              delay={100}
            />
            <StatsCard
              title="Credit Available"
              value={formatCurrency(15000)}
              icon={<DollarSign size={isTabletDevice ? 28 : 24} color="#667eea" />}
              trend={{ value: 10, isPositive: true }}
              delay={200}
            />
          </ScrollView>
        </Animated.View>
      );
    }

    return null;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadDashboardData} />;
  }

  return (
    <PlatformSafeAreaView style={styles.container} gradientHeader>
      <ModernHeader
        title={getDashboardTitle()}
        subtitle={user?.name}
        leftButton={<HamburgerMenu />}
        rightButton={
          notifications > 0
            ? {
                icon: <Bell size={isTabletDevice ? 28 : 24} color="#FFFFFF" />,
                onPress: () => Alert.alert('Notifications', `You have ${notifications} notifications`),
              }
            : undefined
        }
        variant="gradient"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, isTabletDevice && styles.tabletContent]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Menu Actions */}
        {renderMenuActions()}

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && ['admin', 'manager', 'storeman'].includes(user?.role || '') && (
          <Animated.View entering={FadeInUp.delay(600).duration(600)}>
            <ModernCard style={[styles.alertsCard, isTabletDevice && styles.tabletAlertsCard]}>
              <View style={styles.alertsHeader}>
                <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
                  Stock Alerts
                </Text>
                <View style={[styles.alertBadge, isTabletDevice && styles.tabletAlertBadge]}>
                  <Text style={[styles.alertBadgeText, isTabletDevice && styles.tabletAlertBadgeText]}>
                    {lowStockAlerts.length}
                  </Text>
                </View>
              </View>
              {lowStockAlerts.slice(0, 3).map((item: any, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.alertItem, isTabletDevice && styles.tabletAlertItem]} 
                  activeOpacity={0.7}
                >
                  <View style={[styles.alertIcon, isTabletDevice && styles.tabletAlertIcon]}>
                    <AlertTriangle size={isTabletDevice ? 20 : 16} color="#f59e0b" />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={[styles.alertTitle, isTabletDevice && styles.tabletAlertTitle]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.alertSubtitle, isTabletDevice && styles.tabletAlertSubtitle]}>
                      #{item.partNumber} • {item.currentStock} in stock
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {lowStockAlerts.length > 3 && (
                <ModernButton
                  title={`View All ${lowStockAlerts.length} Alerts`}
                  onPress={() => handleQuickAction('low_stock_alert')}
                  variant="ghost"
                  size={isTabletDevice ? "medium" : "small"}
                />
              )}
            </ModernCard>
          </Animated.View>
        )}

        {/* Recent Activity */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)}>
          <ModernCard style={[styles.activityCard, isTabletDevice && styles.tabletActivityCard]}>
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              Recent Activity
            </Text>
            <View style={styles.activityList}>
              <View style={[styles.activityItem, isTabletDevice && styles.tabletActivityItem]}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={[styles.activityIcon, isTabletDevice && styles.tabletActivityIcon]}
                >
                  <CheckCircle size={isTabletDevice ? 20 : 16} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, isTabletDevice && styles.tabletActivityTitle]}>
                    Order #ORD-2024-001 completed
                  </Text>
                  <Text style={[styles.activityTime, isTabletDevice && styles.tabletActivityTime]}>
                    2 hours ago
                  </Text>
                </View>
              </View>
              
              <View style={[styles.activityItem, isTabletDevice && styles.tabletActivityItem]}>
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={[styles.activityIcon, isTabletDevice && styles.tabletActivityIcon]}
                >
                  <Package size={isTabletDevice ? 20 : 16} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, isTabletDevice && styles.tabletActivityTitle]}>
                    Stock updated for Brake Pads
                  </Text>
                  <Text style={[styles.activityTime, isTabletDevice && styles.tabletActivityTime]}>
                    4 hours ago
                  </Text>
                </View>
              </View>
              
              <View style={[styles.activityItem, isTabletDevice && styles.tabletActivityItem]}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={[styles.activityIcon, isTabletDevice && styles.tabletActivityIcon]}
                >
                  <Users size={isTabletDevice ? 20 : 16} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, isTabletDevice && styles.tabletActivityTitle]}>
                    New retailer registered
                  </Text>
                  <Text style={[styles.activityTime, isTabletDevice && styles.tabletActivityTime]}>
                    6 hours ago
                  </Text>
                </View>
              </View>
            </View>
          </ModernCard>
        </Animated.View>
      </ScrollView>
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
    paddingBottom: 120,
  },
  tabletContent: {
    paddingBottom: 140,
    paddingHorizontal: 0,
  },
  quickActionsCard: {
    margin: 20,
    marginBottom: 16,
  },
  tabletQuickActionsCard: {
    margin: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  tabletSectionTitle: {
    fontSize: 26,
    marginBottom: 24,
    marginHorizontal: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  tabletQuickActionsGrid: {
    gap: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
    minWidth: (width - 80) / 2 - 8,
  },
  quickActionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  menuCard: {
    margin: 20,
    marginTop: 0,
  },
  tabletMenuCard: {
    margin: 32,
    marginTop: 0,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuGrid: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  statsScroll: {
    paddingLeft: 20,
  },
  tabletStatsScrollContent: {
    paddingLeft: 32,
    paddingRight: 12,
  },
  alertsCard: {
    margin: 20,
    marginTop: 0,
  },
  tabletAlertsCard: {
    margin: 32,
    marginTop: 0,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  alertBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  tabletAlertBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 40,
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabletAlertBadgeText: {
    fontSize: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabletAlertItem: {
    paddingVertical: 20,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tabletAlertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  tabletAlertTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  tabletAlertSubtitle: {
    fontSize: 16,
  },
  activityCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 32,
  },
  tabletActivityCard: {
    margin: 32,
    marginTop: 0,
    marginBottom: 48,
  },
  activityList: {
    gap: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabletActivityItem: {
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tabletActivityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  tabletActivityTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  activityTime: {
    fontSize: 14,
    color: '#64748b',
  },
  tabletActivityTime: {
    fontSize: 16,
  },
});