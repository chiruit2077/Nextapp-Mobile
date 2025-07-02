import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface PlatformSafeAreaViewProps {
  children: React.ReactNode;
  style?: any;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  gradientHeader?: boolean;
  gradientColors?: string[];
}

export const PlatformSafeAreaView: React.FC<PlatformSafeAreaViewProps> = ({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
  gradientHeader = false,
  gradientColors = ['#667eea', '#764ba2'],
}) => {
  const insets = useSafeAreaInsets();
  
  // If gradient header is enabled, render a LinearGradient at the top
  if (gradientHeader) {
    return (
      <View style={[styles.container, style]}>
        {/* Gradient status bar background */}
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.statusBarGradient,
            { height: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0 }
          ]}
        />
        
        {/* Main content */}
        {Platform.OS === 'ios' ? (
          <SafeAreaView style={styles.contentContainer} edges={edges.filter(edge => edge !== 'top')}>
            {children}
          </SafeAreaView>
        ) : (
          <View style={styles.contentContainer}>
            {children}
          </View>
        )}
      </View>
    );
  }

  // Standard safe area view without gradient
  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={[styles.container, style]} edges={edges}>
        {children}
      </SafeAreaView>
    );
  }

  // For Android, use View with StatusBar height padding
  return (
    <View 
      style={[
        styles.container, 
        { paddingTop: edges.includes('top') ? StatusBar.currentHeight || 0 : 0 },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  statusBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  }
});