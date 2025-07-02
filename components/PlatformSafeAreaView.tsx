import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlatformSafeAreaViewProps {
  children: React.ReactNode;
  style?: any;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export const PlatformSafeAreaView: React.FC<PlatformSafeAreaViewProps> = ({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
}) => {
  // For iOS, use SafeAreaView
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
});