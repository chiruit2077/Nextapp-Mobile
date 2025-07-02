import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize, Platform, PixelRatio } from 'react-native';

// Device size breakpoints
const BREAKPOINTS = {
  smallPhone: 320,
  phone: 375,
  largePhone: 414,
  tablet: 768,
  largeTablet: 1024,
};

// Device type detection with improved accuracy
export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;
  
  // Check if device is explicitly an iPad
  if (Platform.OS === 'ios' && Platform.isPad) {
    return true;
  }
  
  // Use screen dimensions and pixel density for detection
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = width * pixelDensity;
  const adjustedHeight = height * pixelDensity;
  
  // For iOS, use aspect ratio and screen size
  if (Platform.OS === 'ios') {
    return aspectRatio < 1.6 && Math.min(width, height) >= 768;
  } 
  
  // For Android, use a combination of factors
  return (
    (aspectRatio < 1.6 && Math.max(width, height) >= 768) || 
    (pixelDensity < 2 && Math.min(adjustedWidth, adjustedHeight) >= 1000)
  );
};

export const isLargePhone = (): boolean => {
  const { width } = Dimensions.get('window');
  return width >= BREAKPOINTS.largePhone && !isTablet();
};

export const isSmallPhone = (): boolean => {
  const { width } = Dimensions.get('window');
  return width <= BREAKPOINTS.smallPhone;
};

// Get font scale based on device type
export const getFontScale = (): number => {
  const baseScale = PixelRatio.getFontScale();
  
  if (isTablet()) {
    // Slightly larger fonts on tablets
    return baseScale * 1.1;
  } else if (isSmallPhone()) {
    // Slightly smaller fonts on small phones
    return baseScale * 0.9;
  }
  
  return baseScale;
};

// Get responsive size based on screen width
export const getResponsiveSize = (size: number, factor: number = 0.5): number => {
  const { width } = Dimensions.get('window');
  return size + (width / 400) * factor * size;
};

// Hook for responsive dimensions
export function useResponsiveDimensions() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription.remove();
  }, []);
  
  const { width, height } = dimensions;
  const isLandscape = width > height;
  
  return {
    width,
    height,
    isLandscape,
    isTablet: isTablet(),
    isLargePhone: isLargePhone(),
    isSmallPhone: isSmallPhone(),
    fontScale: getFontScale(),
  };
}

// Hook for responsive styles
export const useResponsiveStyles = <T extends Record<string, any>>(
  styleCreator: (dimensions: ScaledSize, deviceInfo: {
    isTablet: boolean;
    isLargePhone: boolean;
    isSmallPhone: boolean;
    isLandscape: boolean;
    fontScale: number;
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
  
  const deviceInfo = {
    isTablet: isTablet(),
    isLargePhone: isLargePhone(),
    isSmallPhone: isSmallPhone(),
    isLandscape,
    fontScale: getFontScale(),
  };
  
  return styleCreator(dimensions, deviceInfo);
};