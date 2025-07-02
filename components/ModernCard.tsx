import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isTablet } from '@/hooks/useResponsiveStyles';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'gradient' | 'glass' | 'elevated';
  gradientColors?: string[];
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  gradientColors = ['#667eea', '#764ba2'],
}) => {
  const Component = onPress ? TouchableOpacity : View;
  const isTabletDevice = isTablet();

  // Platform-specific shadow styles
  const getShadowStyle = () => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: isTabletDevice ? 6 : 4,
        },
        shadowOpacity: isTabletDevice ? 0.15 : 0.1,
        shadowRadius: isTabletDevice ? 16 : 12,
      };
    } else {
      return {
        elevation: isTabletDevice ? 10 : 8,
      };
    }
  };

  if (variant === 'gradient') {
    return (
      <Component
        style={[
          styles.container, 
          getShadowStyle(),
          isTabletDevice && styles.tabletContainer,
          style
        ]}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            isTabletDevice && styles.tabletGradient
          ]}
        >
          {children}
        </LinearGradient>
      </Component>
    );
  }

  return (
    <Component
      style={[
        styles.container,
        variant === 'glass' && styles.glass,
        variant === 'elevated' && styles.elevated,
        getShadowStyle(),
        isTabletDevice && styles.tabletContainer,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.95 : 1}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    // Shadow styles are applied dynamically based on platform
  },
  tabletContainer: {
    borderRadius: 24,
    padding: 24,
    marginVertical: 12,
  },
  gradient: {
    borderRadius: 20,
    padding: 20,
  },
  tabletGradient: {
    borderRadius: 24,
    padding: 24,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  elevated: {
    backgroundColor: '#FFFFFF',
  },
});