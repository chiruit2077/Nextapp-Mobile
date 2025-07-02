import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface PlatformSafeAreaViewProps {
  children: React.ReactNode;
  style?: any;
  gradient?: boolean;
  gradientColors?: string[];
}

export const PlatformSafeAreaView: React.FC<PlatformSafeAreaViewProps> = ({
  children,
  style,
  gradient = false,
  gradientColors = ['#667eea', '#764ba2'],
}) => {
  if (Platform.OS === 'web') {
    if (gradient) {
      return (
        <>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, style]}
          >
            {children}
          </LinearGradient>
        </>
      );
    }
    
    return (
      <View style={[styles.container, style]}>
        {children}
      </View>
    );
  }

  if (gradient) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, style]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'left']}>
            {children}
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]} edges={['top', 'right', 'left']}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});