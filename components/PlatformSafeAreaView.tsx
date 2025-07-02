import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface PlatformSafeAreaViewProps {
  children: React.ReactNode;
  style?: any;
  gradientHeader?: boolean;
  gradientColors?: string[];
}

export const PlatformSafeAreaView: React.FC<PlatformSafeAreaViewProps> = ({
  children,
  style,
  gradientHeader = false,
  gradientColors = ['#667eea', '#764ba2'],
}) => {
  const insets = useSafeAreaInsets();
  
  // Apply gradient to status bar area if gradientHeader is true
  if (gradientHeader) {
    return (
      <View style={[styles.container, style]}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent" 
          translucent={true} 
        />
        
        {/* Gradient for status bar area */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0,
            zIndex: 1000,
          }}
        />
        
        {children}
      </View>
    );
  }

  // Standard safe area view without gradient
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]} edges={['right', 'left']}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});