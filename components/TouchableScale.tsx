import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  Easing
} from 'react-native-reanimated';

interface TouchableScaleProps extends TouchableOpacityProps {
  scaleAmount?: number;
  children: React.ReactNode;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const TouchableScale: React.FC<TouchableScaleProps> = ({
  scaleAmount = 0.97,
  children,
  style,
  ...props
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Platform-specific animation configurations
  const getSpringConfig = () => {
    if (Platform.OS === 'ios') {
      return {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
      };
    } else {
      return {
        damping: 12,
        stiffness: 120,
        mass: 0.6,
      };
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleAmount, getSpringConfig());
    opacity.value = withTiming(0.9, { duration: 150, easing: Easing.ease });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, getSpringConfig());
    opacity.value = withTiming(1, { duration: 150, easing: Easing.ease });
  };

  return (
    <AnimatedTouchable
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedTouchable>
  );
};