import React from 'react';
import { View, StyleSheet, Dimensions, Platform, ScaledSize } from 'react-native';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: any;
}

// Device type detection
export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;
  
  // Different aspect ratio thresholds for iOS and Android
  if (Platform.OS === 'ios') {
    return aspectRatio < 1.6;
  } else {
    return aspectRatio < 1.6 && Math.max(width, height) >= 900;
  }
};

// Platform-specific padding values
export const getPlatformPadding = () => {
  if (Platform.OS === 'ios') {
    return isTablet() ? 24 : 16;
  } else {
    return isTablet() ? 20 : 12;
  }
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children, style }) => {
  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const getContainerStyle = (size: ScaledSize) => {
    const { width } = size;
    
    // Tablet-specific styles
    if (isTablet()) {
      return {
        maxWidth: Math.min(width * 0.9, 700),
        marginHorizontal: 'auto',
        paddingHorizontal: getPlatformPadding(),
      };
    }
    
    // Phone styles
    return {
      width: '100%',
      paddingHorizontal: getPlatformPadding(),
    };
  };

  return (
    <View style={[styles.container, getContainerStyle(dimensions), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});