import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/context/AuthContext';
import { ChartBar as BarChart3, TrendingUp, Package, ShoppingCart, Users, Download, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Target, Award, Clock, Zap, Eye, Filter } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { ModernButton } from '@/components/ModernButton';
import { PlatformSafeAreaView } from '@/components/PlatformSafeAreaView';
import { isTablet } from '@/hooks/useResponsiveStyles';

const { width, height } = Dimensions.get('window');

interface ReportData {
  orders?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    growth: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
  inventory?: {
    totalParts: number;
    lowStockItems: number;
    totalValue: number;
    categories: number;
    topCategories: Array<{ category: string; count: number; value: number }>;
  };
  sales?: {
    totalSales: number;
    dailyAverage: number;
    monthlyGrowth: number;
    weeklyGrowth: number;
    topSalespeople: Array<{ name: string; sales: number; revenue: number }>;
  };
  retailers?: {
    totalRetailers: number;
    activeRetailers: number;
    newRetailers: number;
    topRetailers: Array<{ name: string; orders: number; revenue: number }>;
  };
}

type ReportType = 'overview' | 'orders' | 'inventory' | 'sales' | 'retailers';

export default function ReportsScreen() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<ReportData>({});
  const [selectedReport, setSelectedReport] = useState<ReportType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isTabletDevice = isTablet();
  const isLandscape = width > height;

  useEffect(() => {
    loadReportData();
  }, [user?.role]);

  const loadReportData = async () => {
    try {
      setError(null);
      
      // Mock data for demonstration - in real app, these would be API calls
      const mockData: ReportData = {
        orders: {
          totalOrders: 1247,
          totalRevenue: 89650,
          averageOrderValue: 72,
          growth: 12.5,
          topProducts: [
            { name: 'Brake Pads - Front Set', quantity: 156, revenue: 14040 },
            { name: 'Engine Oil 5W-30', quantity: 234, revenue: 5850 },
            { name: 'Air Filter', quantity: 189, revenue: 3780 },
            { name: 'Spark Plugs Set', quantity: 145, revenue: 2900 },
          ],
        },
        inventory: {
          totalParts: 2847,
          lowStockItems: 23,
          totalValue: 156780,
          categories: 24,
          topCategories: [
            { category: 'Engine Parts', count: 456, value: 45600 },
            { category: 'Brake System', count: 234, value: 23400 },
            { category: 'Electrical', count: 189, value: 18900 },
            { category: 'Suspension', count: 167, value: 16700 },
          ],
        },
        sales: {
          totalSales: 89650,
          dailyAverage: 2988,
          monthlyGrowth: 15.2,
          weeklyGrowth: 8.7,
          topSalespeople: [
            { name: 'John Smith', sales: 45, revenue: 32400 },
            { name: 'Sarah Johnson', sales: 38, revenue: 27300 },
            { name: 'Mike Wilson', sales: 32, revenue: 22800 },
            { name: 'Lisa Brown', sales: 28, revenue: 19600 },
          ],
        },
        retailers: {
          totalRetailers: 156,
          activeRetailers: 134,
          newRetailers: 12,
          topRetailers: [
            { name: 'Downtown Auto Parts', orders: 23, revenue: 18400 },
            { name: 'City Motors', orders: 19, revenue: 15200 },
            { name: 'Highway Garage', orders: 16, revenue: 12800 },
            { name: 'Quick Fix Auto', orders: 14, revenue: 11200 },
          ],
        },
      };
      
      setReportData(mockData);
    } catch (error: any) {
      setError(error.error || 'Failed to load report data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercentage = (value: number) => {
    const safeValue = value || 0;
    return `${safeValue >= 0 ? '+' : ''}${safeValue.toFixed(1)}%`;
  };

  const getReportTabs = () => {
    const tabs = [
      { key: 'overview', title: 'Overview', icon: BarChart3 },
    ];
    
    if (['super_admin', 'admin', 'manager'].includes(user?.role || '')) {
      tabs.push(
        { key: 'orders', title: 'Orders', icon: ShoppingCart },
        { key: 'retailers', title: 'Retailers', icon: Users }
      );
    }
    
    if (['super_admin', 'admin', 'manager', 'storeman'].includes(user?.role || '')) {
      tabs.push({ key: 'inventory', title: 'Inventory', icon: Package });
    }

    if (['super_admin', 'admin', 'manager', 'salesman'].includes(user?.role || '')) {
      tabs.push({ key: 'sales', title: 'Sales', icon: TrendingUp });
    }
    
    return tabs;
  };

  const renderOverviewReport = () => {
    // Determine if we should use a multi-column layout for tablets in landscape
    const useMultiColumn = isTabletDevice && isLandscape;
    
    return (
      <ScrollView 
        style={styles.reportContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={useMultiColumn ? styles.multiColumnContent : undefined}
      >
        {/* Key Metrics */}
        <Animated.View 
          entering={FadeInUp.delay(0).duration(600)}
          style={useMultiColumn ? { width: '48%' } : undefined}
        >
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Key Performance Indicators
          </Text>
          <View style={[
            styles.metricsGrid, 
            isTabletDevice && styles.tabletMetricsGrid,
            useMultiColumn && styles.multiColumnMetricsGrid
          ]}>
            <View style={[styles.metricCard, isTabletDevice && styles.tabletMetricCard]}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.metricGradient}>
                <DollarSign size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.metricValue, isTabletDevice && styles.tabletMetricValue]}>
                  {formatCurrency(reportData.orders?.totalRevenue || 0)}
                </Text>
                <Text style={[styles.metricLabel, isTabletDevice && styles.tabletMetricLabel]}>
                  Total Revenue
                </Text>
                <View style={styles.metricTrend}>
                  <ArrowUpRight size={isTabletDevice ? 18 : 16} color="#FFFFFF" />
                  <Text style={[styles.metricTrendText, isTabletDevice && styles.tabletMetricTrendText]}>
                    {formatPercentage(reportData.orders?.growth || 0)}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={[styles.metricCard, isTabletDevice && styles.tabletMetricCard]}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.metricGradient}>
                <ShoppingCart size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.metricValue, isTabletDevice && styles.tabletMetricValue]}>
                  {reportData.orders?.totalOrders || 0}
                </Text>
                <Text style={[styles.metricLabel, isTabletDevice && styles.tabletMetricLabel]}>
                  Total Orders
                </Text>
                <View style={styles.metricTrend}>
                  <ArrowUpRight size={isTabletDevice ? 18 : 16} color="#FFFFFF" />
                  <Text style={[styles.metricTrendText, isTabletDevice && styles.tabletMetricTrendText]}>
                    +8.2%
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={[styles.metricCard, isTabletDevice && styles.tabletMetricCard]}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.metricGradient}>
                <Package size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.metricValue, isTabletDevice && styles.tabletMetricValue]}>
                  {reportData.inventory?.totalParts || 0}
                </Text>
                <Text style={[styles.metricLabel, isTabletDevice && styles.tabletMetricLabel]}>
                  Total Parts
                </Text>
                <View style={styles.metricTrend}>
                  <ArrowUpRight size={isTabletDevice ? 18 : 16} color="#FFFFFF" />
                  <Text style={[styles.metricTrendText, isTabletDevice && styles.tabletMetricTrendText]}>
                    +3.1%
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={[styles.metricCard, isTabletDevice && styles.tabletMetricCard]}>
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.metricGradient}>
                <Users size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.metricValue, isTabletDevice && styles.tabletMetricValue]}>
                  {reportData.retailers?.activeRetailers || 0}
                </Text>
                <Text style={[styles.metricLabel, isTabletDevice && styles.tabletMetricLabel]}>
                  Active Retailers
                </Text>
                <View style={styles.metricTrend}>
                  <ArrowUpRight size={isTabletDevice ? 18 : 16} color="#FFFFFF" />
                  <Text style={[styles.metricTrendText, isTabletDevice && styles.tabletMetricTrendText]}>
                    +5.7%
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View 
          entering={FadeInUp.delay(200).duration(600)}
          style={useMultiColumn ? { width: '48%' } : undefined}
        >
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Quick Stats
          </Text>
          <View style={[
            styles.quickStatsContainer, 
            isTabletDevice && styles.tabletQuickStatsContainer,
            useMultiColumn && styles.multiColumnQuickStatsContainer
          ]}>
            <View style={[styles.quickStatCard, isTabletDevice && styles.tabletQuickStatCard]}>
              <View style={[styles.quickStatIcon, isTabletDevice && styles.tabletQuickStatIcon]}>
                <Target size={isTabletDevice ? 24 : 20} color="#667eea" />
              </View>
              <Text style={[styles.quickStatValue, isTabletDevice && styles.tabletQuickStatValue]}>
                {formatCurrency(reportData.orders?.averageOrderValue || 0)}
              </Text>
              <Text style={[styles.quickStatLabel, isTabletDevice && styles.tabletQuickStatLabel]}>
                Avg Order Value
              </Text>
            </View>

            <View style={[styles.quickStatCard, isTabletDevice && styles.tabletQuickStatCard]}>
              <View style={[styles.quickStatIcon, isTabletDevice && styles.tabletQuickStatIcon]}>
                <Clock size={isTabletDevice ? 24 : 20} color="#f59e0b" />
              </View>
              <Text style={[styles.quickStatValue, isTabletDevice && styles.tabletQuickStatValue]}>
                {formatCurrency(reportData.sales?.dailyAverage || 0)}
              </Text>
              <Text style={[styles.quickStatLabel, isTabletDevice && styles.tabletQuickStatLabel]}>
                Daily Average
              </Text>
            </View>

            <View style={[styles.quickStatCard, isTabletDevice && styles.tabletQuickStatCard]}>
              <View style={[styles.quickStatIcon, isTabletDevice && styles.tabletQuickStatIcon]}>
                <Zap size={isTabletDevice ? 24 : 20} color="#10b981" />
              </View>
              <Text style={[styles.quickStatValue, isTabletDevice && styles.tabletQuickStatValue]}>
                {reportData.inventory?.lowStockItems || 0}
              </Text>
              <Text style={[styles.quickStatLabel, isTabletDevice && styles.tabletQuickStatLabel]}>
                Low Stock Items
              </Text>
            </View>

            <View style={[styles.quickStatCard, isTabletDevice && styles.tabletQuickStatCard]}>
              <View style={[styles.quickStatIcon, isTabletDevice && styles.tabletQuickStatIcon]}>
                <Award size={isTabletDevice ? 24 : 20} color="#8b5cf6" />
              </View>
              <Text style={[styles.quickStatValue, isTabletDevice && styles.tabletQuickStatValue]}>
                {reportData.retailers?.newRetailers || 0}
              </Text>
              <Text style={[styles.quickStatLabel, isTabletDevice && styles.tabletQuickStatLabel]}>
                New Retailers
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Top Performers */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={{ width: '100%' }}>
          <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
            Top Performers
          </Text>
          <View style={[
            styles.topPerformersContainer, 
            isTabletDevice && styles.tabletTopPerformersContainer,
            useMultiColumn && styles.multiColumnTopPerformersContainer
          ]}>
            <View style={[styles.performerCard, isTabletDevice && styles.tabletPerformerCard]}>
              <Text style={[styles.performerTitle, isTabletDevice && styles.tabletPerformerTitle]}>
                Top Products
              </Text>
              {reportData.orders?.topProducts?.slice(0, 3).map((product, index) => (
                <View key={index} style={styles.performerItem}>
                  <Text style={[styles.performerName, isTabletDevice && styles.tabletPerformerName]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.performerValue, isTabletDevice && styles.tabletPerformerValue]}>
                    {formatCurrency(product.revenue)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.performerCard, isTabletDevice && styles.tabletPerformerCard]}>
              <Text style={[styles.performerTitle, isTabletDevice && styles.tabletPerformerTitle]}>
                Top Retailers
              </Text>
              {reportData.retailers?.topRetailers?.slice(0, 3).map((retailer, index) => (
                <View key={index} style={styles.performerItem}>
                  <Text style={[styles.performerName, isTabletDevice && styles.tabletPerformerName]}>
                    {retailer.name}
                  </Text>
                  <Text style={[styles.performerValue, isTabletDevice && styles.tabletPerformerValue]}>
                    {formatCurrency(retailer.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderOrdersReport = () => {
    const data = reportData.orders;
    if (!data) return null;

    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={[
            styles.summaryCards, 
            isTabletDevice && styles.tabletSummaryCards
          ]}>
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <LinearGradient colors={['#2563EB', '#1d4ed8']} style={styles.summaryGradient}>
                <ShoppingCart size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.summaryNumber, isTabletDevice && styles.tabletSummaryNumber]}>
                  {data.totalOrders}
                </Text>
                <Text style={[styles.summaryLabel, isTabletDevice && styles.tabletSummaryLabel]}>
                  Total Orders
                </Text>
                <View style={[styles.summaryTrend, isTabletDevice && styles.tabletSummaryTrend]}>
                  <ArrowUpRight size={isTabletDevice ? 16 : 14} color="#FFFFFF" />
                  <Text style={[styles.summaryTrendText, isTabletDevice && styles.tabletSummaryTrendText]}>
                    +15%
                  </Text>
                </View>
              </LinearGradient>
            </View>
            
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.summaryGradient}>
                <DollarSign size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.summaryNumber, isTabletDevice && styles.tabletSummaryNumber]}>
                  {formatCurrency(data.totalRevenue)}
                </Text>
                <Text style={[styles.summaryLabel, isTabletDevice && styles.tabletSummaryLabel]}>
                  Revenue
                </Text>
                <View style={[styles.summaryTrend, isTabletDevice && styles.tabletSummaryTrend]}>
                  <ArrowUpRight size={isTabletDevice ? 16 : 14} color="#FFFFFF" />
                  <Text style={[styles.summaryTrendText, isTabletDevice && styles.tabletSummaryTrendText]}>
                    {formatPercentage(data.growth)}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={[styles.reportSection, isTabletDevice && styles.tabletReportSection]}>
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              Top Products
            </Text>
            {data.topProducts?.map((product, index) => (
              <View key={index} style={[styles.listItem, isTabletDevice && styles.tabletListItem]}>
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, isTabletDevice && styles.tabletListItemTitle]}>
                    {product.name}
                  </Text>
                  <Text style={[styles.listItemSubtitle, isTabletDevice && styles.tabletListItemSubtitle]}>
                    Quantity: {product.quantity}
                  </Text>
                </View>
                <Text style={[styles.listItemValue, isTabletDevice && styles.tabletListItemValue]}>
                  {formatCurrency(product.revenue)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderSalesReport = () => {
    const data = reportData.sales;
    if (!data) return null;

    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={[
            styles.summaryCards, 
            isTabletDevice && styles.tabletSummaryCards
          ]}>
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.summaryGradient}>
                <DollarSign size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.summaryNumber, isTabletDevice && styles.tabletSummaryNumber]}>
                  {formatCurrency(data.totalSales)}
                </Text>
                <Text style={[styles.summaryLabel, isTabletDevice && styles.tabletSummaryLabel]}>
                  Total Sales
                </Text>
              </LinearGradient>
            </View>
            
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <LinearGradient colors={['#2563EB', '#1d4ed8']} style={styles.summaryGradient}>
                <Calendar size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.summaryNumber, isTabletDevice && styles.tabletSummaryNumber]}>
                  {formatCurrency(data.dailyAverage)}
                </Text>
                <Text style={[styles.summaryLabel, isTabletDevice && styles.tabletSummaryLabel]}>
                  Daily Average
                </Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={[styles.reportSection, isTabletDevice && styles.tabletReportSection]}>
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              Growth Metrics
            </Text>
            <View style={styles.growthMetrics}>
              <View style={[styles.growthItem, isTabletDevice && styles.tabletGrowthItem]}>
                <Text style={[styles.growthLabel, isTabletDevice && styles.tabletGrowthLabel]}>
                  Monthly Growth
                </Text>
                <View style={styles.growthValue}>
                  <ArrowUpRight size={isTabletDevice ? 20 : 16} color="#10b981" />
                  <Text style={[
                    styles.growthText, 
                    { color: '#10b981' },
                    isTabletDevice && styles.tabletGrowthText
                  ]}>
                    {formatPercentage(data.monthlyGrowth)}
                  </Text>
                </View>
              </View>
              <View style={[styles.growthItem, isTabletDevice && styles.tabletGrowthItem]}>
                <Text style={[styles.growthLabel, isTabletDevice && styles.tabletGrowthLabel]}>
                  Weekly Growth
                </Text>
                <View style={styles.growthValue}>
                  <ArrowUpRight size={isTabletDevice ? 20 : 16} color="#10b981" />
                  <Text style={[
                    styles.growthText, 
                    { color: '#10b981' },
                    isTabletDevice && styles.tabletGrowthText
                  ]}>
                    {formatPercentage(data.weeklyGrowth)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={[styles.reportSection, isTabletDevice && styles.tabletReportSection]}>
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              Top Salespeople
            </Text>
            {data.topSalespeople?.map((salesperson, index) => (
              <View key={index} style={[styles.listItem, isTabletDevice && styles.tabletListItem]}>
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, isTabletDevice && styles.tabletListItemTitle]}>
                    {salesperson.name}
                  </Text>
                  <Text style={[styles.listItemSubtitle, isTabletDevice && styles.tabletListItemSubtitle]}>
                    {salesperson.sales} sales
                  </Text>
                </View>
                <Text style={[styles.listItemValue, isTabletDevice && styles.tabletListItemValue]}>
                  {formatCurrency(salesperson.revenue)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderInventoryReport = () => {
    const data = reportData.inventory;
    if (!data) return null;

    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={[
            styles.summaryCards, 
            isTabletDevice && styles.tabletSummaryCards
          ]}>
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.summaryGradient}>
                <Package size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.summaryNumber, isTabletDevice && styles.tabletSummaryNumber]}>
                  {data.totalParts}
                </Text>
                <Text style={[styles.summaryLabel, isTabletDevice && styles.tabletSummaryLabel]}>
                  Total Parts
                </Text>
              </LinearGradient>
            </View>
            
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.summaryGradient}>
                <Package size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.summaryNumber, isTabletDevice && styles.tabletSummaryNumber]}>
                  {data.lowStockItems}
                </Text>
                <Text style={[styles.summaryLabel, isTabletDevice && styles.tabletSummaryLabel]}>
                  Low Stock Items
                </Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={[styles.reportSection, isTabletDevice && styles.tabletReportSection]}>
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              Inventory Value
            </Text>
            <View style={[styles.inventoryValueCard, isTabletDevice && styles.tabletInventoryValueCard]}>
              <LinearGradient 
                colors={['#059669', '#047857']} 
                style={[styles.inventoryValueGradient, isTabletDevice && styles.tabletInventoryValueGradient]}
              >
                <DollarSign size={isTabletDevice ? 32 : 28} color="#FFFFFF" />
                <Text style={[styles.inventoryValueAmount, isTabletDevice && styles.tabletInventoryValueAmount]}>
                  {formatCurrency(data.totalValue)}
                </Text>
                <Text style={[styles.inventoryValueLabel, isTabletDevice && styles.tabletInventoryValueLabel]}>
                  Total Inventory Value
                </Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={[styles.reportSection, isTabletDevice && styles.tabletReportSection]}>
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              Top Categories
            </Text>
            {data.topCategories?.map((category, index) => (
              <View key={index} style={[styles.listItem, isTabletDevice && styles.tabletListItem]}>
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, isTabletDevice && styles.tabletListItemTitle]}>
                    {category.category}
                  </Text>
                  <Text style={[styles.listItemSubtitle, isTabletDevice && styles.tabletListItemSubtitle]}>
                    {category.count} parts
                  </Text>
                </View>
                <Text style={[styles.listItemValue, isTabletDevice && styles.tabletListItemValue]}>
                  {formatCurrency(category.value)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderRetailersReport = () => {
    const data = reportData.retailers;
    if (!data) return null;

    return (
      <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(0).duration(600)}>
          <View style={[
            styles.summaryCards, 
            isTabletDevice && styles.tabletSummaryCards
          ]}>
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.summaryGradient}>
                <Users size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.summaryNumber, isTabletDevice && styles.tabletSummaryNumber]}>
                  {data.totalRetailers}
                </Text>
                <Text style={[styles.summaryLabel, isTabletDevice && styles.tabletSummaryLabel]}>
                  Total Retailers
                </Text>
              </LinearGradient>
            </View>
            
            <View style={[styles.summaryCard, isTabletDevice && styles.tabletSummaryCard]}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.summaryGradient}>
                <Users size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
                <Text style={[styles.summaryNumber, isTabletDevice && styles.tabletSummaryNumber]}>
                  {data.activeRetailers}
                </Text>
                <Text style={[styles.summaryLabel, isTabletDevice && styles.tabletSummaryLabel]}>
                  Active Retailers
                </Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={[styles.reportSection, isTabletDevice && styles.tabletReportSection]}>
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              New Retailers
            </Text>
            <View style={[styles.newRetailersCard, isTabletDevice && styles.tabletNewRetailersCard]}>
              <View style={[styles.newRetailersContent, isTabletDevice && styles.tabletNewRetailersContent]}>
                <View style={[styles.newRetailersIcon, isTabletDevice && styles.tabletNewRetailersIcon]}>
                  <Users size={isTabletDevice ? 32 : 28} color="#f59e0b" />
                </View>
                <View style={styles.newRetailersInfo}>
                  <Text style={[styles.newRetailersCount, isTabletDevice && styles.tabletNewRetailersCount]}>
                    {data.newRetailers}
                  </Text>
                  <Text style={[styles.newRetailersLabel, isTabletDevice && styles.tabletNewRetailersLabel]}>
                    New retailers joined this month
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={[styles.reportSection, isTabletDevice && styles.tabletReportSection]}>
            <Text style={[styles.sectionTitle, isTabletDevice && styles.tabletSectionTitle]}>
              Top Retailers
            </Text>
            {data.topRetailers?.map((retailer, index) => (
              <View key={index} style={[styles.listItem, isTabletDevice && styles.tabletListItem]}>
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, isTabletDevice && styles.tabletListItemTitle]}>
                    {retailer.name}
                  </Text>
                  <Text style={[styles.listItemSubtitle, isTabletDevice && styles.tabletListItemSubtitle]}>
                    {retailer.orders} orders
                  </Text>
                </View>
                <Text style={[styles.listItemValue, isTabletDevice && styles.tabletListItemValue]}>
                  {formatCurrency(retailer.revenue)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderCurrentReport = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'orders':
        return renderOrdersReport();
      case 'sales':
        return renderSalesReport();
      case 'inventory':
        return renderInventoryReport();
      case 'retailers':
        return renderRetailersReport();
      default:
        return renderOverviewReport();
    }
  };

  const handleExport = () => {
    // Implement export functionality here
    console.log('Export button pressed');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading reports..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadReportData} />;
  }

  const tabs = getReportTabs();

  return (
    <PlatformSafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.headerGradient, isTabletDevice && styles.tabletHeaderGradient]}
        >
          <View style={styles.headerContent}>
            <HamburgerMenu />
            
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, isTabletDevice && styles.tabletHeaderTitle]}>
                Reports & Analytics
              </Text>
              <Text style={[styles.headerSubtitle, isTabletDevice && styles.tabletHeaderSubtitle]}>
                Business insights and performance metrics
              </Text>
            </View>
            
            <ModernButton
              title="Export"
              icon={<Download size={isTabletDevice ? 20 : 16} color="#fff" />}
              variant="primary"
              size="small"
              onPress={handleExport}
              style={{ marginLeft: 8 }}
            />
          </View>
        </LinearGradient>
      </View>

      {/* Report Tabs */}
      <View style={[styles.tabContainer, isTabletDevice && styles.tabletTabContainer]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabScroll}
          contentContainerStyle={isTabletDevice && styles.tabletTabScrollContent}
        >
          {tabs.map((tab, index) => (
            <Animated.View key={tab.key} entering={FadeInDown.delay(index * 100).duration(600)}>
              <ModernButton
                title={tab.title}
                onPress={() => setSelectedReport(tab.key as ReportType)}
                icon={<tab.icon size={isTabletDevice ? 24 : 20} color={selectedReport === tab.key ? '#FFFFFF' : '#64748B'} />}
                variant={selectedReport === tab.key ? 'primary' : 'outline'}
                size={isTabletDevice ? 'medium' : 'small'}
                style={selectedReport === tab.key ? 
                  [styles.tab, styles.activeTab, isTabletDevice && styles.tabletTab] : 
                  [styles.tab, isTabletDevice && styles.tabletTab]
                }
              />
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Report Content */}
      <View style={[
        styles.content, 
        isTabletDevice && styles.tabletContent
      ]}>
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}>
          {renderCurrentReport()}
        </RefreshControl>
      </View>
    </PlatformSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabletTabContainer: {
    paddingVertical: 12,
  },
  tabScroll: {
    paddingHorizontal: 16,
  },
  tabletTabScrollContent: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  tabletTab: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginRight: 12,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabletContent: {
    paddingHorizontal: 24,
  },
  reportContent: {
    flex: 1,
    paddingVertical: 16,
  },
  multiColumnContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    marginTop: 8,
  },
  tabletSectionTitle: {
    fontSize: 24,
    marginBottom: 20,
    marginTop: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  tabletMetricsGrid: {
    gap: 16,
    marginBottom: 40,
  },
  multiColumnMetricsGrid: {
    marginBottom: 0,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
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
  tabletMetricCard: {
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  metricGradient: {
    padding: 20,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  tabletMetricValue: {
    fontSize: 32,
    marginTop: 16,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  tabletMetricLabel: {
    fontSize: 16,
    marginBottom: 12,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tabletMetricTrend: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  metricTrendText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  tabletMetricTrendText: {
    fontSize: 14,
    marginLeft: 6,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  tabletQuickStatsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  multiColumnQuickStatsContainer: {
    marginBottom: 0,
  },
  quickStatCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
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
  tabletQuickStatCard: {
    borderRadius: 20,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  quickStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tabletQuickStatIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 16,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  tabletQuickStatValue: {
    fontSize: 26,
    marginBottom: 6,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  tabletQuickStatLabel: {
    fontSize: 14,
  },
  topPerformersContainer: {
    gap: 16,
    marginBottom: 32,
  },
  tabletTopPerformersContainer: {
    gap: 20,
    marginBottom: 40,
  },
  multiColumnTopPerformersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    flex: 1,
  },
  tabletPerformerCard: {
    borderRadius: 20,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  performerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  tabletPerformerTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  performerName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  tabletPerformerName: {
    fontSize: 16,
  },
  performerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  tabletPerformerValue: {
    fontSize: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabletSummaryCards: {
    gap: 16,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
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
  tabletSummaryCard: {
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  summaryGradient: {
    padding: 20,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  tabletSummaryNumber: {
    fontSize: 28,
    marginTop: 12,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  tabletSummaryLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  summaryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tabletSummaryTrend: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryTrendText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 2,
  },
  tabletSummaryTrendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  reportSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabletReportSection: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  growthMetrics: {
    gap: 16,
  },
  growthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabletGrowthItem: {
    paddingVertical: 16,
  },
  growthLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  tabletGrowthLabel: {
    fontSize: 18,
  },
  growthValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  tabletGrowthText: {
    fontSize: 18,
    marginLeft: 6,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabletListItem: {
    paddingVertical: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  tabletListItemTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  tabletListItemSubtitle: {
    fontSize: 14,
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  tabletListItemValue: {
    fontSize: 16,
  },
  inventoryValueCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
  },
  tabletInventoryValueCard: {
    borderRadius: 20,
    marginVertical: 12,
  },
  inventoryValueGradient: {
    padding: 24,
    alignItems: 'center',
  },
  tabletInventoryValueGradient: {
    padding: 32,
  },
  inventoryValueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 12,
  },
  tabletInventoryValueAmount: {
    fontSize: 40,
    marginVertical: 16,
  },
  inventoryValueLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  tabletInventoryValueLabel: {
    fontSize: 18,
  },
  newRetailersCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  tabletNewRetailersCard: {
    borderRadius: 20,
    padding: 24,
    marginVertical: 12,
  },
  newRetailersContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabletNewRetailersContent: {
    padding: 8,
  },
  newRetailersIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tabletNewRetailersIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 24,
  },
  newRetailersInfo: {
    flex: 1,
  },
  newRetailersCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D97706',
    marginBottom: 4,
  },
  tabletNewRetailersCount: {
    fontSize: 36,
    marginBottom: 8,
  },
  newRetailersLabel: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  tabletNewRetailersLabel: {
    fontSize: 16,
  },
});