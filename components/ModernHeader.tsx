import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isTablet } from '@/hooks/useResponsiveStyles';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  leftButton?: React.ReactNode | {
    icon?: React.ReactNode;
    title?: string;
    onPress: () => void;
  };
  rightButton?: {
    icon?: React.ReactNode;
    title?: string;
    onPress: () => void;
  };
  variant?: 'default' | 'gradient' | 'glass' | 'minimal';
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  leftButton,
  rightButton,
  variant = 'default',
  showBackButton = false,
  onBackPress,
}) => {
  const insets = useSafeAreaInsets();
  const isTabletDevice = isTablet();
  
  // Calculate proper padding for status bar
  const getStatusBarPadding = () => {
    if (Platform.OS === 'ios') {
      return insets.top || 50;
    } else {
      return StatusBar.currentHeight || 30;
    }
  };

  const renderContent = () => (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {showBackButton && onBackPress && (
          <TouchableOpacity
            style={[styles.backButton, isTabletDevice && styles.tabletBackButton]}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <ChevronLeft size={isTabletDevice ? 28 : 24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {typeof leftButton === 'object' && leftButton !== null && 'onPress' in leftButton ? (
          <TouchableOpacity
            style={[styles.actionButton, isTabletDevice && styles.tabletActionButton]}
            onPress={leftButton.onPress}
            activeOpacity={0.7}
          >
            {leftButton.icon || <ChevronLeft size={isTabletDevice ? 28 : 24} color="#FFFFFF" />}
            {leftButton.title && (
              <Text style={[styles.buttonText, isTabletDevice && styles.tabletButtonText]}>
                {leftButton.title}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          leftButton
        )}
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text 
          style={[styles.title, isTabletDevice && styles.tabletTitle]} 
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text 
            style={[styles.subtitle, isTabletDevice && styles.tabletSubtitle]} 
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {rightButton && (
          <TouchableOpacity
            style={[
              styles.actionButton, 
              isTabletDevice && styles.tabletActionButton,
              rightButton.title && styles.actionButtonWithTitle
            ]}
            onPress={rightButton.onPress}
            activeOpacity={0.7}
          >
            {rightButton.title && (
              <Text style={[styles.buttonText, isTabletDevice && styles.tabletButtonText]}>
                {rightButton.title}
              </Text>
            )}
            {rightButton.icon || <MoreHorizontal size={isTabletDevice ? 28 : 24} color="#FFFFFF" />}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  if (variant === 'gradient') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.container, 
            { paddingTop: getStatusBarPadding() },
            isTabletDevice && styles.tabletContainer
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </>
    );
  }

  if (variant === 'glass') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <BlurView 
          intensity={80} 
          style={[
            styles.container, 
            { paddingTop: getStatusBarPadding() },
            isTabletDevice && styles.tabletContainer
          ]}
        >
          <View style={styles.glassOverlay}>
            {renderContent()}
          </View>
        </BlurView>
      </>
    );
  }

  if (variant === 'minimal') {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View 
          style={[
            styles.container, 
            styles.minimal, 
            { paddingTop: getStatusBarPadding() },
            isTabletDevice && styles.tabletContainer
          ]}
        >
          {renderContent()}
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <View 
        style={[
          styles.container, 
          styles.default, 
          { paddingTop: getStatusBarPadding() },
          isTabletDevice && styles.tabletContainer
        ]}
      >
        {renderContent()}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  tabletContainer: {
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  default: {
    backgroundColor: '#667eea',
  },
  minimal: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  titleSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabletActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  actionButtonWithTitle: {
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  tabletButtonText: {
    fontSize: 18,
    marginHorizontal: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tabletTitle: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  tabletSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
});