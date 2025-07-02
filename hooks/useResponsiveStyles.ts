import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize, Platform, StyleSheet } from 'react-native';

// Device size breakpoints
const BREAKPOINTS = {
  smallPhone: 320,
  phone: 375,
  largePhone: 414,
  tablet: 768,
  largeTablet: 1024,
};

// Device type detection
export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;
  
  if (Platform.OS === 'ios') {
    return Platform.isPad || aspectRatio < 1.6;
  } else {
    return aspectRatio < 1.6 && Math.max(width, height) >= 768;
  }
};

export const isLargePhone = (): boolean => {
  const { width } = Dimensions.get('window');
  return width >= BREAKPOINTS.largePhone && !isTablet();
};

export const isSmallPhone = (): boolean => {
  const { width } = Dimensions.get('window');
  return width <= BREAKPOINTS.smallPhone;
};

export const useResponsiveStyles = <T extends Record<string, any>>(
  styleCreator: (dimensions: ScaledSize, deviceType: {
    isTablet: boolean;
    isLargePhone: boolean;
    isSmallPhone: boolean;
    isLandscape: boolean;
  }) => T
): T => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription.remove();
  }, []);
  
  const { width, height } = dimensions;
  const isLandscape = width > height;
  
  const deviceType = {
    isTablet: isTablet(),
    isLargePhone: isLargePhone(),
    isSmallPhone: isSmallPhone(),
    isLandscape,
  };
  
  return styleCreator(dimensions, deviceType);
};

// Helper to create responsive styles
export const createResponsiveStyles = <T extends StyleSheet.NamedStyles<T>>(
  styleCreator: (dimensions: ScaledSize, deviceType: {
    isTablet: boolean;
    isLargePhone: boolean;
    isSmallPhone: boolean;
    isLandscape: boolean;
  }) => T
): T => {
  const dimensions = Dimensions.get('window');
  const { width, height } = dimensions;
  const isLandscape = width > height;
  
  const deviceType = {
    isTablet: isTablet(),
    isLargePhone: isLargePhone(),
    isSmallPhone: isSmallPhone(),
    isLandscape,
  };
  
  return StyleSheet.create(styleCreator(dimensions, deviceType));
};