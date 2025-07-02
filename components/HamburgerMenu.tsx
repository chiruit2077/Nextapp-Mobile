import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Chrome as Home, Package, ShoppingCart, Users, ChartBar as BarChart3, User, Grid3x3, Settings, LogOut, Info, CircleHelp as HelpCircle, Zap, FileText, Building } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInRight, SlideOutRight, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { isTablet } from '@/hooks/useResponsiveStyles';

const { width, height } = Dimensions.get('window');

interface HamburgerMenuProps {
  onLogout?: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const isTabletDevice = isTablet();

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isOpen) {
        setIsOpen(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  const handleNavigation = (route: string) => {
    setIsOpen(false);
    router.push(route);
  };

  const getMenuItems = () => {
    const role = user?.role || '';
    const menuItems = [];

    // Main navigation
    menuItems.push(
      { 
        id: 'dashboard', 
        title: 'Dashboard', 
        icon: Home, 
        route: '/(tabs)/',
        color: '#667eea',
      },
      { 
        id: 'orders', 
        title: role === 'retailer' ? 'My Orders' : 'Orders', 
        icon: ShoppingCart, 
        route: '/(tabs)/orders',
        color: '#f59e0b',
      }
    );

    // Role-based items
    if (['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'].includes(role)) {
      menuItems.push({
        id: 'parts',
        title: role === 'retailer' ? 'Parts Catalog' : 'Parts Management',
        icon: Package,
        route: '/(tabs)/parts',
        color: '#10b981',
      });
    }

    if (['super_admin', 'admin', 'manager', 'salesman'].includes(role)) {
      menuItems.push({
        id: 'retailers',
        title: 'Retailers',
        icon: Users,
        route: '/(tabs)/retailers',
        color: '#8b5cf6',
      });
    }

    if (['super_admin', 'admin', 'manager', 'storeman'].includes(role)) {
      menuItems.push({
        id: 'inventory',
        title: 'Inventory',
        icon: Grid3x3,
        route: '/(tabs)/inventory',
        color: '#ef4444',
      });
    }

    if (['super_admin', 'admin', 'manager', 'storeman', 'salesman'].includes(role)) {
      menuItems.push({
        id: 'reports',
        title: 'Reports & Analytics',
        icon: BarChart3,
        route: '/(tabs)/reports',
        color: '#0891b2',
      });
    }

    // Add profile and settings
    menuItems.push(
      { 
        id: 'profile', 
        title: 'My Profile', 
        icon: User, 
        route: '/(tabs)/profile',
        color: '#6366f1',
      }
    );

    // Add divider
    menuItems.push({ id: 'divider', title: 'divider', isDivider: true });

    // Add help and support
    menuItems.push(
      { 
        id: 'help', 
        title: 'Help & Support', 
        icon: HelpCircle, 
        route: '#',
        color: '#64748b',
      },
      { 
        id: 'about', 
        title: 'About', 
        icon: Info, 
        route: '#',
        color: '#64748b',
      }
    );

    return menuItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      <TouchableOpacity
        style={[styles.menuButton, isTabletDevice && styles.tabletMenuButton]}
        onPress={() => setIsOpen(true)}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Menu size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.modalBackdrop}
          >
            <TouchableOpacity
              style={styles.backdropTouchable}
              activeOpacity={1}
              onPress={() => setIsOpen(false)}
            />
          </Animated.View>

          <Animated.View
            entering={SlideInRight.duration(300)}
            exiting={SlideOutRight.duration(300)}
            style={[
              styles.menuContainer,
              isTabletDevice && styles.tabletMenuContainer
            ]}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} style={styles.menuBlur}>
                <SafeAreaView style={styles.menuContent}>
                  <MenuContent 
                    user={user} 
                    menuItems={menuItems} 
                    onClose={() => setIsOpen(false)} 
                    onNavigation={handleNavigation}
                    onLogout={handleLogout}
                    isTablet={isTabletDevice}
                  />
                </SafeAreaView>
              </BlurView>
            ) : (
              <View style={styles.menuAndroid}>
                <SafeAreaView style={styles.menuContent}>
                  <MenuContent 
                    user={user} 
                    menuItems={menuItems} 
                    onClose={() => setIsOpen(false)} 
                    onNavigation={handleNavigation}
                    onLogout={handleLogout}
                    isTablet={isTabletDevice}
                  />
                </SafeAreaView>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

interface MenuContentProps {
  user: any;
  menuItems: any[];
  onClose: () => void;
  onNavigation: (route: string) => void;
  onLogout: () => void;
  isTablet: boolean;
}

const MenuContent: React.FC<MenuContentProps> = ({ 
  user, 
  menuItems, 
  onClose, 
  onNavigation,
  onLogout,
  isTablet
}) => {
  return (
    <>
      <View style={[styles.menuHeader, isTablet && styles.tabletMenuHeader]}>
        <View style={styles.headerContent}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={[styles.userAvatar, isTablet && styles.tabletUserAvatar]}
          >
            <User size={isTablet ? 40 : 32} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, isTablet && styles.tabletUserName]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[styles.userRole, isTablet && styles.tabletUserRole]}>
              {getRoleDisplayName(user?.role || '')}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.closeButton, isTablet && styles.tabletCloseButton]} 
          onPress={onClose}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <X size={isTablet ? 28 : 24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.menuItems} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={isTablet && styles.tabletMenuItemsContent}
      >
        {menuItems.map((item, index) => {
          if (item.isDivider) {
            return <View key={`divider-${index}`} style={styles.divider} />;
          }

          return (
            <Animated.View 
              key={item.id}
              entering={FadeIn.delay(index * 50).duration(300)}
            >
              <TouchableOpacity
                style={[styles.menuItem, isTablet && styles.tabletMenuItem]}
                onPress={() => item.route === '#' ? null : onNavigation(item.route)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.menuItemIcon, 
                  { backgroundColor: `${item.color}20` },
                  isTablet && styles.tabletMenuItemIcon
                ]}>
                  <item.icon size={isTablet ? 24 : 20} color={item.color} />
                </View>
                <Text style={[styles.menuItemText, isTablet && styles.tabletMenuItemText]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={[styles.menuFooter, isTablet && styles.tabletMenuFooter]}>
        <TouchableOpacity 
          style={[styles.logoutButton, isTablet && styles.tabletLogoutButton]} 
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <LogOut size={isTablet ? 24 : 20} color="#ef4444" />
          <Text style={[styles.logoutText, isTablet && styles.tabletLogoutText]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'Super Administrator';
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'storeman':
      return 'Store Manager';
    case 'salesman':
      return 'Salesman';
    case 'retailer':
      return 'Retailer';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

const styles = StyleSheet.create({
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tabletMenuButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  menuContainer: {
    width: width * 0.8,
    maxWidth: 360,
    height: '100%',
  },
  tabletMenuContainer: {
    maxWidth: 400,
  },
  menuBlur: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  menuAndroid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabletMenuHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tabletUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  tabletUserName: {
    fontSize: 20,
    marginBottom: 6,
  },
  userRole: {
    fontSize: 14,
    color: '#64748b',
  },
  tabletUserRole: {
    fontSize: 16,
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
  menuItems: {
    flex: 1,
    paddingVertical: 8,
  },
  tabletMenuItemsContent: {
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  tabletMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tabletMenuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  tabletMenuItemText: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  menuFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tabletMenuFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  tabletLogoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
  tabletLogoutText: {
    fontSize: 18,
    marginLeft: 16,
  },
});