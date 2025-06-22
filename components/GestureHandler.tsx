import React, { useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useInputStore } from '@/src/stores/inputStore';
import { useSettingsStore } from '@/src/stores/settingsStore';

interface GestureHandlerProps {
  children: React.ReactNode;
  onSwipeUp: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onDoubleTap: () => void;
  onPinch: (scale: number) => void;
  onShake: () => void;
}

export function GestureHandler({
  children,
  onSwipeUp,
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  onPinch,
  onShake,
}: GestureHandlerProps) {
  const { voiceSettings } = useSettingsStore();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const triggerHaptic = () => {
    if (voiceSettings.enableHapticFeedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Pan gesture for swipe detection
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const { translationX, translationY, velocityX, velocityY } = event;
      
      // Reset position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);

      // Determine swipe direction based on velocity and distance
      const minSwipeDistance = 50;
      const minSwipeVelocity = 500;

      if (
        Math.abs(translationY) > minSwipeDistance &&
        Math.abs(velocityY) > minSwipeVelocity
      ) {
        if (translationY < 0) {
          // Swipe up
          runOnJS(triggerHaptic)();
          runOnJS(onSwipeUp)();
        }
      } else if (
        Math.abs(translationX) > minSwipeDistance &&
        Math.abs(velocityX) > minSwipeVelocity
      ) {
        if (translationX < 0) {
          // Swipe left
          runOnJS(triggerHaptic)();
          runOnJS(onSwipeLeft)();
        } else {
          // Swipe right
          runOnJS(triggerHaptic)();
          runOnJS(onSwipeRight)();
        }
      }
    });

  // Double tap gesture
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(triggerHaptic)();
      runOnJS(onDoubleTap)();
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd((event) => {
      scale.value = withSpring(1);
      runOnJS(onPinch)(event.scale);
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    panGesture,
    doubleTapGesture,
    pinchGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.gestureArea, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureArea: {
    flex: 1,
  },
});