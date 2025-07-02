import React from 'react';
import { View, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';

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
  // Calculate platform-specific top padding
  const getTopPadding = () => {
    if (Platform.OS === 'android') {
      return StatusBar.currentHeight || 0;
    }
    return 0;
  };

  // Calculate platform-specific bottom padding
  const getBottomPadding = () => {
    if (Platform.OS === 'ios') {
      // iPhone X and newer have a bottom safe area
      return Platform.isPad ? 20 : 34;
    }
    return 0;
  };

  // Apply padding based on specified edges
  const getPadding = () => {
    const padding = {
      paddingTop: edges.includes('top') ? getTopPadding() : 0,
      paddingRight: edges.includes('right') ? 0 : 0,
      paddingBottom: edges.includes('bottom') ? getBottomPadding() : 0,
      paddingLeft: edges.includes('left') ? 0 : 0,
    };
    return padding;
  };

  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={[styles.container, style]}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, getPadding(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});